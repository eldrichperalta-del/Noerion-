import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ==========================================
 * CERTIFICATE TABLE (BACKEND READY)
 * ==========================================
 * Supports:
 * - frontend pagination (current mode)
 * - backend pagination (future switch-ready)
 * - safe dropdown handling
 */

export default function CertificateTable({
  certificates = [],
  loading = false,
  error = null,
  onView,
  onTrack,
  onRevoke,
}) {

  // =========================
  // UI STATE
  // =========================
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const rowsPerPage = 5;

  // =========================
  // RESET PAGE WHEN DATA CHANGES
  // =========================
  useEffect(() => {
    setCurrentPage(1);
  }, [certificates]);

  // =========================
  // CLOSE MENU ON ESC (UX IMPROVEMENT)
  // =========================
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // =========================
  // BACKEND NOTE:
  // =========================
  // If backend sends paginated data,
  // REMOVE slicing logic below.

  const isFrontendPaginated = true;

  const paginatedCertificates = useMemo(() => {

    if (!isFrontendPaginated) return certificates;

    const safe = Array.isArray(certificates) ? certificates : [];
    const start = (currentPage - 1) * rowsPerPage;

    return safe.slice(start, start + rowsPerPage);

  }, [certificates, currentPage]);

  // =========================
  // PAGINATION META
  // =========================
  const totalPages = useMemo(() => {
    return Math.max(
      Math.ceil((certificates?.length || 0) / rowsPerPage),
      1
    );
  }, [certificates]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const showingStart =
    certificates.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, certificates.length);

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Loading certificates...
      </div>
    );
  }

  // =========================
  // ERROR STATE
  // =========================
  if (error) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">

        <table className="w-full">

          {/* HEADER */}
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-bold">Certificate ID</th>
              <th className="px-4 py-4 text-left font-bold">Trainee Name</th>
              <th className="px-4 py-4 text-left font-bold">Course</th>
              <th className="px-4 py-4 text-left font-bold">Date Issued</th>
              <th className="px-4 py-4 text-left font-bold">Status</th>
              <th className="px-4 py-4 text-center font-bold">Actions</th>
            </tr>
          </thead>

          <tbody>

            {paginatedCertificates.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No certificates found.
                </td>
              </tr>
            ) : (

              paginatedCertificates.map((item, i) => {

                // =========================
                // IMPORTANT BACKEND NOTE:
                // MUST BE REAL ID FROM API
                // =========================
                const rowId =
                  item?.certificateId || `fallback-${i}`;

                return (
                  <tr
                    key={rowId}
                    className="border-b hover:bg-gray-100 transition"
                  >

                    <td className="px-4 py-3">{item?.certificateId}</td>
                    <td className="px-4 py-3">{item?.traineeName}</td>
                    <td className="px-4 py-3">{item?.course}</td>
                    <td className="px-4 py-3">{item?.dateIssued}</td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item?.status === "Issued"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item?.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-center relative">

                      {/* 3 DOT MENU */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === rowId ? null : rowId
                          );
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        <div className="flex flex-col gap-[2px]">
                          <span className="h-1 w-1 bg-gray-700 rounded-full" />
                          <span className="h-1 w-1 bg-gray-700 rounded-full" />
                          <span className="h-1 w-1 bg-gray-700 rounded-full" />
                        </div>
                      </button>

                      {/* DROPDOWN */}
                      {openMenuId === rowId && (
                        <div
                          className="absolute right-0 mt-2 z-30 w-36 rounded-lg bg-white shadow"
                          onClick={(e) => e.stopPropagation()}
                        >

                          <button
                            onClick={() => {
                              onView?.(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => {
                              onTrack?.(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            Track
                          </button>

                          <button
                            onClick={() => {
                              onRevoke?.(item);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                          >
                            Revoke
                          </button>

                        </div>
                      )}

                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

        <p className="font-medium text-gray-700">
          Showing {showingStart}-{showingEnd} of {certificates.length}
        </p>

        <div className="flex items-center gap-3">

          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          <span className="px-3 py-2 border rounded-lg">
            {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>

        </div>

      </div>
    </div>
  );
}