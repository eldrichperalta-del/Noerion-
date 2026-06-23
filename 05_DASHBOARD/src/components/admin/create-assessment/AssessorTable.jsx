export default function AssessorTable({
  assessors,
  selectedAssessor,
  setSelectedAssessor,
}) {
  return (
    <div className="overflow-hidden rounded-xl border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="w-1/4 px-4 py-4 text-left font-bold">Full Name</th>
            <th className="w-1/4 px-4 py-4 text-left font-bold">Assessor ID</th>
            <th className="w-1/4 px-4 py-4 text-left font-bold">Status</th>
            <th className="w-1/4 px-4 py-4 text-left font-bold">Experience</th>
          </tr>
        </thead>

        <tbody>
          {assessors.map((assessor) => {
            const isSelected = selectedAssessor?.id === assessor.id;

            return (
              <tr
                key={assessor.id}
                className={`border-b border-gray-300 hover:bg-gray-100 ${isSelected ? "bg-blue-50" : ""
                  }`}
              >
                {/* Full Name + checkbox */}
                <td className="w-1/4 px-4 py-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedAssessor(isSelected ? null : assessor)
                      }
                      className="h-4 w-4 accent-[#001F5B]"
                    />
                    <span className="font-medium text-gray-900">
                      {assessor.name}
                    </span>
                  </label>
                </td>

                <td className="w-1/4 px-4 py-3 text-gray-700">
                  {assessor.assessorId}
                </td>

                <td className="w-1/4 px-4 py-3">
                  {assessor.status === "Active" ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </td>

                <td className="w-1/4 px-4 py-3 text-gray-700">
                  {assessor.experience}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}