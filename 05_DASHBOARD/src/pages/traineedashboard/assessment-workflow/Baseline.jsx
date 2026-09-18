
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BaselineInstructionsModal from "../../../components/traineedashboard/assessment-workflow/BaselineInstructionsModal";
import EEGWave from "../../../components/common/EEGWave";
import { supabase } from "../../../supabaseClient";
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
    AlertTriangle,
    Bell,
    WifiOff,
    Volume2
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

    const traineeId =
        state?.traineeId ||
        state?.trainee_id ||
        state?.user?.id ||
        localStorage.getItem("trainee_id") ||
        localStorage.getItem("user_id");

    const [assessment] = useState(state?.assessment || null);

    useEffect(() => {
        if (assignmentId) {
            localStorage.setItem("active_assignment_id", assignmentId);
        }
        if (assessmentId) {
            localStorage.setItem("active_assignment_id_ref", assessmentId);
        }
        if (traineeId) {
            localStorage.setItem("trainee_id", traineeId);
        }
    }, [assignmentId, assessmentId, traineeId]);

    const [showInstructions, setShowInstructions] = useState(true);

    const ASSESSMENT_STATUS = {
        PENDING: "Pending",
        ONGOING: "Ongoing",
        COMPLETED: "Completed",
    };

    /* =========================================================================
        DEPLOYMENT STAGE WEBSOCKET CONFIGURATION
    ========================================================================= */
    const MIDDLEWARE_WS_URL = "ws://127.0.0.1:8000/ws/eeg";
    const BASELINE_DURATION = 300; // 5 minutes calibration (300s)

    const [timeLeft, setTimeLeft] = useState(BASELINE_DURATION);
    const [recording, setRecording] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [hasExistingBaseline, setHasExistingBaseline] = useState(false);
    const [recordingError, setRecordingError] = useState("");
    const [baselineDbId, setBaselineDbId] = useState(null);
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const [showEyesClosedModal, setShowEyesClosedModal] = useState(false);

    // Hardware State from Python Middleware
    const [deviceConnected, setDeviceConnected] = useState(false);
    const [signalQuality, setSignalQuality] = useState("No Signal");
    const [wsConnected, setWsConnected] = useState(false);

    // Robust State Tracking for Alarms & Recording Session
    const [recordingStarted, setRecordingStarted] = useState(false);
    const [alarmTriggered, setAlarmTriggered] = useState(false);

    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const alarmIntervalRef = useRef(null);
    const eyesClosedPromptTriggeredRef = useRef(false);
    const eyesClosedPromptTimerRef = useRef(null);

    /* =========================================================================
        PRE-UNLOCK BROWSER AUDIO CONTEXT ON ANY USER INTERACTION
    ========================================================================= */
    const initOrUnlockAudio = async () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                    audioCtxRef.current = new AudioCtx();
                }
                if (audioCtxRef.current.state === "suspended") {
                    await audioCtxRef.current.resume();
                }
            }
        } catch (e) {
            console.warn("Could not pre-unlock Web Audio API:", e);
        }
    };

    /* =========================================================================
        CHECK BASELINE FOR THIS SPECIFIC ATTEMPT
        Plan B: eeg_baselines.assignment_id identifies the assessment attempt.
    ========================================================================= */
    useEffect(() => {
        let cancelled = false;

        const initializeAttemptBaseline = async () => {
            // Always reset UI state when entering a different assignment/attempt.
            setBaselineDbId(null);
            setHasExistingBaseline(false);
            setCompleted(false);
            setTimeLeft(BASELINE_DURATION);
            setRecording(false);
            setRecordingStarted(false);
            setAlarmTriggered(false);
            setShowEyesClosedModal(false);

            if (!assignmentId || cancelled) return;

            try {
                const activeTraineeId =
                    traineeId ||
                    localStorage.getItem("trainee_id") ||
                    localStorage.getItem("user_id");

                const { data, error } = await supabase
                    .from("eeg_baselines")
                    .select("id, assignment_id")
                    .eq("assignment_id", assignmentId)
                    .eq("trainee_id", activeTraineeId)
                    .eq("status", "COMPLETED")
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (cancelled) return;

                if (error) {
                    console.warn("Could not query attempt baseline:", error);
                    return;
                }

                if (data && data.length > 0) {
                    setBaselineDbId(data[0].id);
                    setHasExistingBaseline(true);
                    setCompleted(true);
                    setTimeLeft(0);
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn("Could not query attempt baseline:", err);
                }
            }
        };

        initializeAttemptBaseline();

        return () => {
            cancelled = true;
        };
    }, [assignmentId, traineeId]);

    /* =========================================================================
        WEBSOCKET REALTIME SYNCHRONIZATION WITH PYTHON MIDDLEWARE
    ========================================================================= */
    useEffect(() => {
        let ws;
        let isMounted = true;
        let reconnectTimer = null;

        const connectWebSocket = () => {
            if (!isMounted) return;

            ws = new WebSocket(MIDDLEWARE_WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;
                setWsConnected(true);
                setRecordingError("");
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const rawData = JSON.parse(event.data);
                    const data = rawData.type === 'STATE_UPDATE' && rawData.data ? rawData.data : rawData;
                    
                    const isConnected = data.device_connected !== undefined 
                        ? data.device_connected 
                        : (data.connected_headset !== undefined ? data.connected_headset : false);

                    setDeviceConnected(Boolean(isConnected));

                    if (data.signal_quality) {
                        setSignalQuality(data.signal_quality);
                    }

                    if (data.recording !== undefined) {
                        setRecording(Boolean(data.recording));
                    }

                    if (data.error_message !== undefined) {
                        setRecordingError(data.error_message || "");
                    } else {
                        setRecordingError("");
                    }

                    // Baseline state is only accepted when it belongs to this
                    // exact assignment/attempt. This prevents an older attempt
                    // from appearing as the current baseline after navigation/reload.
                    const stateBelongsToCurrentAttempt =
                        data.assignment_id !== undefined &&
                        data.assignment_id !== null &&
                        String(data.assignment_id) === String(assignmentId);

                    if (stateBelongsToCurrentAttempt) {
                        if (data.recording || data.mode === "BASELINE") {
                            if (data.time_left !== undefined) setTimeLeft(data.time_left);
                        } else if (data.time_left !== undefined && !data.completed && !hasExistingBaseline) {
                            setTimeLeft(data.time_left);
                        }

                        // ROBUST STATE-BASED COMPLETION & ALARM TRIGGER
                        if (data.completed === true) {
                            if (data.baseline_id) setBaselineDbId(data.baseline_id);
                            setHasExistingBaseline(true);
                            setCompleted(true);
                            setTimeLeft(0);

                            setRecordingStarted((prevStarted) => {
                                setAlarmTriggered((prevTriggered) => {
                                    if (prevStarted && !prevTriggered) {
                                        startAlarm();
                                        return true;
                                    }
                                    return prevTriggered;
                                });
                                return false;
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket packet:", err);
                }
            };

            ws.onerror = () => {
                if (!isMounted) return;
                setWsConnected(false);
                setDeviceConnected(false);
                setSignalQuality("No Signal");
            };

            ws.onclose = () => {
                if (!isMounted) return;
                setWsConnected(false);
                setDeviceConnected(false);
                reconnectTimer = setTimeout(connectWebSocket, 2000);
            };
        };

        connectWebSocket();

        return () => {
            isMounted = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            stopAlarm();
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
        };
    }, [traineeId, assignmentId]);

    /* =========================================================================
        CONTINUOUS ALARM SOUND & POPUP CONTROL
    ========================================================================= */
    const startAlarm = async () => {
        setShowAlarmModal(true);
        setIsAlarmPlaying(true);
        try {
            if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                audioCtxRef.current = new AudioCtx();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                await ctx.resume();
            }

            const playChimeSequence = () => {
                if (ctx.state === "suspended") {
                    ctx.resume();
                }
                const now = ctx.currentTime;
                const playNote = (freq, startTime, duration) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0.35, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };

                // Continuous Alarm Tone Pattern (C5, E5, G5, C6)
                playNote(523.25, now, 0.25);        // C5
                playNote(659.25, now + 0.30, 0.25);  // E5
                playNote(783.99, now + 0.60, 0.25);  // G5
                playNote(1046.50, now + 0.90, 0.50); // C6
            };

            playChimeSequence();
            // Loop continuous alarm chime sequence every 1.6 seconds
            alarmIntervalRef.current = setInterval(playChimeSequence, 1600);
        } catch (err) {
            console.warn("Audio Context error:", err);
        }
    };

    const stopAlarm = () => {
        if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current);
            alarmIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
            try {
                audioCtxRef.current.close().catch(() => {});
            } catch (err) {
                console.warn("Error closing AudioContext:", err);
            }
            audioCtxRef.current = null;
        }
        setIsAlarmPlaying(false);
        setShowAlarmModal(false);
    };

    /* =========================================================================
        RESET FUNCTION
    ========================================================================= */
    const handleResetRecording = async () => {
        setRecordingStarted(false);
        setAlarmTriggered(false);
        eyesClosedPromptTriggeredRef.current = false;
        if (eyesClosedPromptTimerRef.current) {
            clearTimeout(eyesClosedPromptTimerRef.current);
            eyesClosedPromptTimerRef.current = null;
        }
        setShowEyesClosedModal(false);
        stopAlarm();

        const idToDelete = baselineDbId;
        const activeTraineeId =
            traineeId ||
            localStorage.getItem("trainee_id") ||
            localStorage.getItem("user_id");

        try {
            // Delete ONLY the exact baseline for this attempt.
            // Never delete all baselines belonging to the trainee.
            if (idToDelete) {
                await supabase.from("eeg_baselines").delete().eq("id", idToDelete);
            }
        } catch (err) {
            console.warn("Client-side Supabase deletion error:", err);
        }

        setBaselineDbId(null);
        setHasExistingBaseline(false);
        setCompleted(false);
        setTimeLeft(BASELINE_DURATION);
        setRecording(false);
        setRecordingError("");

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    command: "RESTART_BASELINE",
                    type: "RESTART_BASELINE",
                    baseline_id: idToDelete || null,
                    trainee_id: activeTraineeId || null,
                    assignment_id: assignmentId || null,
                    data: {
                        baseline_id: idToDelete || null,
                        trainee_id: activeTraineeId || null,
                        assignment_id: assignmentId || null
                    }
                })
            );
        }
    };

    const canRecord = wsConnected && deviceConnected && !recording && !completed && !hasExistingBaseline && !showInstructions;
    const canStartAssessment = (completed || hasExistingBaseline || !!baselineDbId) && !showInstructions;

    const effectiveTimeLeft = (completed || hasExistingBaseline) && !recording ? 0 : timeLeft;
    const minutes = String(Math.floor(effectiveTimeLeft / 60)).padStart(1, "0");
    const seconds = String(effectiveTimeLeft % 60).padStart(2, "0");

    /* =========================================================================
        START RECORDING
    ========================================================================= */
    const handleStartRecording = async () => {
        if (!canRecord) return;

        await initOrUnlockAudio();

        setRecordingStarted(true);
        setAlarmTriggered(false);
        eyesClosedPromptTriggeredRef.current = false;
        if (eyesClosedPromptTimerRef.current) {
            clearTimeout(eyesClosedPromptTimerRef.current);
            eyesClosedPromptTimerRef.current = null;
        }
        setShowEyesClosedModal(false);

        const { data: { user } } = await supabase.auth.getUser();
        const activeTraineeUuid = user?.id || traineeId || localStorage.getItem("trainee_id") || localStorage.getItem("user_id");

        if (activeTraineeUuid) {
            localStorage.setItem("trainee_id", activeTraineeUuid);
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({ 
                    command: "START_BASELINE",
                    type: "START_BASELINE",
                    trainee_id: activeTraineeUuid || null,
                    assignment_id: assignmentId || null,
                    data: {
                        trainee_id: activeTraineeUuid || null,
                        assignment_id: assignmentId || null
                    }
                })
            );
        }
    };

    /* =========================================================================
        EYES-CLOSED PROMPT
        Appears when the visible baseline timer reaches 2:20 (140 seconds).
        It stays visible for 10 seconds and does NOT stop EEG recording.
    ========================================================================= */
    useEffect(() => {
        if (!recording) return;

        if (timeLeft <= 165 && !eyesClosedPromptTriggeredRef.current) {
            eyesClosedPromptTriggeredRef.current = true;
            setShowEyesClosedModal(true);

            if (eyesClosedPromptTimerRef.current) {
                clearTimeout(eyesClosedPromptTimerRef.current);
            }

            eyesClosedPromptTimerRef.current = setTimeout(() => {
                setShowEyesClosedModal(false);
                eyesClosedPromptTimerRef.current = null;
            }, 10000);
        }
    }, [recording, timeLeft]);

    useEffect(() => {
        return () => {
            if (eyesClosedPromptTimerRef.current) {
                clearTimeout(eyesClosedPromptTimerRef.current);
                eyesClosedPromptTimerRef.current = null;
            }
        };
    }, []);

    const handleStartAssessment = async () => {
        if (!canStartAssessment) return;
        stopAlarm();

        navigate("/trainee/assessment/prepare", {
            state: {
                assignmentId,
                assessmentId,
                baselineId: baselineDbId,
                assessment: {
                    ...assessment,
                    status: ASSESSMENT_STATUS.ONGOING,
                },
            },
        });
    };

    if (!assessment && !assignmentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold">Assessment not found.</h2>
                <button
                    onClick={() => navigate("/trainee/assessment")}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                    Back to Assessments
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-7rem)] overflow-hidden p-0" onClick={initOrUnlockAudio}>

            {/* Header Nav */}
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
                Before starting your written assessment, please complete a 5-minute baseline recording.
            </p>

            {!wsConnected && (
                <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-semibold">
                    <WifiOff size={18} className="shrink-0" />
                    <span>Python Middleware server offline. Launch your desktop application on the system.</span>
                </div>
            )}

            <div className="mx-auto mt-1 max-w-[1250px] rounded-3xl p-3">
                <div className="grid gap-4 lg:grid-cols-3">

                    {/* LEFT PANEL */}
                    <div className="space-y-3">
                        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
                            <h2 className="text-xl font-bold">INSTRUCTIONS:</h2>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-3">
                                    <Armchair className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">Sit comfortably</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <PersonStanding className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">Stay still</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Brain className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">Relax your mind</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <VolumeX className="h-5 w-5 text-blue-600" />
                                    <span className="text-lg text-slate-700">Avoid movement or talking</span>
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
                                onClick={handleStartRecording}
                                disabled={!canRecord}
                                className="w-full rounded-xl bg-blue-700 py-3 text-xl font-semibold text-white hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                            >
                                <Play size={22} />
                                Start Recording
                            </button>

                            {/* INLINE STOP ALARM BUTTON */}
                            {isAlarmPlaying && (
                                <button
                                    onClick={stopAlarm}
                                    className="w-full rounded-xl bg-red-600 py-3 text-xl font-semibold text-white hover:bg-red-700 animate-pulse flex items-center justify-center gap-2 transition shadow-md"
                                >
                                    <VolumeX size={22} />
                                    Stop Alarm Sound
                                </button>
                            )}

                            {recordingError && (
                                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <span>{recordingError}</span>
                                </div>
                            )}

                            {!deviceConnected && !showInstructions && !recordingError && !hasExistingBaseline && (
                                <p className="text-xs text-red-500 text-center font-medium">
                                    * Connect Muse headband to enable recording.
                                </p>
                            )}

                            {(completed || hasExistingBaseline) && (
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                                    <Bell size={16} />
                                    <span>Baseline Recording Complete</span>
                                </div>
                            )}

                            <button
                                onClick={handleResetRecording}
                                disabled={showInstructions || (!recording && !completed && !hasExistingBaseline && timeLeft === BASELINE_DURATION)}
                                className="w-full rounded-xl bg-slate-200 py-3 text-xl font-semibold text-slate-700 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                            >
                                <RotateCcw size={20} />
                                Reset Baseline
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.30)] overflow-hidden">
                            <div className="p-4">
                                <h2 className="text-2xl font-bold">EEG STATUS:</h2>

                                <div className="mt-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-lg">
                                            {deviceConnected ? (
                                                <CheckCircle className="text-green-600" />
                                            ) : (
                                                <AlertCircle className="text-red-500" />
                                            )}
                                            <span>
                                                Status:
                                                <span className="ml-2 font-bold">
                                                    {deviceConnected ? "Device Connected" : "Device Not Connected"}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-lg">
                                        <Activity className="text-blue-600" />
                                        <span>
                                            Signal Quality:
                                            <span className={`ml-2 font-bold ${
                                                signalQuality === "Good" 
                                                    ? "text-green-600" 
                                                    : "text-amber-600"
                                            }`}>
                                                {signalQuality}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-52 w-full overflow-hidden">
                                <EEGWave variant="baseline" className="absolute inset-0" />
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <div className="mt-3">
                            <button
                                onClick={handleStartAssessment}
                                disabled={!canStartAssessment}
                                className={`w-full rounded-xl py-5 text-2xl font-semibold transition flex justify-center items-center gap-3 ${
                                    canStartAssessment
                                        ? "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                {!canStartAssessment && <Lock size={22} />}
                                Start Written Assessment
                            </button>

                            <p className="mt-2 text-center text-sm italic text-slate-600">
                                (Button will unlock strictly after Python completes the calibration & stores record in Supabase.)
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* EYES-CLOSED PROMPT MODAL */}
            {showEyesClosedModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 rounded-3xl bg-white p-8 shadow-2xl text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                            <Brain size={42} className="text-blue-700" />
                        </div>

                        <h3 className="text-3xl font-bold text-slate-900">
                            Please Close Your Eyes
                        </h3>

                        <p className="mt-4 text-lg text-slate-600">
                            Please close your eyes, remain still, and relax.
                        </p>

                        <p className="mt-2 text-base font-semibold text-blue-700">
                            Wait for the alarm before opening your eyes.
                        </p>

                        <div className="mt-6 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                            Your EEG baseline recording is still running.
                        </div>
                    </div>
                </div>
            )}

            {/* ALARM COMPLETION MODAL */}
            {showAlarmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <Bell size={36} className="animate-bounce" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800">
                            Baseline Completed!
                        </h3>

                        <p className="text-slate-600 text-sm">
                            The 5-minute EEG baseline recording has finished and successfully saved. You may now proceed to your written assessment.
                        </p>

                        <button
                            onClick={stopAlarm}
                            className="w-full rounded-xl bg-red-600 py-3 text-lg font-semibold text-white hover:bg-red-700 transition flex items-center justify-center gap-2"
                        >
                            <VolumeX size={20} />
                            Stop Alarm & Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Baseline Instructions Modal */}
            {showInstructions && (
                <BaselineInstructionsModal
                    onContinue={() => {
                        initOrUnlockAudio();
                        setShowInstructions(false);
                    }}
                    onCancel={() => navigate("/trainee/assessment")}
                />
            )}

        </div>
    );
}
