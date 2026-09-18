import GaugeChart from "./charts/GaugeChart";
import DonutChart from "./charts/DonutChart";
import BarChart from "./charts/BarChart";

function formatEEGValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0.000";
  }

  const truncated = Math.floor(numericValue * 1000) / 1000;
  return truncated.toFixed(3);
}

export default function EEGMetricItem({
  title,
  value,
  type,
  activeAverage,
  baseline,
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
    <div className="flex min-w-0 flex-col items-center">
      <div className="flex h-8 w-full items-start justify-center">
        <h3 className="text-center text-sm font-semibold leading-5 text-gray-700">
          {title}
        </h3>
      </div>

      <div className="flex h-40 w-40 shrink-0 items-center justify-center">
        {renderChart()}
      </div>

      <div className="mt-3 w-full space-y-1 text-center">
        <p className="text-xs text-gray-500">Active Average</p>
        <p className="text-sm font-semibold text-gray-900">
          {formatEEGValue(activeAverage)}
        </p>
        <p className="mt-2 text-xs text-gray-500">Baseline</p>
        <p className="text-sm font-semibold text-gray-900">
          {formatEEGValue(baseline)}
        </p>
      </div>
    </div>
  );
}
