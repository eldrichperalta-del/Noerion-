import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ResultsTable({
  results = [],
  loading = false,
  error = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const rowsPerPage = 5;

  // =========================
  // RESET PAGE WHEN DATA CHANGES
  // =========================
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // =========================
  // PAGINATION (SAFE GUARD)
  // =========================
  const totalPages = useMemo(() => {
    return Math.max(Math.ceil((results?.length || 0) / rowsPerPage), 1);
  }, [results]);

  const paginatedResults = useMemo(() => {
    const safeResults = results || [];
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return safeResults.slice(startIndex, endIndex);
  }, [results, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const showingStart = results.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, results.length);

  // =========================
  // POPUP HANDLERS
  // =========================
  const openPopup = (item) => {
    setSelectedResult(item);
    setOpenMenuId(null);
  };

  const closePopup = () => {
    setSelectedResult(null);
  };

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Loading results...
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
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] relative">

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-bold">#</th>
              <th className="px-4 py-4 text-left font-bold">Trainee Name</th>
              <th className="px-4 py-4 text-left font-bold">Trainee ID</th>
              <th className="px-4 py-4 text-left font-bold">Course</th>
              <th className="px-4 py-4 text-left font-bold">Final Result</th>
              <th className="px-4 py-4 text-left font-bold">Date Completed</th>
              <th className="px-4 py-4 text-center font-bold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No results found.
                </td>
              </tr>
            ) : (
              paginatedResults.map((item, i) => {
                const rowId =
                  item?.resultId ||
                  `${item?.traineeId || "no-id"}-${item?.dateCompleted || i}`;

                return (
                  <tr
                    key={rowId}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <td className="px-4 py-3">
                      {startIndex + i + 1}
                    </td>

                    <td className="px-4 py-3">
                      {item?.traineeName || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {item?.traineeId || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {item?.course || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${item?.finalResult === "Pass"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {item?.finalResult === "Pass"
                          ? "Competent"
                          : "Not Competent"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {item?.dateCompleted || "-"}
                    </td>

                    {/* ================= ACTIONS ================= */}
                    <td className="px-4 py-3 text-center relative">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          const rowId =
                            item?.resultId ||
                            `${item?.traineeId}-${item?.dateCompleted}`;

                          setOpenMenuId(
                            openMenuId === rowId ? null : rowId
                          );
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-blue-100"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="h-1 w-1 bg-current rounded-full" />
                          <span className="h-1 w-1 bg-current rounded-full" />
                          <span className="h-1 w-1 bg-current rounded-full" />
                        </span>
                      </button>

                      {openMenuId === rowId && (
                        <div className="absolute right-8 top-0 z-30 w-36 overflow-hidden rounded-lg bg-white shadow-lg shadow-black/20">
                          <button
                            onClick={() => openPopup(item)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            View Result
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

      {/* ================= POPUP ================= */}
      {selectedResult && (
        <>
          <div
            onClick={closePopup}
            className="fixed inset-0 bg-black/10 backdrop-blur-[0px] z-40"
          />

          <div className="fixed z-50 w-[340px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

            <div className="overflow-hidden rounded-xl bg-white shadow">

              {/* HEADER */}
              <div className="flex items-center justify-between  bg-white px-4 py-3">
                <div className="w-6" />
                <h2 className="flex-1 text-center text-sm font-bold tracking-wide">
                  RESULT DETAILS
                </h2>
                <button onClick={closePopup} className="w-6 text-gray-500 hover:text-black">
                  ✕
                </button>
              </div>

              {/* CONTENT */}
              <div className="space-y-4 p-5 text-base">

                {/* WRITTEN SCORE */}
                <div>
                  <p className="font-semibold text-gray-800">Written Score:</p>
                  <p className="text-gray-700">
                    {selectedResult?.writtenScore != null
                      ? `${selectedResult.writtenScore}%`
                      : "N/A"}
                  </p>
                </div>

                <hr className="border-gray-300" />

                {/* AI SUMMARY */}
                <div>
                  <p className="font-semibold text-gray-800">
                    AI Evaluation Summary
                  </p>

                  {/* removed gray background */}
                  <div className="mt-2 rounded-md border border-gray-200 p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedResult?.aiSummary ||
                        "No evaluation summary available."}
                    </p>
                  </div>
                </div>

                <hr className="border-gray-300" />

                {/* FINAL DECISION */}
                <div>
                  <p className="font-semibold text-gray-800">Final Decision</p>
                  <p
                    className={`text-base font-bold ${selectedResult?.finalResult === "Pass"
                        ? "text-green-600"
                        : "text-red-600"
                      }`}
                  >
                    {selectedResult?.finalResult === "Pass"
                      ? "COMPETENT"
                      : "NOT COMPETENT"}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= PAGINATION (ASSESSMENT STYLE) ================= */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

        {/* LEFT TEXT */}
        <p className="font-medium text-gray-700">
          Showing {showingStart}-{showingEnd} of {results.length} results
        </p>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-3">

          {/* PREV */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          {/* PAGE BOX */}
          <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 shadow-sm">
            {currentPage}
          </span>

          {/* NEXT */}
          <button
            type="button"
            onClick={() =>
              setCurrentPage((p) => Math.min(p + 1, totalPages))
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
  );
}