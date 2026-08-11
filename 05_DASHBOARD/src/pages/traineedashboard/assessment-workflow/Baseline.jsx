import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BaselineInstructionsModal from "../../../components/traineedashboard/assessment-workflow/BaselineInstructionsModal";
import EEGWave from "../../../components/common/EEGWave";
import {
    CheckCircle,
    AlertCircle,
    RotateCcw,
    Play,
    Lock,
    Armchair,
    PersonStanding,
    Brain,
    VolumeX,
    Activity,
} from "lucide-react";

export default function Baseline() {
    const navigate = useNavigate();
    const { state } = useLocation();

    // Preserve full navigation state with localStorage fallbacks
    const assignmentId =
        state?.assignmentId ||
        state?.assessment?.id ||
        localStorage.getItem("active_assignment_id");

    const assessmentId =
        state?.assessmentId ||
        state?.assessment?.assessment_id ||
        localStorage.getItem("active_assignment_id_ref");

    const [assessment] = useState(state?.assessment || null);

    // Save IDs into localStorage so state survives page reloads
    useEffect(() => {
        if (assignmentId) {
            localStorage.setItem("active_assignment_id", assignmentId);
        }
        if (assessmentId) {
            localStorage.setItem("active_assignment_id_ref", assessmentId);
        }
    }, [assignmentId, assessmentId]);

    const [showInstructions, setShowInstructions] = useState(true);

    // ==========================================================
    // Assessment Status Constants
    // ==========================================================
    const ASSESSMENT_STATUS = {
        PENDING: "Pending",
        ONGOING: "Ongoing",
        COMPLETED: "Completed",
    };

    if (!assessment && !assignmentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold">
                    Assessment not found.
                </h2>

                <button
                    onClick={() => navigate("/trainee/assessment")}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                    Back to Assessments
                </button>
            </div>
        );
    }

    /* ==========================================================
        DEVELOPMENT CONFIGURATION
    ========================================================== */
    const BASELINE_DURATION = 10;
    const BYPASS_BASELINE = true;

    const [timeLeft, setTimeLeft] = useState(BASELINE_DURATION);
    const [recording, setRecording] = useState(false);
    const [completed, setCompleted] = useState(BYPASS_BASELINE);

    // Temporary mock values
    const [deviceConnected] = useState(true);
    const [signalQuality] = useState("Good");

    // UI State
    const canStartAssessment = completed && !showInstructions;
    const canRecord = !recording && !completed && !showInstructions;

    useEffect(() => {
        if (!recording) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setRecording(false);
                    setCompleted(true);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [recording]);

    const minutes = String(Math.floor(timeLeft / 60)).padStart(1, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    const restartRecording = () => {
        setRecording(false);
        setCompleted(BYPASS_BASELINE);
        setTimeLeft(BASELINE_DURATION);
    };

    const handleStartAssessment = async () => {
        // Forward state including IDs down to Prepare step
        navigate("/trainee/assessment/prepare", {
            state: {
                assignmentId,
                assessmentId,
                assessment: {
                    ...assessment,
                    status: ASSESSMENT_STATUS.ONGOING,
                },
            },
        });
    };

    return (
        <div className="h-[calc(100vh-7rem)] overflow-hidden p-0">

            {/* Header */}
            <nav className="mb-2 flex gap-2 text-sm font-semibold">
                <Link to="/trainee/assessment" className="text-gray-500 hover:text-[#002f86] hover:underline">
                    My Assessments
                </Link>
                <span>&gt;</span>
                <Link to="/trainee/assessment/overview" state={state} className="text-gray-500 hover:text-[#002f86] hover:underline">
                    Assessment Overview
                </Link>
                <span>&gt;</span>
                <span className="text-[#002f86]">Baseline</span>
            </nav>

            <h1 className="text-3xl font-bold text-slate-900">
                Baseline EEG Required
            </h1>

            <p className="mt-1 text-base text-slate-600">
                Before starting your written assessment, please complete a
                5-minutes baseline recording.
            </p>

            <div className="mx-auto mt-1 max-w-[1250px] rounded-3xl p-3">

                <div className="grid gap-4 lg:grid-cols-3">

                    {/* LEFT */}
                    <div className="space-y-3">

                        {/* Instructions */}
                        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">

                            <h2 className="text-xl font-bold">
                                INSTRUCTIONS:
                            </h2>

                            <div className="mt-3 space-y-2">

                                <div className="flex items-center gap-3">
                                    <Armchair className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">
                                        Sit comfortably
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <PersonStanding className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">
                                        Stay still
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Brain className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">
                                        Relax your mind
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <VolumeX className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">
                                        Avoid movement or talking
                                    </span>
                                </div>

                            </div>

                        </div>

                        {/* BASELINE TIMER */}
                        <div className="rounded-1xl">

                            <div className="flex h-24 items-center justify-center">

                                <span
                                    style={{
                                        fontFamily: '"DSEG7 Classic", monospace',
                                        color: "#384c5e",
                                        textShadow: `
                                            0 0 4px rgba(135,206,250,.9),
                                            0 0 8px rgba(135,206,250,.8),
                                            0 0 16px rgba(135,206,250,.7),
                                            0 0 28px rgba(135,206,250,.6),
                                            0 0 42px rgba(135,206,250,.5),
                                            0 0 60px rgba(135,206,250,.35)
                                        `,
                                    }}
                                    className="text-6xl leading-none tracking-wide select-none"
                                >
                                    {minutes}:{seconds}
                                </span>
                            </div>

                        </div>

                        {/* Recording Controls */}
                        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">

                            <button
                                onClick={() => setRecording(true)}
                                disabled={!canRecord}
                                className="w-full rounded-xl bg-blue-700 py-3 text-xl font-semibold text-white hover:bg-blue-800 disabled:bg-blue-300 flex items-center justify-center gap-2"
                            >
                                <Play size={22} />
                                Start Recording
                            </button>

                            <button
                                onClick={restartRecording}
                                disabled={showInstructions}
                                className="w-full rounded-xl bg-slate-200 py-3 text-xl font-semibold text-slate-700 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} />
                                Restart
                            </button>

                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="lg:col-span-2">

                        <div className="rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.30)] overflow-hidden">

                            <div className="p-4">

                                <h2 className="text-2xl font-bold">
                                    EEG STATUS:
                                </h2>

                                <div className="mt-3 space-y-3">

                                    <div className="flex items-center gap-3 text-lg">

                                        {deviceConnected ? (
                                            <CheckCircle className="text-green-600" />
                                        ) : (
                                            <AlertCircle className="text-red-500" />
                                        )}

                                        <span>
                                            Status:

                                            <span className="ml-2 font-bold">
                                                {deviceConnected
                                                    ? "Device Connected"
                                                    : "Device Not Connected"}
                                            </span>

                                        </span>

                                    </div>

                                    <div className="flex items-center gap-3 text-lg">

                                        <Activity className="text-blue-600" />

                                        <span>
                                            Signal Quality:

                                            <span className="ml-2 font-bold text-green-600">
                                                {signalQuality}
                                            </span>

                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="relative h-52 w-full overflow-hidden">
                                <EEGWave
                                    variant="baseline"
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>

                        <div className="mt-3">

                            <button
                                onClick={handleStartAssessment}
                                disabled={!canStartAssessment}
                                className={`w-full rounded-xl py-5 text-2xl font-semibold transition flex justify-center items-center gap-3 ${canStartAssessment
                                    ? "bg-blue-700 hover:bg-blue-800 text-white"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                {!canStartAssessment && <Lock size={22} />}
                                Start Written Assessment
                            </button>

                            <p className="mt-2 text-center text-sm italic text-slate-600">
                                (Button will be enabled after successful
                                5-minutes baseline completion.)
                            </p>

                        </div>

                    </div>

                </div>

            </div>

            {/* Baseline Instructions Modal */}
            {showInstructions && (
                <BaselineInstructionsModal
                    onContinue={() => setShowInstructions(false)}
                    onCancel={() => navigate("/trainee/assessment")}
                />
            )}

        </div>
    );
}