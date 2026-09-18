import { BrainCircuit } from "lucide-react";
import AssessorPanel from "../shared/AssessorPanel";

export default function AIInterpretationCard({ interpretation }) {
  return (
    <AssessorPanel title="">
      <div className="p-6">
        {/* AI Header */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <BrainCircuit size={24} className="text-[#2563EB]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              AI Performance Interpretation
            </p>

            <p className="text-xs text-slate-500">
              Generated from written assessment and EEG cognitive analysis.
            </p>
          </div>
        </div>

        {/* Interpretation Body */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm leading-8 text-slate-700 whitespace-pre-line">
            {interpretation || "No interpretation data available."}
          </p>
        </div>
      </div>
    </AssessorPanel>
  );
}