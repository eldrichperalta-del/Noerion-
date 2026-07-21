import { useState } from "react";


export default function MatchingTypeEditor({
    setQuestionData
}) {


    const [question, setQuestion] = useState("");

    const [pairs, setPairs] = useState([
        {
            left: "",
            right: ""
        }
    ]);



    const updatePairs = (updated) => {

        setPairs(updated);


        setQuestionData({

            question,

            pairs: updated

        });


    };



    const addPair = () => {


        const updated = [

            ...pairs,

            {
                left: "",
                right: ""
            }

        ];


        updatePairs(updated);


    };



    const updatePair = (index, key, value) => {


        const updated = [...pairs];


        updated[index][key] = value;


        updatePairs(updated);


    };



    const updateQuestion = (value) => {


        setQuestion(value);


        setQuestionData({

            question: value,

            pairs

        });


    };



    return (

        <div className="space-y-5">



            <div>


                <label className="font-medium">
                    Question / Instructions
                </label>


                <textarea

                    className="
                        w-full
                        border
                        rounded-lg
                        p-3
                        mt-2
                        "

                        placeholder="Match the items in Column A with Column B"

                        value={question}

                        onChange={(e) =>
                        updateQuestion(e.target.value)
                    }

                />


            </div>





            <div>


                <label className="font-medium">
                    Matching Pairs
                </label>



                <div className="
                    space-y-3
                    mt-3
                    ">


                    {
                        pairs.map((pair, index) => (


                            <div

                                key={index}

                                    className="
                                    grid
                                    grid-cols-2
                                    gap-3
                                    "


                                >


                                <input

                                        className="
                                            border
                                            rounded-lg
                                            p-2
                                            "

                                            placeholder={`Item ${index + 1}`}

                                            value={pair.left}

                                            onChange={(e) =>

                                        updatePair(
                                            index,
                                            "left",
                                            e.target.value
                                        )

                                    }

                                />





                                <input

                                    className="
                                        border
                                        rounded-lg
                                        p-2
                                        "

                                        placeholder={`Match ${index + 1}`}

                                        value={pair.right}

                                        onChange={(e) =>

                                        updatePair(
                                            index,
                                            "right",
                                            e.target.value
                                        )

                                    }

                                />



                            </div>


                        ))

                    }


                </div>



                <button

                    onClick={addPair}

                    className="
                        mt-3
                        px-4
                        py-2
                        rounded-lg
                        border
                        hover:bg-gray-100
                        "

                    >

                    + Add Pair

                </button>


            </div>



        </div>


    )

}