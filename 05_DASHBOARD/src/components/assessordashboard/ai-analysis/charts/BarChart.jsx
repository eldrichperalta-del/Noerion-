import { useEffect, useState } from "react";

export default function BarChart({
    value,
    color = "#10B981",
}) {

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Replace mock value with EEG engagement metric.
    //
    // Expected:
    //
    // value:number
    //
    // Example:
    //
    // value:90
    //
    // ==========================================================


    const [progress, setProgress] = useState(0);


    useEffect(() => {

        const timer = setTimeout(() => {
            setProgress(value);
        }, 200);


        return () => clearTimeout(timer);

    }, [value]);



    return (

        <div className="flex h-32 w-32 flex-col items-center justify-center">


            {/* =========================
                VERTICAL BAR
                Bottom → Top
            ========================== */}

            <div
                className="
                    relative
                    h-24
                    w-8
                    overflow-hidden
                    rounded-full
                    bg-gray-200
                "
            >

                <div
                    className="
                        absolute
                        bottom-0
                        left-0
                        w-full
                        rounded-full
                        transition-all
                        duration-1000
                        ease-out
                    "
                    style={{
                        height: `${progress}%`,
                        backgroundColor: color,
                    }}
                />

            </div>



            {/* =========================
                VALUE
            ========================== */}

            <div className="mt-3 text-center">

                <p className="text-2xl font-bold text-gray-900">
                    {progress}%
                </p>


                <p className="text-xs text-gray-500">
                    Engagement
                </p>

            </div>


        </div>

    );

}