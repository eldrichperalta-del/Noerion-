import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RegistrationProfileModal from "../shared/RegistrationProfileModal";

function TraineeTable({ trainees, onApprove, onReject }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const menuRef = useRef(null);

  // Same as Assessment Management: 5 records per page.
  const rowsPerPage = 5;

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

  // Reset page when filtered data changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [trainees.length]);

  const totalPages = Math.max(Math.ceil(trainees.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTrainees = trainees.slice(startIndex, endIndex);

  const showingStart = trainees.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, trainees.length);

  const getStatusClass = (status) => {
    const normalizedStatus = String(status ?? "").toLowerCase().trim();

    if (normalizedStatus === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalizedStatus === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="overflow-hidden rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-bold">#</th>
              <th className="px-4 py-4 text-left font-bold">Full Name</th>
              <th className="px-4 py-4 text-left font-bold">Trainee ID</th>
              <th className="px-4 py-4 text-left font-bold">Email</th>
              <th className="px-4 py-4 text-left font-bold">Status</th>
              <th className="px-4 py-4 text-left font-bold">
                Verification Status
              </th>
              <th className="px-4 py-4 text-center font-bold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTrainees.length > 0 ? (
              paginatedTrainees.map((trainee, index) => {
                const traineeStatus = trainee.status?.toLowerCase().trim();

                return (
                  <tr
                    key={trainee.id}
                    className="border-b border-gray-300 hover:bg-gray-100"
                  >
                    <td className="px-4 py-3">
                      {startIndex + index + 1}
                    </td>

                    <td className="px-4 py-3">{trainee.fullName}</td>

                    <td className="px-4 py-3">{trainee.traineeId}</td>

                    <td className="px-4 py-3">{trainee.email}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-4 py-1 font-medium ${getStatusClass(
                          trainee.status
                        )}`}
                      >
                        {trainee.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {trainee.verificationStatus}
                    </td>

                    <td className="px-4 py-3">
                      <div
                        ref={openMenuId === trainee.id ? menuRef : null}
                        className="relative flex justify-center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === trainee.id ? null : trainee.id
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-blue-100 hover:text-blue-600"
                          aria-label="Open trainee actions"
                        >
                          <span className="flex flex-col gap-1">
                            <span className="h-1 w-1 rounded-full bg-current" />
                            <span className="h-1 w-1 rounded-full bg-current" />
                            <span className="h-1 w-1 rounded-full bg-current" />
                          </span>
                        </button>

                        {openMenuId === trainee.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                              <button
                                type="button"
                                onClick={() => { setSelectedTrainee(trainee); setOpenMenuId(null); }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                View Profile
                              </button>
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  No trainees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
          <p className="font-medium text-gray-700">
            Showing {showingStart}-{showingEnd} of {trainees.length} trainees
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
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
      <RegistrationProfileModal profile={selectedTrainee} title="Trainee Profile" onClose={() => setSelectedTrainee(null)} onApprove={onApprove} onReject={onReject} />
    </div>
  );
}

export default TraineeTable;
