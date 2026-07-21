import EmptyState from "./EmptyState";


export default function QuestionList({
    questions,
    onDelete
}) {


    if (questions.length === 0)
        return <EmptyState />;



    return (

        <div className="space-y-4">


            {
                questions.map((q, index) => (

                    <div
                        key={q.id}
                        className="
                            bg-white
                            rounded-xl
                            shadow
                            p-5
                            "
                                >


                        <div className="flex justify-between">


                            <div>

                                <h3 className="font-semibold">

                                    Question {index + 1}

                                </h3>


                                <p>
                                    {q.question}
                                </p>


                                <span
                                    className="
                                    text-sm
                                    text-blue-600
                                    "
                                >
                                    {q.type}
                                </span>


                            </div>



                            <button

                                onClick={() => onDelete(q.id)}

                                className="
                                text-red-500
                                "

                            >
                                Delete
                            </button>



                        </div>


                    </div>


                ))

            }


        </div>


    )

}