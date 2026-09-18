import AssessorPanel from "../shared/AssessorPanel";
import {
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function PerformancePatternsCard({
  patterns,
}) {
  // Parse items if they arrive as JSON strings
  // from database columns.
  const parseList = (data) => {
    if (!data) {
      return [];
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);

        return Array.isArray(parsed)
          ? parsed
          : [data];
      } catch {
        return [data];
      }
    }

    return Array.isArray(data)
      ? data
      : [];
  };

  const strengths = parseList(
    patterns?.strengths
  );

  const areasForImprovement = parseList(
    patterns?.areas_for_improvement
  );

  return (
    <AssessorPanel>
      <div className="p-6">

        {/* =====================================================
            CARD TITLE
            ===================================================== */}

        <h2 className="mb-8 text-sm font-semibold tracking-wide text-slate-700">
          PERFORMANCE PATTERNS
        </h2>

        {/* =====================================================
            STRENGTHS
            ===================================================== */}

        <PatternSection
          icon={
            <CheckCircle2
              size={20}
              className="text-green-600"
            />
          }
          title="Strengths"
          items={strengths}
        />

        {/* =====================================================
            AREAS FOR IMPROVEMENT
            ===================================================== */}

        <PatternSection
          icon={
            <AlertTriangle
              size={20}
              className="text-amber-500"
            />
          }
          title="Areas for Improvement"
          items={areasForImprovement}
        />

      </div>
    </AssessorPanel>
  );
}

function PatternSection({
  icon,
  title,
  items,
}) {
  return (
    <div className="mb-8">

      <div className="mb-4 flex items-center gap-3">
        {icon}

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="
                flex
                gap-3
                text-sm
                leading-7
                text-slate-700
              "
            >
              <span
                className="
                  mt-2
                  h-2
                  w-2
                  shrink-0
                  rounded-full
                  bg-slate-400
                "
              />

              <span>
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-slate-400">
          No items available.
        </p>
      )}

    </div>
  );
}