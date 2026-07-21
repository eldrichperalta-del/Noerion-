export default function AIInsightSummaryCard({
  insights,
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // Replace the mock "insights" prop with the AI-generated
  // cognitive insight summary returned after assessment
  // processing.
  //
  // Expected data type:
  // string[]
  //
  // Example API response:
  // [
  //   "High attention stability during assessment.",
  //   "Strong procedural decision-making.",
  //   "Minor hesitation observed during troubleshooting."
  // ]
  //
  // NOTE:
  // This component only displays a brief summary.
  // The complete AI analysis should be displayed on the
  // "AI Analysis & Insights" page.
  // ==========================================================

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI Insight Summary
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of the trainee's cognitive performance generated
            by the AI evaluation engine.
          </p>
        </div>

        {/* AI Indicator */}
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>

          <span className="text-xs font-medium text-blue-700">
            AI Generated
          </span>
        </div>
      </div>


      {/* Insights */}
      <div className="mt-6 flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">

        {insights.length > 0 ? (
          <ul className="space-y-4">

            {insights.map((insight, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
              >

                <div className="mt-1 flex h-2 w-2 items-center justify-center rounded-full bg-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                </div>


                <p className="text-sm leading-relaxed text-gray-700">
                  {insight}
                </p>

              </li>
            ))}

          </ul>

        ) : (

          <p className="text-sm italic text-gray-400">
            No AI insights available.
          </p>

        )}

      </div>

    </div>
  );
}