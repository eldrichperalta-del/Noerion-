import { Users } from "lucide-react";

export default function AssessorPreviewCard({ assessor }) {
  const selectedCount = assessor ? 1 : 0;

  return (
    <div
      className="
        w-full
        h-full
        bg-white
        rounded-2xl
        px-6
        py-6
        shadow-[0_4px_12px_rgba(0,0,0,0.35)]
        flex
        flex-col
        overflow-hidden
      "
    >
      {/* HEADER */}
      <h2 className="text-xl font-bold text-[#001F5B] mb-4 center">
        Selected Assessor Preview
      </h2>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">
        {!assessor ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No assessor selected
          </div>
        ) : (
          <>
            {/* PROFILE */}
            <div className="flex flex-col items-center">
              <img
                src="https://i.pravatar.cc/150"
                className="w-24 h-24 rounded-full object-cover"
              />

              <h3 className="mt-3 text-lg font-bold text-gray-900">
                {assessor.name}
              </h3>

              <p className="text-sm text-gray-500">
                {assessor.assessorId}
              </p>

              <span className="mt-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                {assessor.status}
              </span>
            </div>

            <div className="my-4 h-px w-full bg-gray-200" />

            {/* EXPERIENCE */}
            <div className="mb-4">
              <h4 className="text-[#001F5B] font-semibold mb-2">
                Experience
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                <li>{assessor.experience}</li>
              </ul>
            </div>

            {/* SPECIALIZATION */}
            <div className="mb-4">
              <h4 className="text-[#001F5B] font-semibold mb-2">
                Specialization
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                <li>{assessor.specialization}</li>
              </ul>
            </div>

            {/* WORKLOAD */}
            <div>
              <h4 className="text-[#001F5B] font-semibold mb-2">
                Current Workload
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                <li>
                  {assessor.workload} ongoing session
                  {assessor.workload !== 1 ? "s" : ""}
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* FOOTER BADGE (NO EMOJI) */}
      <div className="mt-4">
        <div className="flex items-center justify-center gap-2 bg-blue-50 text-[#001F5B] font-medium px-4 py-3 rounded-xl border border-blue-100">
          <Users size={18} className="text-[#001F5B]" />
          <span>{selectedCount} Assessor Selected</span>
        </div>
      </div>
    </div>
  );
}