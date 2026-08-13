import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import EEGWave from "../../../components/common/EEGWave";
import {
    CheckCircle2,
    Wifi,
    Signal,
    ArrowRight,
    Headset,
    PersonStanding,
    Radio,
    Smile,
    Accessibility,
    VolumeX,
    Brain,
    WifiOff,
    AlertCircle
} from "lucide-react";

// --- HELPER: UUID Validation & Cleaning ---
const isValidUuid = (val) => {
    if (!val || typeof val !== "string") return false;
    if (val === "undefined" || val === "null") return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
};

const cleanVal = (val) => {
    if (!val || val === "undefined" || val === "null") return null;
    return val;
};

/**
 * Clears active assessment completion/draft storage keys to prevent 
 * immediate auto-redirects when mounting WrittenAssessment.jsx
 */
const clearAssessmentStorage = (...idKeys) => {
    const keysToClean = new Set(["active_assessment", ...idKeys.filter(Boolean)]);
    
    keysToClean.forEach((key) => {
        localStorage.removeItem(`assessment_completed_${key}`);
        localStorage.removeItem(`assessment_end_time_${key}`);
        localStorage.removeItem(`trainee_answers_draft_${key}`);
        localStorage.removeItem(`trainee_current_question_${key}`);
    });
};

export default function Prepare() {
    const navigate = useNavigate();
    const { state } = useLocation();

    // Preserve full navigation state with sanitized localStorage fallbacks
    const assignmentId = cleanVal(
        state?.assignmentId ||
        state?.assessment?.id ||
        localStorage.getItem("active_assignment_id")
    );

    const assessmentId = cleanVal(
        state?.assessmentId ||
        state?.assessment?.assessment_id ||
        localStorage.getItem("active_assignment_id_ref")
    );

    const traineeId = cleanVal(
        state?.traineeId ||
        state?.trainee_id ||
        localStorage.getItem("trainee_id") ||
        localStorage.getItem("user_id")
    );

    const [assessment] = useState(state?.assessment || null);
    const [fetchedBaselineId, setFetchedBaselineId] = useState(
        cleanVal(state?.baselineId) || cleanVal(localStorage.getItem("active_baseline_id"))
    );
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Save valid IDs into localStorage so state survives page refreshes
    useEffect(() => {
        if (isValidUuid(assignmentId)) localStorage.setItem("active_assignment_id", assignmentId);
        if (isValidUuid(assessmentId)) localStorage.setItem("active_assignment_id_ref", assessmentId);
        if (isValidUuid(traineeId)) localStorage.setItem("trainee_id", traineeId);
    }, [assignmentId, assessmentId, traineeId]);

    // ==========================================================
    // SUPABASE DATA FETCHING (BASELINE RESOLUTION)
    // ==========================================================
    useEffect(() => {
        async function fetchAssessmentAndBaselineData() {
            setLoadingData(true);
            try {
                // Fetch active baseline for trainee if baseline ID isn't set yet
                if (!fetchedBaselineId && isValidUuid(traineeId)) {
                    const { data: baselineData, error: baselineError } = await supabase
                        .from("eeg_baselines")
                        .select("id")
                        .eq("trainee_id", traineeId)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!baselineError && baselineData?.id) {
                        setFetchedBaselineId(baselineData.id);
                        localStorage.setItem("active_baseline_id", baselineData.id);
                    }
                }
            } catch (err) {
                console.error("Error fetching baseline in Prepare.jsx:", err);
            } finally {
                setLoadingData(false);
            }
        }

        fetchAssessmentAndBaselineData();
    }, [traineeId, fetchedBaselineId]);

    // ==========================================================
    // WEBSOCKET REALTIME HARDWARE MONITORING
    // ==========================================================
    const MIDDLEWARE_WS_URL = "ws://127.0.0.1:8000/ws/eeg";

    const [wsConnected, setWsConnected] = useState(false);
    const [deviceConnected, setDeviceConnected] = useState(false);
    const [signalQuality, setSignalQuality] = useState("No Signal");
    const wsRef = useRef(null);

    useEffect(() => {
        let ws;

        const connectWebSocket = () => {
            ws = new WebSocket(MIDDLEWARE_WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setDeviceConnected(!!data.device_connected);
                    setSignalQuality(data.signal_quality || "No Signal");
                } catch (err) {
                    console.error("Error parsing WebSocket packet in Prepare:", err);
                }
            };

            ws.onerror = () => {
                setWsConnected(false);
                setDeviceConnected(false);
                setSignalQuality("No Signal");
            };

            ws.onclose = () => {
                setWsConnected(false);
                setDeviceConnected(false);
                setSignalQuality("No Signal");
                setTimeout(connectWebSocket, 2000);
            };
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
        };
    }, []);

    // EEG Readiness evaluates if device is connected & receiving good signal
    const eegReady = deviceConnected && (signalQuality === "Good" || signalQuality === "Fair");

    const ASSESSMENT_STATUS = {
        PENDING: "Pending",
        ONGOING: "Ongoing",
        COMPLETED: "Completed",
    };

    if (!assessment && !assignmentId && !assessmentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold text-slate-800">
                    Assessment details missing or expired.
                </h2>

                <button
                    onClick={() => navigate("/trainee/assessment")}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                    Back to Assessments
                </button>
            </div>
        );
    }

    // ==========================================================
    // START WRITTEN ASSESSMENT HANDLER & WS SIGNAL TRIGGER
    // ==========================================================
    const handleWrittenAssessment = async () => {
        setSubmitting(true);
        try {
            // Ensure baseline ID is resolved or attempt a quick inline query
            let activeBaselineId = fetchedBaselineId || cleanVal(localStorage.getItem("active_baseline_id"));

            if (!isValidUuid(activeBaselineId) && isValidUuid(traineeId)) {
                const { data: baselineData } = await supabase
                    .from("eeg_baselines")
                    .select("id")
                    .eq("trainee_id", traineeId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (baselineData?.id) {
                    activeBaselineId = baselineData.id;
                    localStorage.setItem("active_baseline_id", activeBaselineId);
                }
            }

            // Instruct Python Middleware via WebSocket to begin recording active EEG reading session
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const payload = {
                    command: "START_ACTIVE_ASSESSMENT",
                    type: "START_ACTIVE_ASSESSMENT",
                    assignment_id: assignmentId || null,
                    assessment_id: assessmentId || null,
                    baseline_id: activeBaselineId || null,
                    trainee_id: traineeId || null,
                    data: {
                        assignment_id: assignmentId || null,
                        assessment_id: assessmentId || null,
                        baseline_id: activeBaselineId || null,
                        trainee_id: traineeId || null
                    }
                };

                wsRef.current.send(JSON.stringify(payload));
            }

            // Clear previous session completion and timer flags
            clearAssessmentStorage(assignmentId, assessmentId);

            // Navigate to Written Assessment with all critical UUIDs preserved
            navigate("/trainee/assessment/written-assessment", {
                state: {
                    assignmentId: assignmentId,
                    assessmentId: assessmentId,
                    baselineId: activeBaselineId,
                    traineeId: traineeId,
                    assessment: {
                        ...assessment,
                        id: assignmentId,
                        assessment_id: assessmentId,
                        status: ASSESSMENT_STATUS.ONGOING,
                    },
                },
            });
        } catch (err) {
            console.error("Error launching written assessment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-7rem)] overflow-hidden p-0">
            {/* Header */}
            <div className="mb-3">
                <nav className="mb-2 flex gap-2 text-sm font-semibold">
                    <Link to="/trainee/assessment" className="text-gray-500 hover:text-[#002f86] hover:underline">
                        My Assessments
                    </Link>
                    <span>&gt;</span>
                    <Link to="/trainee/assessment/overview" state={state} className="text-gray-500 hover:text-[#002f86] hover:underline">
                        Assessment Overview
                    </Link>
                    <span>&gt;</span>
                    <Link to="/trainee/assessment/baseline" state={state} className="text-gray-500 hover:text-[#002f86] hover:underline">
                        Baseline
                    </Link>
                    <span>&gt;</span>
                    <span className="text-[#002f86]">Preparation</span>
                </nav>
                <h1 className="text-3xl font-bold text-slate-900">
                    Prepare for Written Assessment
                </h1>

                <p className="mt-1 text-base text-slate-600">
                    Please verify that your EEG device is connected and ready before beginning the written assessment.
                </p>

                {/* MIDDLEWARE OFFLINE WARNING */}
                {!wsConnected && (
                    <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-semibold">
                        <WifiOff size={18} className="shrink-0" />
                        <span>Python Middleware server offline. Please make sure <code>stream_test.py</code> is running.</span>
                    </div>
                )}
            </div>

            <div className="mx-auto max-w-[1190px] p-1">

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-4">

                    {/* LEFT COLUMN */}
                    <div className="col-span-4 flex flex-col gap-4">

                        {/* Device Status */}
                        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">

                            <h2 className="mb-3 text-lg font-bold">
                                DEVICE STATUS
                            </h2>

                            <div className="space-y-3">

                                {/* Connection */}
                                <div className="flex items-center gap-4">

                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                                        deviceConnected ? "bg-green-100" : "bg-red-100"
                                    }`}>
                                        <Wifi className={deviceConnected ? "text-green-600" : "text-red-500"} />
                                    </div>

                                    <div>
                                        <p className="text-m text-gray-500">
                                            Connection
                                        </p>

                                        <p
                                            className={`text-xl font-bold ${deviceConnected
                                                ? "text-green-600"
                                                : "text-red-500"
                                                }`}
                                        >
                                            {deviceConnected
                                                ? "Connected"
                                                : "Not Connected"}
                                        </p>
                                    </div>

                                </div>

                                {/* Signal */}
                                <div className="flex items-center gap-4">

                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                                        signalQuality === "Good" ? "bg-blue-100" : "bg-amber-100"
                                    }`}>
                                        <Signal className={signalQuality === "Good" ? "text-blue-600" : "text-amber-600"} />
                                    </div>

                                    <div>
                                        <p className="text-m text-gray-500">
                                            Signal Quality
                                        </p>

                                        <p
                                            className={`text-xl font-bold ${
                                                signalQuality === "Good"
                                                    ? "text-green-600"
                                                    : signalQuality === "Fair"
                                                    ? "text-amber-600"
                                                    : "text-red-500"
                                                }`}
                                        >
                                            {signalQuality}
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Instructions */}
                        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">

                            <h2 className="mb-3 text-base font-bold">
                                QUICK INSTRUCTIONS
                            </h2>

                            <div className="space-y-2">

                                <div className="flex items-center gap-3">
                                    <Headset className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Wear device properly
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <PersonStanding className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Stay still
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Radio className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Ensure good contact
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Smile className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Reduce facial expressions
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Accessibility className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Minimize body movements
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <VolumeX className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Keep a calm environment
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Brain className="h-5 w-5 text-blue-600" />
                                    <span className="text-m text-slate-700">
                                        Focus on the task ahead
                                    </span>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-span-8 flex flex-col gap-4">

                        {/* EEG CARD */}
                        <div className="rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.30)] overflow-hidden">

                            <div className="flex items-center gap-3 px-4 py-3">

                                {eegReady ? (
                                    <CheckCircle2 className="text-green-600" size={28} />
                                ) : (
                                    <AlertCircle className="text-amber-500" size={28} />
                                )}

                                <span className="text-2xl font-semibold">
                                    {eegReady ? "EEG Ready" : "Adjust Headband"}
                                </span>

                            </div>

                            <div className="relative h-52">
                                <EEGWave
                                    variant="prepare"
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>

                        {/* BUTTON */}
                        <div>

                            <button
                                onClick={handleWrittenAssessment}
                                disabled={!eegReady || loadingData || submitting}
                                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-3 text-xl font-semibold transition-all ${
                                    eegReady && !loadingData && !submitting
                                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            >

                                {loadingData || submitting ? "Preparing Assessment..." : "Start Written Assessment"}

                                {!loadingData && !submitting && <ArrowRight size={26} />}

                            </button>

                            <div className={`mt-4 rounded-xl border py-3 text-center text-base font-medium ${
                                eegReady 
                                    ? "border-blue-200 bg-blue-50 text-blue-800" 
                                    : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}>

                                {eegReady ? "Device contact optimal. Ready to begin!" : "Adjust device for better contact"}

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}