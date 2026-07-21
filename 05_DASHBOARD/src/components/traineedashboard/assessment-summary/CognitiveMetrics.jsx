import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

export default function CognitiveMetrics() {
  const metrics = [
    {
      label: "Average Attention",
      value: 70,
    },
    {
      label: "Average Focus",
      value: 75,
    },
    {
      label: "Cognitive Engagement",
      value: 90,
    },
  ];

  const [animatedValues, setAnimatedValues] = useState(
    metrics.map(() => 0)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(metrics.map((m) => m.value));
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">

        <Brain
          size={22}
          className="text-blue-700"
        />

        <h2 className="text-2xl font-bold text-gray-800">
          Cognitive Metrics
        </h2>

      </div>

      <div className="space-y-6">

        {metrics.map((metric, index) => {

          const value = animatedValues[index];

          return (

            <div key={index}>

              {/* Label */}
              <div className="mb-2">

                <span className="font-medium text-gray-700">
                  {metric.label}
                </span>

              </div>
              <div className="flex items-center gap-4">

                {/* Progress Bar */}
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 rounded-full transition-all duration-[1800ms] ease-out"
                    style={{
                      width: `${value}%`,
                    }}
                  />

                </div>

                {/* Animated Circle */}
                {(() => {
                  const radius = 22;
                  const circumference = 2 * Math.PI * radius;
                  const offset =
                    circumference - (value / 100) * circumference;

                  return (
                    <div className="relative w-14 h-14 flex items-center justify-center">

                      <svg
                        width="56"
                        height="56"
                        className="-rotate-90"
                      >
                        {/* Background Circle */}
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#E5E7EB"
                          strokeWidth="6"
                          fill="none"
                        />

                        {/* Animated Progress */}
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="#1D4ED8"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          style={{
                            transition:
                              "stroke-dashoffset 1.8s ease-out",
                          }}
                        />
                      </svg>

                      {/* Percentage */}
                      <div className="absolute w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">
                          {value}%
                        </span>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}