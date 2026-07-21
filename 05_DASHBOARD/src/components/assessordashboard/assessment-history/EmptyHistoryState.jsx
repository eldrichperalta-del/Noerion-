import { ClipboardList } from "lucide-react";

export default function EmptyHistoryState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
                <ClipboardList
                    size={36}
                    className="text-gray-400"
                />
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
                No Assessment History Found
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
                No completed assessment records match your current search or filter
                criteria. Try adjusting your filters to view more results.
            </p>
        </div>
    );
}