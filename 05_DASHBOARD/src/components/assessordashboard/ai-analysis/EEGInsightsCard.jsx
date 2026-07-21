import eegIcon from "../../../assets/eeg.svg";

import EEGMetricItem from "./EEGMetricItem";

export default function EEGInsightsCard({ eeg }) {

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Replace the mock "eeg" prop with live EEG metrics
    // returned by the AI analysis endpoint.
    //
    // Expected object:
    //
    // {
    //     attention: {
    //         value: number,
    //         data: number[]
    //     },
    //
    //     focus: {
    //         value: number,
    //         data: number[]
    //     },
    //
    //     engagement: {
    //         value: number,
    //         data: number[]
    //     }
    // }
    //
    // "type" determines which visualization is rendered.
    //
    // gauge  -> Attention Level
    // donut  -> Focus Level
    // bar    -> Engagement Level
    //
    // ==========================================================

    if (!eeg) return null;

    return (

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* ======================================================
                HEADER
            ====================================================== */}

            <div className="flex items-center gap-3 border-gray-200 px-6 py-4">

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
            ====================================================== */}

            <div className="grid grid-cols-3 gap-6 p-6">

                {/* -------------------------------
                    Attention
                    Gauge Chart
                -------------------------------- */}

                <EEGMetricItem
                    title="Attention Level"
                    type="gauge"
                    value={eeg.attention.value}
                    color="#2563EB"
                    data={eeg.attention.data}
                />


                <EEGMetricItem
                    title="Focus Level"
                    type="donut"
                    value={eeg.focus.value}
                    color="#F59E0B"
                    data={eeg.focus.data}
                />


                <EEGMetricItem
                    title="Engagement Level"
                    type="bar"
                    value={eeg.engagement.value}
                    color="#10B981"
                    data={eeg.engagement.data}
                />

            </div>

        </div>

    );

}