import GaugeChart from "./charts/GaugeChart";
import DonutChart from "./charts/DonutChart";
import BarChart from "./charts/BarChart";


export default function EEGMetricItem({
    title,
    value,
    type,
}) {


    const renderChart = () => {

        switch (type) {

            case "gauge":
                return <GaugeChart value={value} />;

            case "donut":
                return <DonutChart value={value} />;

            case "bar":
                return <BarChart value={value} />;

            default:
                return null;
        }

    };


    return (

        <div className="flex flex-col items-center">

            <h3 className="mb-4 text-center text-sm font-semibold text-gray-700">
                {title}
            </h3>


            {/* FIXED CHART SIZE CONTAINER */}

            <div className="
                flex
                h-40
                w-40
                items-center
                justify-center
            ">
                {renderChart()}
            </div>


        </div>

    );

}