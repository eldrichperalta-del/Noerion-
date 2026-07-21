export default function AssessorMetricCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  }[tone];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-semibold text-gray-800">
        {label}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className={`rounded-xl p-3 ${toneClass}`}>
          <Icon size={24} />
        </div>

        <span className="text-3xl font-bold text-gray-950">
          {value}
        </span>
      </div>
    </div>
  );
}
