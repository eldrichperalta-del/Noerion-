import { useState } from "react";


export default function TrueFalseEditor({
    setQuestionData
}) {


    const [question, setQuestion] = useState("");

    const [answer, setAnswer] = useState("");



    const updateData = (q, a) => {

        setQuestionData({

            question: q,

            answer: a

        });


    };



    return (

        <div className="space-y-5">


            <div>

                <label className="font-medium">
                    Question
                </label>


                <textarea

                    className="
                        w-full
                        border
                        rounded-lg
                        p-3
                        mt-2
                        "

                    placeholder="Enter statement"

                    value={question}

                    onChange={(e) => {

                        setQuestion(e.target.value);

                        updateData(
                            e.target.value,
                            answer
                        );

                    }}

                />


            </div>





            <div>


                <label className="font-medium">
                    Correct Answer
                </label>



                <div className="
                    flex
                    gap-4
                    mt-3
                    ">


                    <button

                        onClick={() => {

                            setAnswer("True");

                            updateData(
                                question,
                                "True"
                            );

                        }}

                        className={`
                                px-6
                                py-3
                                rounded-xl
                                border

                                ${answer === "True"
                                ?
                                "bg-green-600 text-white"
                                :
                                ""
                            }

                        `}

                    >

                        True

                    </button>





                    <button

                        onClick={() => {

                            setAnswer("False");

                            updateData(
                                question,
                                "False"
                            );

                        }}

                        className={`
                                px-6
                                py-3
                                rounded-xl
                                border

                                ${answer === "False"
                                ?
                                "bg-red-600 text-white"
                                :
                                ""
                            }

                        `}

                    >

                        False

                    </button>



                </div>


            </div>



        </div>


    )


}