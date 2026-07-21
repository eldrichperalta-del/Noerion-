import { useEffect, useState } from "react";

export default function GaugeChart({
    value,
    color = "#2563EB",
}) {

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // value comes from EEG attention analysis.
    //
    // Expected:
    //
    // value:number
    //
    // Example:
    //
    // value:85
    //
    // ==========================================================


    const [progress, setProgress] = useState(0);


    useEffect(() => {

        const timer = setTimeout(() => {
            setProgress(value);
        }, 200);


        return () => clearTimeout(timer);

    }, [value]);



    // ==========================================================
    // GAUGE CONFIGURATION
    // Adjust size here
    //
    // ==========================================================

    const radius = 45;

    const circumference =
        Math.PI * radius;


    const offset =
        circumference -
        (progress / 100) * circumference;



    return (

        <div className="relative flex h-full w-full items-center justify-center">

            <svg
                viewBox="0 0 160 160"
                className="h-full w-full"
            >


                {/* Background Arc */}

                <path
                    d="M 35 95 A 45 45 0 0 1 125 95"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    strokeLinecap="round"
                />



                {/* Progress Arc */}

                <path
                    d="M 35 95 A 45 45 0 0 1 125 95"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />

            </svg>



            {/* Center Value */}

            <div className="absolute bottom-4 text-center">

                <p className="text-2xl font-bold text-gray-900">
                    {progress}%
                </p>


                <p className="text-xs text-gray-500">
                    Attention
                </p>

            </div>


        </div>

    );

}