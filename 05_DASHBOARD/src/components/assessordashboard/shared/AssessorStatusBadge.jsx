export default function AssessorStatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase();

  const statusClass =
    {
      pending: "bg-amber-100 text-amber-700",
      scheduled: "bg-sky-100 text-sky-700",
      ongoing: "bg-sky-100 text-sky-700",
      completed: "bg-green-100 text-green-700",
      valid: "bg-emerald-100 text-emerald-700",
      evaluated: "bg-violet-100 text-violet-700",
      passed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    }[normalizedStatus] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
    >
      {status}
    </span>
  );
}
