import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";

export default function Prepare() {

    const navigate = useNavigate();
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


    // ============================================
    // Temporary states
    // Replace these with EEG backend values later.
    // ============================================
    const [connected] = useState(true);
    const [signalQuality] = useState("Good");
    const [eegReady] = useState(true);


    /* ==========================================================
    START WRITTEN ASSESSMENT

    BACKEND:
    Before navigating, verify:

    ✓ Assessment is Ongoing
    ✓ EEG device connected
    ✓ Signal quality acceptable

    Future:
    Load current_question_index from the database
    so the trainee resumes from the last saved question.
    ========================================================== */

    const handleWrittenAssessment = () => {
        navigate("/trainee/assessment/written-assessment", {
            state: {
                assessment: {
                    ...assessment,
                    status: ASSESSMENT_STATUS.ONGOING,
                },

                // BACKEND:
                // currentQuestionIndex:
                // assessment.current_question_index
            },
        });
    };

    return (
        <div className="h-[calc(100vh-7rem)] overflow-hidden p-0">
            {/* ================================= */}
            {/* Header */}
            {/* ================================= */}

            <div className="mb-3">
                <nav className="mb-2 flex gap-2 text-sm font-semibold"><Link to="/trainee/assessment" className="text-gray-500 hover:text-[#002f86] hover:underline">My Assessments</Link><span>&gt;</span><Link to="/trainee/assessment/overview" state={{ assessment }} className="text-gray-500 hover:text-[#002f86] hover:underline">Assessment Overview</Link><span>&gt;</span><Link to="/trainee/assessment/baseline" state={{ assessment }} className="text-gray-500 hover:text-[#002f86] hover:underline">Baseline</Link><span>&gt;</span><span className="text-[#002f86]">Preparation</span></nav>
                <h1 className="text-3xl font-bold text-slate-900">
                    Prepare for Written Assessment
                </h1>

                <p className="mt-1 text-base text-slate-600">
                    Please verify that your EEG device is connected and ready before beginning the written assessment.
                </p>
            </div>

            <div className="mx-auto max-w-[1190px] p-1">



                {/* ================================= */}
                {/* Main Grid */}
                {/* ================================= */}

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

                                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                                        <Wifi className="text-green-600" />
                                    </div>

                                    <div>
                                        <p className="text-m text-gray-500">
                                            Connection
                                        </p>

                                        <p
                                            className={`text-xl font-bold ${connected
                                                ? "text-green-600"
                                                : "text-red-500"
                                                }`}
                                        >
                                            {connected
                                                ? "Connected"
                                                : "Not Connected"}
                                        </p>
                                    </div>

                                </div>

                                {/* Signal */}

                                <div className="flex items-center gap-4">

                                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Signal className="text-blue-600" />
                                    </div>

                                    <div>
                                        <p className="text-m text-gray-500">
                                            Signal Quality
                                        </p>

                                        <p
                                            className={`text-xl font-bold ${signalQuality === "Good"
                                                ? "text-green-600"
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

                                <CheckCircle2
                                    className="text-green-600"
                                    size={28}
                                />

                                <span className="text-2xl font-semibold">
                                    EEG Ready
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
                                disabled={!eegReady}
                                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-3 text-xl font-semibold transition-all
                                        ${eegReady
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >

                                Start Written Assessment

                                <ArrowRight size={26} />

                            </button>

                            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 py-3 text-center text-base font-medium text-blue-800">

                                Adjust device for better contact

                            </div>


                        </div>

                    </div>



                </div>



            </div>
        </div>
    );
}
