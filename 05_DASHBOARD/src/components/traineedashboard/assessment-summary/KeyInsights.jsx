import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function KeyInsights() {

  const strengths = [
    "High cognitive engagement throughout assessment.",
    "Excellent practical performance.",
    "Stable EEG attention patterns.",
    "Consistent response accuracy.",
  ];

  const improvements = [
    "Increase theoretical knowledge retention.",
    "Reduce minor attention fluctuations.",
    "Improve time management.",
    "Practice more advanced scenarios.",
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Key Insights
      </h2>

      <div className="grid grid-cols-2 gap-8">

        {/* Strengths */}

        <div>

          <div className="flex items-center gap-2 mb-4">

            <TrendingUp
              size={22}
              className="text-green-600"
            />

            <h3 className="text-lg font-semibold text-green-700">
              Strengths
            </h3>

          </div>

          <ul className="space-y-3 list-disc list-inside text-gray-700">

            {strengths.map((item, index) => (

              <li key={index}>{item}</li>

            ))}

          </ul>

        </div>

        {/* Improvements */}

        <div>

          <div className="flex items-center gap-2 mb-4">

            <TrendingDown
              size={22}
              className="text-red-600"
            />

            <h3 className="text-lg font-semibold text-red-700">
              Areas for Improvement
            </h3>

          </div>

          <ul className="space-y-3 list-disc list-inside text-gray-700">

            {improvements.map((item, index) => (

              <li key={index}>{item}</li>

            ))}

          </ul>

        </div>

      </div>

    </div>
  );
}