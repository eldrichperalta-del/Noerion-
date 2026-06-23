import { useState } from "react";

import AssessorSearchBar from "../../../../components/admin/create-assessment/AssessorSearchBar";
import AssessorStatusFilter from "../../../../components/admin/create-assessment/AssessorStatusFilter";
import AssessorTable from "../../../../components/admin/create-assessment/AssessorTable";
import AssessorPreviewCard from "../../../../components/admin/create-assessment/AssessorPreviewCard";

export default function AssignAssessor({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [selectedAssessor, setSelectedAssessor] = useState(null);

  const handleNext = () => {
    console.log("SELECTED ASSESSOR:", selectedAssessor);

    setAssessmentData((prev) => {
      const updated = {
        ...prev,
        assessor: selectedAssessor,
      };

      console.log("UPDATED DATA:", updated);

      return updated;
    });

    onNext();
  };


  const assessors = [
    {
      id: 1,
      name: "Emily Chen",
      assessorId: "ASR-2023-011",
      status: "Active",
      experience: "8 Years",
      specialization: "Cookery NC II",
      workload: 1,
    },
    {
      id: 2,
      name: "Marcus Kim",
      assessorId: "ASR-2023-012",
      status: "Active",
      experience: "5 Years",
      specialization: "Bread and Pastry NC II",
      workload: 2,
    },
    {
      id: 3,
      name: "Sarah Jenkins",
      assessorId:
        "ASR-2023-013",
      status: "Active",
      experience: "12 Years",
      specialization:
        "Food Preparation NC II",
      workload: 0,
    },
    {
      id: 4,
      name: "Bob Green",
      assessorId:
        "ASR-2023-014",
      status: "Active",
      experience: "7 Years",
      specialization:
        "Housekeeping NC II",
      workload: 3,
    },
    {
      id: 5,
      name: "Charlie White",
      assessorId:
        "ASR-2023-015",
      status: "Inactive",
      experience: "10 Years",
      specialization:
        "Cookery NC II",
      workload: 0,
    },


  ];

  const filteredAssessors = assessors.filter((assessor) => {
    const matchesSearch =
      assessor.name.toLowerCase().includes(search.toLowerCase()) ||
      assessor.assessorId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All Status" || assessor.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mt-[-10px] grid grid-cols-12 gap-6 items-stretch min-h-[75vh]">

      {/* LEFT */}
      <div className="col-span-9 bg-white rounded-xl p-6 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

        <h2 className="text-xl font-semibold text-gray-900">
          Choose one assessor for this assessment session
        </h2>

        {/* SEARCH + FILTER */}
        <div className="grid grid-cols-12 gap-6 my-6">
          <div className="col-span-8">
            <AssessorSearchBar search={search} setSearch={setSearch} />
          </div>

          <div className="col-span-4">
            <AssessorStatusFilter status={status} setStatus={setStatus} />
          </div>
        </div>

        {/* TABLE AREA (IMPORTANT: MUST BE FLEX-1 + SCROLLABLE) */}
        <div className="flex-1 overflow-auto">
          <AssessorTable
            assessors={filteredAssessors}
            selectedAssessor={selectedAssessor}
            setSelectedAssessor={setSelectedAssessor}
          />
        </div>

        {/* FOOTER (MATCH SelectTrainees STYLE) */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>Total selected: {selectedAssessor ? 1 : 0}</div>

          <div className="flex items-center gap-4">
            <div>Showing 1-5 of {filteredAssessors.length} assessors</div>

            <div className="flex items-center gap-2">
              <button className="px-2 py-1 border rounded">‹</button>
              <span className="px-3">1</span>
              <button className="px-2 py-1 border rounded">›</button>
            </div>
          </div>
        </div>

        {/* BUTTONS (ALWAYS BELOW FOOTER) */}
        <div className="flex justify-end gap-4 mt-4">

          {/* BACK BUTTON */}
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
          >
            Back
          </button>

          {/* NEXT BUTTON */}
          <button
            onClick={handleNext}
            disabled={!selectedAssessor}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition ${selectedAssessor
                ? "bg-[#001F5B] hover:bg-[#001746]"
                : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            Next Step
          </button>

        </div>

      </div>

      {/* RIGHT */}
      <div className="col-span-3 flex h-full">
        <AssessorPreviewCard assessor={selectedAssessor} />
      </div>

    </div>
  );

}
