import { useState } from "react";


export default function MultipleChoiceEditor({
    setQuestionData
}) {


    const [question, setQuestion] = useState("");

    const [choices, setChoices] = useState([
        "",
        "",
        "",
        ""
    ]);

    const [answer, setAnswer] = useState("");



    const updateChoice = (index, value) => {

        const updated = [...choices];

        updated[index] = value;

        setChoices(updated);


        setQuestionData({

            question,

            choices: updated,

            answer

        });


    };



    const updateQuestion = (value) => {

        setQuestion(value);


        setQuestionData({

            question: value,

            choices,

            answer

        });


    };



    const updateAnswer = (value) => {


        setAnswer(value);


        setQuestionData({

            question,

            choices,

            answer: value

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

                    placeholder="Enter question"

                    value={question}

                    onChange={(e) =>
                        updateQuestion(e.target.value)
                    }

                />

            </div>





            <div>

                <label className="font-medium">
                    Choices
                </label>


                <div className="space-y-3 mt-2">


                    {
                        choices.map((choice, index) => (


                            <div
                                key={index}
                                className="
                                    flex
                                    items-center
                                    gap-3
                                    "
                            >


                                <input

                                    type="radio"

                                    name="correct"

                                    checked={answer === choice && choice !== ""}

                                    onChange={() =>
                                        updateAnswer(choice)
                                    }

                                />



                                <input

                                    className="
                                    flex-1
                                    border
                                    rounded-lg
                                    p-2
                                    "

                                    placeholder={`Choice ${index + 1}`}

                                    value={choice}

                                    onChange={(e) =>
                                        updateChoice(
                                            index,
                                            e.target.value
                                        )
                                    }

                                />


                            </div>


                        ))

                    }


                </div>


            </div>


        </div>

    )


}