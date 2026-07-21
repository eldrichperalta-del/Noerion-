export default function ConfidenceRing({
  value = 0,
  size = 170,
  strokeWidth = 14,
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // Replace the "value" prop with the AI confidence score.
  //
  // Expected:
  // number (0-100)
  //
  // Example:
  // 87
  // ==========================================================

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(Math.max(value, 0), 100);

  const offset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">

      <div
        className="relative"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />

          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2563EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset 0.8s ease",
            }}
          />
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-gray-900">
            {progress}%
          </p>

          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Confidence
          </p>
        </div>
      </div>

    </div>
  );
}