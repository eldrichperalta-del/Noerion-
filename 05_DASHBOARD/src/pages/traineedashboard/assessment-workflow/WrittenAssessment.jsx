import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
} from "lucide-react";

export default function WrittenAssessment() {
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

    /* ==========================================================
        TEMPORARY QUESTIONS

        BACKEND:
        Replace with questions fetched from Supabase.
    ========================================================== */

    const questions = [
        {
            id: 1,
            question: "What does AI stand for?",
            choices: [
                "Artificial Intelligence",
                "Automatic Internet",
                "Advanced Interface",
                "Applied Integration",
            ],
        },
        {
            id: 2,
            question: "Which device is used in this assessment?",
            choices: [
                "Printer",
                "EEG Headset",
                "Scanner",
                "Projector",
            ],
        },
        {
            id: 3,
            question: "TESDA primarily focuses on...",
            choices: [
                "Vocational Education",
                "Gaming",
                "Social Media",
                "Entertainment",
            ],
        },
    ];

    /* ==========================================================
        CURRENT QUESTION

        BACKEND:
        Initialize using:
        assessment.current_question_index
    ========================================================== */

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const current = questions[currentQuestion];

    const progress =
        ((currentQuestion + 1) / questions.length) * 100;

    /* ==========================================================
        NEXT QUESTION

        BACKEND:
        Save answer.

        Save current_question_index.

        Example:

        await supabase
        .from("assessment_attempts")
        .update({
            current_question_index: currentQuestion + 1
        });
    ========================================================== */

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedAnswer(null);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion((prev) => prev - 1);
            setSelectedAnswer(null);
        }
    };

    /* ==========================================================
        SUBMIT

        BACKEND:

        status = Completed

        current_question_index = null

        compute score

        redirect to Results page
    ========================================================== */

    const handleSubmit = () => {
        navigate("/trainee/results", {
            state: {
                assessment: {
                    ...assessment,
                    status: ASSESSMENT_STATUS.COMPLETED,
                },
            },
        });
    };

    return (
        <div className="p-8">

            <div className="max-w-5xl mx-auto">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-4xl font-bold">
                        Written Assessment
                    </h1>

                    <p className="text-slate-600 mt-2">
                        {assessment.title}
                    </p>

                </div>

                {/* Progress */}

                <div className="mb-8">

                    <div className="flex justify-between mb-2">

                        <span className="font-semibold">
                            Question {currentQuestion + 1} of {questions.length}
                        </span>

                        <span>
                            {Math.round(progress)}%
                        </span>

                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full">

                        <div
                            className="h-3 bg-blue-700 rounded-full transition-all"
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>

                </div>

                {/* Question Card */}

                <div className="bg-white rounded-2xl shadow-md p-8">

                    <h2 className="text-2xl font-semibold mb-8">

                        {current.question}

                    </h2>

                    <div className="space-y-4">

                        {current.choices.map((choice, index) => (

                            <button
                                key={index}
                                onClick={() => setSelectedAnswer(index)}
                                className={`w-full text-left rounded-xl border px-6 py-5 transition
                                    ${
                                        selectedAnswer === index
                                            ? "border-blue-700 bg-blue-50"
                                            : "border-slate-300 hover:border-blue-500"
                                    }`}
                            >

                                {choice}

                            </button>

                        ))}

                    </div>

                </div>

                {/* Navigation */}

                <div className="flex justify-between mt-8">

                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-40 flex items-center gap-2"
                    >
                        <ChevronLeft size={20} />

                        Previous

                    </button>

                    {currentQuestion === questions.length - 1 ? (

                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        >

                            <CheckCircle size={20} />

                            Submit Assessment

                        </button>

                    ) : (

                        <button
                            onClick={handleNext}
                            disabled={selectedAnswer === null}
                            className="px-8 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-40 flex items-center gap-2"
                        >

                            Next

                            <ChevronRight size={20} />

                        </button>

                    )}

                </div>

            </div>

        </div>
    );
}