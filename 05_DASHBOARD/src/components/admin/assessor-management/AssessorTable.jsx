import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditAssessorModal from "./EditAssessorModal";
import RegistrationProfileModal from "../shared/RegistrationProfileModal";

function AssessorTable({
  assessors,
  onDeactivate,
  onReactivate,
  onDelete,
  onUpdate,
  onReject,
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssessor, setSelectedAssessor] = useState(null);
  const [profileAssessor, setProfileAssessor] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const menuRef = useRef(null);

  // Same rule as Assessment and Trainee Management: 5 records per page.
  const rowsPerPage = 5;

  const [formData, setFormData] = useState({
    fullName: "",
    assessorId: "",
    email: "",
  });

  // Close action menu when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset to page 1 when filtered assessor data changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [assessors.length]);

  const totalPages = Math.max(Math.ceil(assessors.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAssessors = assessors.slice(startIndex, endIndex);

  const showingStart = assessors.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, assessors.length);

  const getStatusClass = (status) => {
    const normalizedStatus = String(status ?? "").toLowerCase().trim();

    if (normalizedStatus === "active") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "inactive") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const handleEditClick = (assessor) => {
    setSelectedAssessor(assessor);

    setFormData({
      fullName: assessor.fullName,
      assessorId: assessor.assessorId,
      email: assessor.email,
    });

    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDeactivate = (id) => {
    onDeactivate(id);
    setOpenMenuId(null);
  };

  const handleReactivate = (id) => {
    onReactivate(id);
    setOpenMenuId(null);
  };

  const handleDelete = (id) => {
    onDelete(id);
    setOpenMenuId(null);
  };

  const handleUpdate = () => {
    onUpdate({
      ...selectedAssessor,
      ...formData,
    });

    setShowEditModal(false);
    setSelectedAssessor(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
        {/* Same as Assessment Management: horizontal overflow only, no vertical scroll. */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-4 text-left font-bold">#</th>
                <th className="px-4 py-4 text-left font-bold">Full Name</th>
                <th className="px-4 py-4 text-left font-bold">Assessor ID</th>
                <th className="px-4 py-4 text-left font-bold">Email</th>
                <th className="px-4 py-4 text-left font-bold">Status</th>
                <th className="px-4 py-4 text-center font-bold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedAssessors.length > 0 ? (
                paginatedAssessors.map((assessor, index) => {

                  return (
                    <tr
                      key={assessor.id}
                      className="border-b border-gray-300 hover:bg-gray-100"
                    >
                      <td className="px-4 py-3">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-4 py-3">{assessor.fullName}</td>

                      <td className="px-4 py-3">{assessor.assessorId}</td>

                      <td className="px-4 py-3">{assessor.email}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-4 py-1 font-medium ${getStatusClass(
                            assessor.status
                          )}`}
                        >
                          {assessor.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          ref={openMenuId === assessor.id ? menuRef : null}
                          className="relative flex justify-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === assessor.id ? null : assessor.id
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-blue-100 hover:text-blue-600"
                            aria-label="Open assessor actions"
                          >
                            <span className="flex flex-col gap-1">
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="h-1 w-1 rounded-full bg-current" />
                            </span>
                          </button>

                          {openMenuId === assessor.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                              <button type="button" onClick={() => { setProfileAssessor(assessor); setOpenMenuId(null); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100">View Profile</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                    No assessors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Same pagination footer format as Assessment and Trainee Management. */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
            <p className="font-medium text-gray-700">
              Showing {showingStart}-{showingEnd} of {assessors.length}{" "}
              assessors
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(page - 1, 1))
                }
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 shadow-sm">
                {currentPage}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditAssessorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAssessor(null);
        }}
        assessor={selectedAssessor}
        formData={formData}
        setFormData={setFormData}
        onUpdate={handleUpdate}
      />
      <RegistrationProfileModal profile={profileAssessor} title="Assessor Profile" onClose={() => setProfileAssessor(null)} onApprove={(id) => handleReactivate(id)} onReject={onReject} />
    </>
  );
}

export default AssessorTable;
