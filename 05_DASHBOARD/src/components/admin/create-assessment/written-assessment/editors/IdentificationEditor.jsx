import { useState } from "react";


export default function IdentificationEditor({
    setQuestionData
}) {


    const [question, setQuestion] = useState("");

    const [answer, setAnswer] = useState("");

    const [explanation, setExplanation] = useState("");



    const updateData = (q, a, e) => {

        setQuestionData({

            question: q,

            answer: a,

            explanation: e

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

                        placeholder="Enter identification question"

                        value={question}

                        onChange={(e) => {

                        setQuestion(e.target.value);

                        updateData(
                            e.target.value,
                            answer,
                            explanation
                        );

                    }}

                />


            </div>





            <div>

                <label className="font-medium">
                    Correct Answer
                </label>


                <input

                    className="
                    w-full
                    border
                    rounded-lg
                    p-3
                    mt-2
                    "

                    placeholder="Expected answer"

                    value={answer}

                    onChange={(e) => {

                        setAnswer(e.target.value);

                        updateData(
                            question,
                            e.target.value,
                            explanation
                        );

                    }}

                />


            </div>





            <div>

                <label className="font-medium">
                    Explanation (Optional)
                </label>


                <textarea

                    className="
                        w-full
                        border
                        rounded-lg
                        p-3
                        mt-2
                        "

                        placeholder="Add explanation for checking"

                        value={explanation}

                        onChange={(e) => {

                        setExplanation(e.target.value);

                        updateData(
                            question,
                            answer,
                            e.target.value
                        );

                    }}

                />


            </div>



        </div>


    )

}