import { ClipboardCheck, Trophy, Percent, Clock } from "lucide-react";

export default function AssessmentSummaryCard({
  totalScore = 0,
  totalItems = 0,
  percentage = 0,
  result = "In Evaluation",
}) {
  // Normalize status checks to handle Passed, Failed, In Evaluation (and legacy terms safely)
  const isPassed = result === "Passed" || result === "Competent";
  const isFailed = result === "Failed" || result === "Not Yet Competent";

  let statusBg = "bg-amber-100 text-amber-700";
  let iconBg = "bg-amber-100";
  let iconColor = "text-amber-700";
  let IconComponent = Clock;

  if (isPassed) {
    statusBg = "bg-green-100 text-green-700";
    iconBg = "bg-green-100";
    iconColor = "text-green-700";
    IconComponent = Trophy;
  } else if (isFailed) {
    statusBg = "bg-red-100 text-red-700";
    iconBg = "bg-red-100";
    iconColor = "text-red-700";
    IconComponent = Trophy;
  }

  // Reusable card container styling
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
        <p className="mt-0.5 text-lg font-bold text-gray-900">
          {totalScore} / {totalItems}
        </p>
      </CardContainer>

      {/* Percentage Container */}
      <CardContainer>
        <div className="mb-2 rounded-lg bg-amber-100 p-2.5">
          <Percent size={20} className="text-amber-700" />
        </div>
        <p className="text-xs font-bold text-gray-900">Percentage</p>
        <p className="mt-0.5 text-lg font-bold text-gray-900">{percentage}%</p>
      </CardContainer>

      {/* Assessment Result Container */}
      <CardContainer>
        <div className={`mb-2 rounded-lg p-2.5 ${iconBg}`}>
          <IconComponent size={20} className={iconColor} />
        </div>
        <p className="text-xs font-bold text-gray-900">Assessment Result</p>
        <span className={`mt-1.5 inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${statusBg}`}>
          {result}
        </span>
      </CardContainer>
    </div>
  );
}