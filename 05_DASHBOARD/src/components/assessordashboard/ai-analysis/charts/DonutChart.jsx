import { useEffect, useState } from "react";

export default function DonutChart({
  value,
  color = "#F59E0B",
}) {
  /* ==========================================================
     VALUE

     This is the percentage CHANGE FROM BASELINE.
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
     DONUT VISUAL SCALE

     The visual ring uses 0–100.

     The real percentage remains displayed in the center.
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
     DONUT CONFIGURATION
     ========================================================== */

  const radius = 45;

  const circumference =
    2 *
    Math.PI *
    radius;

  const offset =
    circumference -
    (visualProgress / 100) *
      circumference;

  /* ==========================================================
     FORMAT VALUE

     Whole number to match Trainee POV.
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
     DONUT
     ========================================================== */

  return (
    <div className="relative flex h-full w-full items-center justify-center">

      <svg
        viewBox="0 0 160 160"
        className="h-full w-full -rotate-90"
      >

        {/* ====================================================
            BACKGROUND RING
            ==================================================== */}

        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="12"
          fill="none"
        />

        {/* ====================================================
            PROGRESS RING
            ==================================================== */}

        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
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

      <div className="absolute text-center">

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