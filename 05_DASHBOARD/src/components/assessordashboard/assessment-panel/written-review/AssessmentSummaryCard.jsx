import { ClipboardCheck, Trophy, Percent } from "lucide-react";

export default function AssessmentSummaryCard({ assessment }) {
  const totalScore = assessment?.totalScore ?? 42;
  const totalItems = assessment?.totalItems ?? 50;
  const percentage = assessment?.percentage ?? Math.round((totalScore / totalItems) * 100);
  const result = assessment?.result ?? (percentage >= 75 ? "Competent" : "Not Yet Competent");

  // Helper for the individual card container style
  const CardContainer = ({ children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1 flex flex-col items-center justify-center text-center">
      {children}
    </div>
  );

  return (
    <div className="flex gap-3">
      {/* Total Score Container */}
      <CardContainer>
        <div className="mb-2 rounded-lg bg-blue-100 p-2.5">
          <ClipboardCheck size={20} className="text-[#002f86]" />
        </div>
        <p className="text-xs font-bold text-gray-900">Total Score</p>
        <p className="mt-0.5 text-lg font-bold text-gray-900">{totalScore} / {totalItems}</p>
      </CardContainer>

      {/* Percentage Container */}
      <CardContainer>
        <div className="mb-2 rounded-lg bg-amber-100 p-2.5">
          <Percent size={20} className="text-amber-700" />
        </div>
        <p className="text-xs font-bold text-gray-900">Percentage</p>
        <p className="mt-0.5 text-lg font-bold text-gray-900">{percentage}%</p>
      </CardContainer>

      {/* Result Container */}
      <CardContainer>
        <div className={`mb-2 rounded-lg p-2.5 ${result === "Competent" ? "bg-green-100" : "bg-red-100"}`}>
          <Trophy size={20} className={result === "Competent" ? "text-green-700" : "text-red-700"} />
        </div>
        <p className="text-xs font-bold text-gray-900">Assessment Result</p>
        <span className={`mt-1.5 inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${
          result === "Competent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {result}
        </span>
      </CardContainer>
    </div>
  );
}