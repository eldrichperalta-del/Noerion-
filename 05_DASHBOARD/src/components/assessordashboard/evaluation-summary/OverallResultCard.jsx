import {
    Award,
    CheckCircle2,
    XCircle,
} from "lucide-react";

export default function OverallResultCard({
    overallResult,
}) {


    // ==========================================================
    // FRONTEND PURPOSE
    // ----------------------------------------------------------
    // Displays the final competency evaluation result.
    //
    // Used in:
    // Assessor > Evaluation Summary
    //
    // This card is READ-ONLY.
    //
    // ==========================================================



    // ==========================================================
    // BACKEND HANDOFF
    // ----------------------------------------------------------
    // Replace the mock "overallResult" prop with the final
    // competency evaluation returned by backend.
    //
    // Expected object:
    //
    // {
    //    competency: string
    // }
    //
    //
    // Example API response:
    //
    // {
    //    "competency": "COMPETENT"
    // }
    //
    //
    // Possible values:
    //
    // "COMPETENT"
    // "NOT YET COMPETENT"
    //
    // ==========================================================



    const competency =
        overallResult?.competency || "PENDING";


    const isCompetent =
        competency === "COMPETENT";



    return (

        <div
            className="
                h-full
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
                shadow-md
                transition-all
                duration-300
                hover:shadow-lg
            "
        >


            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="flex items-start gap-4">


                {/* Icon */}

                <div
                    className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-green-50
          "
                >

                    <Award
                        size={26}
                        className="text-green-600"
                    />

                </div>



                <div>

                    <h2
                        className="
              text-lg
              font-bold
              text-gray-900
            "
                    >
                        Overall Result
                    </h2>


                    <p
                        className="
              mt-2
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
            "
                    >
                        System Competency Status
                    </p>


                </div>


            </div>





            {/* ======================================================
          COMPETENCY RESULT
      ====================================================== */}


            <div
                className="
          mt-6
          flex
          justify-center
        "
            >


                <div
                    className={`
            flex
            items-center
            justify-center
            gap-3
            rounded-full
            px-12
            py-3
            text-lg
            font-bold

            ${isCompetent
                            ?
                            "bg-green-100 text-green-700"
                            :
                            "bg-red-100 text-red-700"
                        }
          `}
                >


                    {
                        isCompetent ? (

                            <CheckCircle2
                                size={26}
                                className="text-green-600"
                            />

                        ) : (

                            <XCircle
                                size={26}
                                className="text-red-600"
                            />

                        )
                    }



                    <span>
                        {competency}
                    </span>


                </div>


            </div>





            {/* ======================================================
          DESCRIPTION
      ====================================================== */}


            <p
                className="
          mt-4
          text-center
          text-xs
          leading-5
          text-gray-500
        "
            >

                {
                    isCompetent
                        ?
                        "The trainee has demonstrated the required skills and knowledge for this competency."
                        :
                        "The trainee has not yet demonstrated the required competency level."
                }

            </p>



        </div>

    );
}