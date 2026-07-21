import { MessageSquareText } from "lucide-react";

export default function AssessorFeedback() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">

      <div className="flex items-center gap-2 mb-5">

        <MessageSquareText
          size={22}
          className="text-orange-600"
        />

        <h2 className="text-xl font-bold text-gray-800">
          Assessor Feedback
        </h2>

      </div>

      <div className="space-y-4 text-gray-700 leading-relaxed">

        <p>
          Demonstrated excellent understanding of robotics concepts
          and followed assessment procedures accurately.
        </p>

        <p>
          Practical execution was consistent and confidence remained
          stable throughout the examination.
        </p>

        <p className="font-semibold text-green-700">
          Recommendation:
        </p>

        <p>
          Candidate is recommended for certification under
          TESDA NC III Electronics.
        </p>

      </div>

    </div>
  );
}