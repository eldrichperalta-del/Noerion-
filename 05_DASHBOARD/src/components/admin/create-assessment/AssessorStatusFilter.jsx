function AssessorStatusFilter({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full
        sm:w-auto
        rounded-xl
        border
        border-gray-400
        px-4
        py-3
        shadow-[0_4px_12px_rgba(0,0,0,0.15)]
        focus:border-blue-500
        focus:outline-none
        bg-white
      "
    >
      <option value="All">All Status</option>
      <option value="Approved">Approved</option>
      <option value="Pending">Pending</option>
      <option value="Rejected">Rejected</option>
      <option value="Deactivated">Deactivated</option>
    </select>
  );
}

export default AssessorStatusFilter;