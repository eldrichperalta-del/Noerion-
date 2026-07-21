import { useEffect, useState } from "react";

export default function DonutChart({
    value,
    color = "#F59E0B",
}) {

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Replace value with EEG focus metric.
    //
    // Expected:
    //
    // value:number
    //
    // Example:
    //
    // value:76
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
    // DONUT CONFIGURATION
    //
    // Chart size is controlled by EEGMetricItem wrapper.
    //
    // ==========================================================


    const radius = 45;

    const circumference =
        2 * Math.PI * radius;


    const offset =
        circumference -
        (progress / 100) * circumference;



    return (

        <div className="relative flex h-full w-full items-center justify-center">


            <svg
                viewBox="0 0 160 160"
                className="h-full w-full -rotate-90"
            >


                {/* Background Ring */}

                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                />



                {/* Progress Ring */}

                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={color}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />


            </svg>



            {/* Center Content */}

            <div className="absolute text-center">

                <p className="text-2xl font-bold text-gray-900">
                    {progress}%
                </p>


                <p className="text-xs text-gray-500">
                    Focus
                </p>


            </div>


        </div>

    );

}