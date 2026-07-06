import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

    const [showInstructions, setShowInstructions] = useState(true);
    const { state } = useLocation();

    const assessment = state?.assessment;

    // ==========================================================
    // Assessment Status Constants
    // ==========================================================
    const ASSESSMENT_STATUS = {
        PENDING: "Pending",
        ONGOING: "Ongoing",
        COMPLETED: "Completed",
    };


    if (!assessment) {
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
  
        BASELINE_DURATION
        -----------------------------------
        300 = Production (5 minutes)
        10  = Development (10 seconds)
  
        BYPASS_BASELINE
        -----------------------------------
        false = Production
        true  = Skip waiting and immediately
                enable the Start Assessment button.
  
        NOTE:
        Before deployment, change back to:
  
        const BASELINE_DURATION = 300;
        const BYPASS_BASELINE = false;
    ========================================================== */

    /* rill counted
    const BASELINE_DURATION = 300;
    const BYPASS_BASELINE = false;
    */

    
    const BASELINE_DURATION = 10;
    const BYPASS_BASELINE = true;
    

    const [timeLeft, setTimeLeft] = useState(BASELINE_DURATION);
    const [recording, setRecording] = useState(false);
    const [completed, setCompleted] = useState(BYPASS_BASELINE);

    // Temporary mock values
    const [deviceConnected] = useState(true);
    const [signalQuality] = useState("Good");
    const [statusMessage] = useState("Please remain still.");

    // ==========================================================
    // UI State
    // ==========================================================

    // Start Written Assessment is enabled only when:
    // ✓ Baseline recording is complete
    // ✓ Instructions modal has been acknowledged
    const canStartAssessment = completed && !showInstructions;

    // Start Recording is enabled only when:
    // ✓ Instructions modal has been acknowledged
    // ✓ Recording is not already running
    // ✓ Baseline has not been completed
    const canRecord = !recording && !completed && !showInstructions;

    /* ==========================================================
        TIMER
  
        Production:
        Runs for 5 minutes while EEG records baseline.
  
        Future Backend:
        Start this timer only after the EEG device confirms
        recording has successfully started.
    ========================================================== */

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

    /* ==========================================================
    START ASSESSMENT

    BACKEND:
    Before navigating to Prepare, update the assessment attempt.

    status = "Ongoing"
    current_question_index = 0

    Example:

    await supabase
      .from("assessment_attempts")
      .update({
          status: "Ongoing",
          current_question_index: 0,
      })
      .eq("id", assessment.attempt_id);

    ========================================================== */

    const handleStartAssessment = async () => {
        // Temporary frontend only.
        // Later this will update Supabase before navigating.

        navigate("/trainee/assessment/prepare", {
            state: {
                assessment: {
                    ...assessment,
                    status: ASSESSMENT_STATUS.ONGOING,
                },
            },
        });
    };
    return (
        <div className="min-h-screen p-0">

            {/* Header */}

            <h1 className="text-4xl font-bold text-slate-900">
                Baseline EEG Required
            </h1>

            <p className="mt-2 text-lg text-slate-600">
                Before starting your written assessment, please complete a
                5-minutes baseline recording.
            </p>

            <div className="mx-auto mt-2 max-w-[1250px] rounded-3xl p-6">

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* LEFT */}

                    <div className="space-y-4">

                        {/* Instructions */}

                        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">

                            <h2 className="text-xl font-bold">
                                INSTRUCTIONS:
                            </h2>

                            <div className="mt-5 space-y-4">

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

                        {/* ==========================================================
                                BASELINE TIMER
                            ========================================================== */}

                        <div className="rounded-1xl">

                            <div className="flex h-32 items-center justify-center">

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
                                    className="text-[80px] leading-none tracking-wide select-none"
                                >
                                    {minutes}:{seconds}
                                </span>
                            </div>

                        </div>

                        {/* Recording Controls */}

                        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.30)] space-y-4">

                            {/* ==========================================================
                                    START RECORDING

                                    Future Backend:
                                    Trigger EEG recording here before starting timer.
                                ========================================================== */}

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

                            <div className="p-6">

                                <h2 className="text-2xl font-bold">
                                    EEG STATUS:
                                </h2>

                                <div className="mt-5 space-y-4">

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

                            <div className="relative h-64 w-full overflow-hidden">
                                <EEGWave
                                    variant="baseline"
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>

                        <div className="mt-4">

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

                            <p className="mt-3 text-center italic text-slate-600">
                                (Button will be enabled after successful
                                5-minutes baseline completion.)
                            </p>

                        </div>


                    </div>

                </div>

                {/* ==========================================================
            START WRITTEN ASSESSMENT

            Production:
            Keep disabled={!completed}

            Development:
            Set BYPASS_BASELINE = true
            to immediately enable this button.

            Future Backend:
            Only enable after:
            ✓ Baseline complete
            ✓ EEG connected
            ✓ Signal quality acceptable
        ========================================================== */}

            </div>

            {/* Baseline Instructions Modal */}
            {showInstructions && (
                <BaselineInstructionsModal
                    onContinue={() => setShowInstructions(false)}
                    onCancel={() => navigate("/trainee/assessment")}
                />
            )}

        </div >


    );
}