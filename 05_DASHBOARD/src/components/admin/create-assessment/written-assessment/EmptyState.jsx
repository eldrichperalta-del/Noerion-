import {
    FileQuestion
} from "lucide-react";


export default function EmptyState() {


    return (

        <div
            className="
            border
            border-dashed
            rounded-2xl
            p-12
            text-center
            text-gray-500
            "
        >


            <FileQuestion
                size={48}
                className="mx-auto mb-4"
            />


            <h3 className="text-lg font-semibold">
                No Questions Added
            </h3>


            <p>
                Start building your assessment by adding questions.
            </p>



        </div>

    )


}