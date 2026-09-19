import eegIcon from "../../../assets/eeg.svg";
import EEGMetricItem from "./EEGMetricItem";

export default function EEGInsightsCard({ eeg }) {
  if (!eeg) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-center h-full">
        <p className="text-xs text-slate-400 italic">
          No supplementary EEG reading recorded for this assessment.
        </p>
      </div>
    );
  }

  const attentionChange = Number(eeg?.attention?.change) || 0;
  const engagementChange = Number(eeg?.engagement?.change) || 0;
  const cognitiveLoadChange = Number(eeg?.cognitiveLoad?.change) || 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img src={eegIcon} alt="EEG" className="h-5 w-5 opacity-80" />
          <h2 className="text-base font-bold text-slate-900">
            EEG-Supported Evidence
          </h2>
        </div>
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
          {eeg.segmentCount ? `${eeg.segmentCount} Segments` : "Supplementary"}
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Question-level EEG observations provide supplementary context alongside response timing and accuracy. They are not treated as direct measures of competency.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-1">
        <EEGMetricItem
          title="Attention"
          type="gauge"
          value={attentionChange}
          activeAverage={eeg?.attention?.activeAverage}
          baseline={eeg?.attention?.baseline}
        />

        <EEGMetricItem
          title="Engagement"
          type="donut"
          value={engagementChange}
          activeAverage={eeg?.engagement?.activeAverage}
          baseline={eeg?.engagement?.baseline}
        />

        <EEGMetricItem
          title="Cognitive Load"
          type="bar"
          value={cognitiveLoadChange}
          activeAverage={eeg?.cognitiveLoad?.activeAverage}
          baseline={eeg?.cognitiveLoad?.baseline}
        />
      </div>
    </div>
  );
}