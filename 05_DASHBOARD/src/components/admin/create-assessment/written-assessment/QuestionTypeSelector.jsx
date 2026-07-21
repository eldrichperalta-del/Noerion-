const types = [

    "Multiple Choice",

    "True / False",

    "Identification",

    "Matching Type"

];


export default function QuestionTypeSelector({
    type,
    setType
}) {


    return (

        <div>


            <label className="
                block
                font-medium
                mb-2
                ">

                Question Type

            </label>



            <div
                className="
                grid
                grid-cols-2
                gap-3
                "
            >


                {
                    types.map(item => (


                        <button

                            key={item}

                            onClick={() => setType(item)}

                            className={`
                                    p-3
                                    rounded-xl
                                    border
                                    transition

                                    ${type === item
                                    ?
                                    "bg-blue-600 text-white border-blue-600"
                                    :
                                    "bg-white"
                                }

`}

                        >


                            {item}


                        </button>


                    ))
                }


            </div>


        </div>

    )


}