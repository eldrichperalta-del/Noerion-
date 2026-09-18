import eegIcon from "../../../assets/eeg.svg";
import EEGMetricItem from "./EEGMetricItem";

export default function EEGInsightsCard({ eeg }) {
  /* ==========================================================
     EEG INSIGHTS

     The values supplied by AIAnalysisInsights.jsx are already
     calculated from all active EEG segments.

     Example:

     Attention:
       active average = 2.51
       baseline       = 1.74
       change         = +43.83%

     Engagement:
       active average = 0.81
       baseline       = 0.37
       change         = +121.19%

     Cognitive Load:
       active average = 3.59
       baseline       = 3.76
       change         = -4.54%

     The UI displays the CHANGE FROM BASELINE as the main
     cognitive metric.
     ========================================================== */

  if (!eeg) {
    return null;
  }

  /* ==========================================================
     CHANGE VALUES
     ========================================================== */

  const attentionChange =
    Number(eeg?.attention?.change) || 0;

  const engagementChange =
    Number(eeg?.engagement?.change) || 0;

  const cognitiveLoadChange =
    Number(eeg?.cognitiveLoad?.change) || 0;

  /* ==========================================================
     EEG CARD
     ========================================================== */

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex items-center gap-3 px-6 py-4">

        <img
          src={eegIcon}
          alt="EEG"
          className="h-6 w-6"
        />

        <h2 className="text-lg font-semibold text-gray-900">
          EEG Insights
        </h2>

      </div>

      {/* ======================================================
          EEG METRICS

          Each chart receives the percentage change from
          baseline.

          Attention:
            +43.83%

          Engagement:
            +121.19%

          Cognitive Load:
            -4.54%
          ====================================================== */}

      <div className="grid grid-cols-1 gap-6 px-6 pb-6 md:grid-cols-3">

        {/* ====================================================
            ATTENTION
            ==================================================== */}

        <EEGMetricItem
          title="Attention"
          type="gauge"
          value={attentionChange}
          activeAverage={eeg?.attention?.activeAverage}
          baseline={eeg?.attention?.baseline}
        />

        {/* ====================================================
            ENGAGEMENT
            ==================================================== */}

        <EEGMetricItem
          title="Engagement"
          type="donut"
          value={engagementChange}
          activeAverage={eeg?.engagement?.activeAverage}
          baseline={eeg?.engagement?.baseline}
        />

        {/* ====================================================
            COGNITIVE LOAD
            ==================================================== */}

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
