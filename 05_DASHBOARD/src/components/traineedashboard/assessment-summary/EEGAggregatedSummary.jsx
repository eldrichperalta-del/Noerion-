import { BrainCircuit } from "lucide-react";
import EEGWave from "../../common/EEGWave";

export default function EEGAggregatedSummary() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">

        <div className="flex items-center gap-2">
          <BrainCircuit
            size={22}
            className="text-cyan-600"
          />

          <h2 className="text-2xl font-bold text-gray-800">
            EEG Aggregated Summary
          </h2>
        </div>

      </div>

      <p className="text-sm text-gray-500 mb-5">
        A clean graph over the duration of the assessment.
      </p>

      {/* EEG Graph */}
      <div className="h-44 rounded-xl bg-slate-50 border border-gray-200 overflow-hidden">

        <EEGWave
          variant="baseline"
          className="w-full h-full"
          showGrid={true}
        />

      </div>

      {/* Legend */}

      <div className="flex justify-center gap-8 mt-5 text-sm font-medium">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3"></span>
          Delta
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 "></span>
          Theta
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 "></span>
          Alpha
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3"></span>
          Beta
        </div>

      </div>

    </div>
  );
}