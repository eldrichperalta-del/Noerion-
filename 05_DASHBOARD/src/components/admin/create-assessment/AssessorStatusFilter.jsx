function AssessorStatusFilter({
  status,
  setStatus,
}) {
  return (
    <select
      value={status}
      onChange={(e) =>
        setStatus(e.target.value)
      }
      className="
    w-full
    rounded-xl
    border
    border-gray-400
    px-4
    py-3
    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
    focus:border-blue-500
    focus:outline-none
  "
    >
      <option>All Status</option>
      <option>Active</option>
      <option>Inactive</option>
    </select>
  );
}

export default AssessorStatusFilter;