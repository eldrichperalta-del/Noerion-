function AssessorVerificationFilter({
  value,
  onChange,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
    >
      <option value="All">
        Verification: All
      </option>

      <option value="Verified">
        Verified
      </option>

      <option value="Not Verified">
        Not Verified
      </option>
    </select>
  );
}

export default AssessorVerificationFilter;
