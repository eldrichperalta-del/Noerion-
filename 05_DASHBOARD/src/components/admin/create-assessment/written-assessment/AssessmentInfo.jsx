export default function AssessmentInfo() {

    return (

        <div className="
            bg-white
            rounded-2xl
            shadow
            p-6
            space-y-4
            ">


            <h2 className="text-lg font-semibold">
                Assessment Information
            </h2>



            <div className="grid md:grid-cols-2 gap-4">


                <input
                    className="
                    border rounded-lg p-3
                    "
                    placeholder="Assessment Title"
                />


                <input
                    className="
                    border rounded-lg p-3
                    "
                    placeholder="Qualification"
                />



            </div>



            <textarea

                className="
                border
                rounded-lg
                p-3
                w-full
                "

                placeholder="Assessment Instructions"

            />


        </div>


    )

}