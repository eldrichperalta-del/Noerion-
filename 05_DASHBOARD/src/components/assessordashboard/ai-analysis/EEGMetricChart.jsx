import GaugeChart from "./charts/GaugeChart";
import DonutChart from "./charts/DonutChart";
import BarChart from "./charts/BarChart";


export default function EEGMetricChart({
    type,
    value,
    color,
    data,
}) {


    // ==========================================================
    // BACKEND HANDOFF:
    //
    // type determines the visualization used for each EEG metric.
    //
    // gauge  -> Attention Level
    // donut  -> Focus Level
    // bar    -> Engagement Level
    //
    // ==========================================================


    if (type === "gauge") {

        return (
            <GaugeChart
                value={value}
                color={color}
            />
        );

    }


    if (type === "donut") {

        return (
            <DonutChart
                value={value}
                color={color}
            />
        );

    }


    if (type === "bar") {

        return (
            <BarChart
                value={value}
                color={color}
                data={data}
            />
        );

    }


    return null;

}