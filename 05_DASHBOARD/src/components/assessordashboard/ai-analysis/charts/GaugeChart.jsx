import { useEffect, useState } from "react";

export default function GaugeChart({
  value,
  color = "#2563EB",
}) {
  /* ==========================================================
     VALUE

     This is the percentage CHANGE FROM BASELINE.

     Examples:

       +44
       +121
       -5
     ========================================================== */

  const numericValue =
    Number(value);

  const safeValue =
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0;

  const [progress, setProgress] =
    useState(0);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setProgress(
          safeValue
        );
      }, 200);

    return () =>
      clearTimeout(timer);
  }, [safeValue]);

  /* ==========================================================
     GAUGE SCALE

     Visual range is 0–100.

     The actual value remains unchanged.

     Example:

       +44 → 44 visual progress
       +121 → 100 visual progress
       -5 → 5 visual magnitude
     ========================================================== */

  const visualProgress =
    Math.max(
      0,
      Math.min(
        Math.abs(progress),
        100
      )
    );

  /* ==========================================================
     GAUGE CONFIGURATION
     ========================================================== */

  const radius = 45;

  const circumference =
    Math.PI * radius;

  const offset =
    circumference -
    (visualProgress / 100) *
      circumference;

  /* ==========================================================
     FORMAT VALUE

     Whole number to match Trainee POV.

       +43.83 → +44%
       +121.19 → +121%
       -4.54 → -5%
     ========================================================== */

  const formatValue = (
    number
  ) => {
    const rounded =
      Math.round(number);

    if (rounded > 0) {
      return `+${rounded}%`;
    }

    if (rounded < 0) {
      return `${rounded}%`;
    }

    return "0%";
  };

  /* ==========================================================
     VALUE TEXT COLOR
     ========================================================== */

  const valueClass =
    progress > 0
      ? "text-green-600"
      : progress < 0
      ? "text-red-600"
      : "text-gray-900";

  /* ==========================================================
     GAUGE
     ========================================================== */

  return (
    <div className="relative flex h-full w-full items-center justify-center">

      <svg
        viewBox="0 0 160 160"
        className="h-full w-full"
      >

        {/* ====================================================
            BACKGROUND ARC
            ==================================================== */}

        <path
          d="M 35 95 A 45 45 0 0 1 125 95"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* ====================================================
            PROGRESS ARC
            ==================================================== */}

        <path
          d="M 35 95 A 45 45 0 0 1 125 95"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
          className="transition-all duration-1000 ease-out"
        />

      </svg>

      {/* ======================================================
          CENTER VALUE
          ====================================================== */}

      <div className="absolute bottom-4 text-center">

        <p
          className={`text-2xl font-bold ${valueClass}`}
        >
          {formatValue(
            progress
          )}
        </p>

      </div>

    </div>
  );
}