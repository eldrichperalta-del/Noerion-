import {
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function AIRecommendations() {

  const recommendations = [
    "Continue practical robotics exercises weekly.",
    "Maintain high attention through short study intervals.",
    "Improve theoretical electronics knowledge.",
    "Practice advanced troubleshooting scenarios.",
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">

      <div className="flex items-center gap-2 mb-5">

        <Sparkles
          size={22}
          className="text-violet-600"
        />

        <h2 className="text-xl font-bold text-gray-800">
          AI Feedback & Recommendations
        </h2>

      </div>

      <div className="space-y-4">

        {recommendations.map((item, index) => (

          <div
            key={index}
            className="flex gap-3"
          >

            <CheckCircle2
              size={18}
              className="text-green-600 mt-1"
            />

            <p className="text-gray-700">
              {item}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}