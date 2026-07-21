import { useState } from "react";

import QuestionTypeSelector from "./QuestionTypeSelector";

import MultipleChoiceEditor 
from "./editors/MultipleChoiceEditor";

import TrueFalseEditor 
from "./editors/TrueFalseEditor";

import IdentificationEditor 
from "./editors/IdentificationEditor";

import MatchingTypeEditor 
from "./editors/MatchingTypeEditor";

export default function AddQuestionModal({
    onClose,
    onSave
}) {


    const [type, setType] = useState("");

    const [questionData, setQuestionData] = useState(null);



    const handleSave = () => {


        if (!questionData) {
            return;
        }


        onSave({
            type,
            ...questionData
        });


    };



    const renderEditor = () => {


        switch (type) {


            case "Multiple Choice":

                return (
                    <MultipleChoiceEditor
                        setQuestionData={setQuestionData}
                    />
                );



            case "True / False":

                return (
                    <TrueFalseEditor
                        setQuestionData={setQuestionData}
                    />
                );



            case "Identification":

                return (
                    <IdentificationEditor
                        setQuestionData={setQuestionData}
                    />
                );



            case "Matching Type":

                return (
                    <MatchingTypeEditor
                        setQuestionData={setQuestionData}
                    />
                );



            default:

                return null;


        }


    };



    return (

        <div
            className="
                fixed
                inset-0
                bg-black/40
                flex
                items-center
                justify-center
                z-50
                "
            >



            <div
                className="
                bg-white
                w-full
                max-w-3xl
                rounded-2xl
                p-6
                space-y-6
                "
            >



                <div
                    className="
                    flex
                    justify-between
                    items-center
                    "
                >


                    <h2 className="text-xl font-bold">

                        Add Question

                    </h2>


                    <button
                        onClick={onClose}
                        className="text-gray-500"
                    >
                        ✕
                    </button>


                </div>





                <QuestionTypeSelector

                    type={type}

                    setType={(value) => {

                        setType(value);
                        setQuestionData(null);

                    }}

                />




                {
                    renderEditor()
                }





                <div
                    className="
                    flex
                    justify-end
                    gap-3
                    "
                >


                    <button

                        onClick={onClose}

                        className="
                            px-5
                            py-2
                            rounded-lg
                            border
                            "
                        >

                        Cancel

                    </button>



                    <button

                        onClick={handleSave}

                        className="
                        px-5
                        py-2
                        rounded-lg
                        bg-blue-600
                        text-white
                        "

                    >

                        Save Question

                    </button>


                </div>



            </div>


        </div>


    )

}