import { useEffect, useState } from "react";

export default function BarChart({
  value,
  color = "#10B981",
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
     BAR VISUAL SCALE

     Visual range is 0–100.

     The actual percentage remains displayed as text.

     Example:

       +44  → 44 visual magnitude
       +121 → full bar
       -5   → 5 visual magnitude
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
     BAR
     ========================================================== */

  return (
    <div className="flex h-32 w-32 flex-col items-center justify-center">

      {/* ====================================================
          VERTICAL BAR
          ==================================================== */}

      <div
        className="
          relative
          h-24
          w-8
          overflow-hidden
          rounded-full
          bg-gray-200
        "
      >

        <div
          className="
            absolute
            bottom-0
            left-0
            w-full
            rounded-full
            transition-all
            duration-1000
            ease-out
          "
          style={{
            height: `${visualProgress}%`,
            backgroundColor: color,
          }}
        />

      </div>

      {/* ====================================================
          VALUE
          ==================================================== */}

      <div className="mt-3 min-h-[32px] text-center">

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