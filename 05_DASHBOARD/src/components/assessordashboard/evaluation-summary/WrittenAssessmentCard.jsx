import { useEffect, useState } from "react";

import AssessorStatusBadge from "../shared/AssessorStatusBadge";


export default function WrittenAssessmentCard({
    writtenAssessment,
}) {


    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Replace mock writtenAssessment data with backend response.
    //
    // Expected object:
    //
    // {
    //   score: number,
    //   total: number,
    //   percentage: number,
    //   status: string
    // }
    //
    // Example:
    //
    // {
    //   score:45,
    //   total:50,
    //   percentage:90,
    //   status:"WRITTEN - COMPLETED"
    // }
    //
    // ==========================================================



    // Prevent rendering error while data is loading

    if (!writtenAssessment) {
        return null;
    }



    // ==========================================================
    // Circular Score Animation
    //
    // Backend percentage value controls the progress.
    //
    // Example:
    // percentage:90
    //
    // will render 90% circle.
    //
    // ==========================================================


    const [progress, setProgress] = useState(0);


    useEffect(() => {

        const timer = setTimeout(() => {

            setProgress(
                writtenAssessment.percentage
            );

        }, 200);


        return () => clearTimeout(timer);

    }, [
        writtenAssessment.percentage
    ]);



    const radius = 38;

    const circumference =
        2 * Math.PI * radius;


    const offset =
        circumference -
        (progress / 100) *
        circumference;



    return (

        <div
            className="
                h-full
                rounded-xl
                border
                border-gray-200
                bg-white
                p-6
                shadow-sm
            "
        >


            {/* ======================================================
          HEADER
      ====================================================== */}

            <div
                className="
          flex
          items-center
          justify-between
        "
            >

                <h2
                    className="
            text-lg
            font-semibold
            text-gray-900
          "
                >
                    Written Assessment
                </h2>


                <AssessorStatusBadge
                    status={
                        writtenAssessment.status
                    }
                />

            </div>



            <p
                className="
          mt-2
          text-sm
          text-gray-500
        "
            >
                Evaluates theoretical knowledge of course concepts.
            </p>




            {/* ======================================================
          SCORE CONTENT
      ====================================================== */}


            <div
                className="
          mt-5
          flex
          items-center
          justify-center
          gap-12
        "
            >



                {/* ==========================
            Animated Circle
        =========================== */}


                <div
                    className="
                        relative
                        flex
                        h-24
                        w-24
                        items-center
                        justify-center
                    "
                >

                    <svg
                        className="
                            h-24
                            w-24
                            -rotate-90
                            "
                    >

                        {/* Background */}

                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                        />


                        {/* Progress */}

                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="#2563eb"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={
                                circumference
                            }
                            strokeDashoffset={
                                offset
                            }
                            className="
                                transition-all
                                duration-1000
                                ease-out
                            "
                        />

                    </svg>



                    {/* Center Text */}

                    <div
                        className="
                        absolute
                        text-center
                        "
                    >

                        <p
                            className="
                                text-xl
                                font-bold
                                text-blue-700
                            "
                        >
                            {writtenAssessment.percentage}%
                        </p>


                        <p
                            className="
                                text-xs
                                text-gray-500
                            "
                        >
                            Score
                        </p>


                    </div>


                </div>




                {/* ==========================
            Details
        =========================== */}


                <div
                    className="
                        flex
                        flex-col
                        justify-center
                        gap-5
                    "
                >


                    <div
                        className="
                        flex
                        items-center
                        gap-10
                        "
                    >

                        <span
                            className="
                                font-semibold
                                text-gray-600
                            "
                        >
                            Score:
                        </span>


                        <span
                            className="
                                font-bold
                                text-gray-900
                            "
                        >
                            {writtenAssessment.score}
                            /
                            {writtenAssessment.total}
                        </span>


                    </div>




                    <div
                        className="
                        flex
                        items-center
                        gap-10
                        "
                    >

                        <span
                            className="
                                font-semibold
                                text-gray-600
                            "
                        >
                            Percentage:
                        </span>


                        <span
                            className="
                                font-bold
                                text-gray-900
                            "
                        >
                            {writtenAssessment.percentage}%
                        </span>


                    </div>


                </div>


            </div>


        </div>

    );
}