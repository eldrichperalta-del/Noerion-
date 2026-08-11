import { useEffect, useState } from "react";
import { BarChart3, PenSquare } from "lucide-react";

export default function PerformanceBreakdown({ assessment }) {
  // Live score from assessment prop (defaulting to 0 if absent)
  const writtenScore = assessment?.score ?? 0;

  // Animated Progress
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(writtenScore);
    }, 200);

    return () => clearTimeout(timer);
  }, [writtenScore]);

  // Bar Heights matching original ratio calculation
  const blueHeight = progress * 0.5;
  const greenHeight = progress - blueHeight;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={22} className="text-blue-700" />
        <h2 className="text-2xl font-bold text-gray-800">
          Performance Breakdown
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 items-center">
        {/* LEFT */}
        <div>
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenSquare size={18} className="text-gray-500" />
              <span className="font-semibold text-gray-700">Written Score</span>
            </div>
            <span className="font-bold text-blue-700">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-[1800ms] ease-out"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex justify-center items-end h-44">
          {/* Numbers */}
          <div className="flex flex-col justify-between h-36 mr-4 text-xs text-gray-500">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          {/* Graph */}
          <div className="relative h-36 w-32">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-gray-300"></div>
              <div className="border-t border-gray-300"></div>
              <div className="border-t border-gray-300"></div>
              <div className="border-t border-gray-300"></div>
              <div className="border-t border-gray-300"></div>
            </div>

            {/* Left Axis */}
            <div className="absolute left-0 top-0 h-full border-l border-gray-400"></div>

            {/* Stacked Bar */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-full">
              {/* Blue */}
              <div
                className="absolute bottom-0 w-full bg-blue-900 transition-all duration-[1800ms] ease-out"
                style={{
                  height: `${blueHeight}%`,
                }}
              />

              {/* Green */}
              <div
                className="absolute w-full bg-green-500 rounded-t transition-all duration-[1800ms] ease-out"
                style={{
                  height: `${greenHeight}%`,
                  bottom: `${blueHeight}%`,
                }}
              />
            </div>

            {/* Label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium">
              Written
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}