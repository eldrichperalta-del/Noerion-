import AssessorPanel from "../shared/AssessorPanel";

export default function AIAnalysisPanel({
  insights,
  onProceed,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {insights.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
          >
            <p className="text-sm font-semibold text-gray-500">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <AssessorPanel title="AI Analysis & Insights">
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {insights.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <p className="font-semibold text-gray-950">
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </AssessorPanel>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onProceed}
          className="rounded-lg bg-[#002f86] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.35)] hover:bg-[#00266b]"
        >
          Proceed to Final Decision
        </button>
      </div>
    </div>
  );
}
