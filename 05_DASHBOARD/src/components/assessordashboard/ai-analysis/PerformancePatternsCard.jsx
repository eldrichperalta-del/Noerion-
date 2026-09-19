import AssessorPanel from "../shared/AssessorPanel";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function PerformancePatternsCard({ patterns }) {
  const parseList = (data) => {
    if (!data) return [];
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [data];
      } catch {
        return [data];
      }
    }
    return Array.isArray(data) ? data : [];
  };

  const strengths = parseList(patterns?.strengths);
  const areasForImprovement = parseList(patterns?.areas_for_improvement);

  return (
    <AssessorPanel>
      <div className="p-6 space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Performance Patterns
        </h2>

        <PatternSection
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          title="Assessment Strengths"
          items={strengths}
        />

        <PatternSection
          icon={<AlertTriangle size={18} className="text-amber-500" />}
          title="Areas for Follow-up Review"
          items={areasForImprovement}
        />
      </div>
    </AssessorPanel>
  );
}

function PatternSection({ icon, title, items }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-2.5 text-xs leading-relaxed text-slate-700"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-slate-400">No items flagged for this section.</p>
      )}
    </div>
  );
}