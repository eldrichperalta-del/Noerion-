import { useEffect, useState } from "react";

import aiIcon from "../../../assets/ai.svg";

export default function AIResultSummaryCard({ result }) {

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Replace the mock "result" prop with the AI-generated
    // assessment analysis returned after evaluation.
    //
    // Expected object:
    //
    // {
    //     suggestedResult: string,
    //     confidenceScore: number
    // }
    //
    // Example:
    //
    // {
    //     suggestedResult: "Competent",
    //     confidenceScore: 82
    // }
    //
    // ==========================================================

    // Prevent rendering while backend data is loading

    if (!result) return null;

    // ==========================================================
    // Circular Confidence Animation
    //
    // Backend confidenceScore controls the animated
    // progress circle.
    //
    // Example:
    //
    // confidenceScore: 82
    //
    // renders an 82% confidence ring.
    //
    // ==========================================================

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(result.confidenceScore);
        }, 200);

        return () => clearTimeout(timer);
    }, [result.confidenceScore]);

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const competent =
        result.suggestedResult === "Competent";

    return (

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* ======================================================
                HEADER
            ====================================================== */}

            <div className="flex items-center gap-3 px-6 py-4">
                <img src={aiIcon} alt="AI" className="h-5 w-5 opacity-80" />

                <h2 className="text-lg font-semibold text-gray-900">
                    AI Result Summary
                </h2>
            </div>

            {/* ======================================================
                CONTENT
            ====================================================== */}

            <div className="flex items-center justify-center gap-30 px-6 py-6">

                {/* ==========================
                    DETAILS
                ========================== */}

                <div className="flex flex-col justify-center gap-6">

                    <div>

                        <p className="text-sm font-semibold text-gray-600">
                            AI Suggested Result
                        </p>

                        <div className="mt-3">
                            <span
                                className={`inline-flex rounded-md px-4 py-1.5 text-sm font-semibold text-white ${competent
                                    ? "bg-green-600"
                                    : "bg-red-600"
                                    }`}
                            >
                                {result.suggestedResult}
                            </span>
                        </div>

                    </div>

                    <div>

                        <p className="text-sm font-semibold text-gray-600">
                            Confidence Level
                        </p>

                        <p className="mt-2 text-lg font-bold text-gray-900">
                            {result.confidenceScore}%
                        </p>

                    </div>

                </div>

                {/* ==========================
                    ANIMATED CIRCLE
                ========================== */}

                <div className="-mt-6 relative flex h-28 w-28 items-center justify-center">

                    <svg
                        viewBox="0 0 112 112"
                        className="h-28 w-28 -rotate-90"
                    >

                        {/* Background */}

                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="#E5E7EB"
                            strokeWidth="8"
                            fill="none"
                        />

                        {/* Progress */}

                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="#2563EB"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000 ease-out"
                        />

                    </svg>

                    {/* Center Text */}

                    <div className="absolute text-center">

                        <p className="text-xl font-bold text-blue-700">
                            {progress}%
                        </p>

                        <p className="text-xs text-gray-500">
                            Confidence
                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}