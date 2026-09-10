import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ResultsTable({
  results = [],
  loading = false,
  error = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const rowsPerPage = 5;

  // ============================================================
  // RESET PAGE WHEN RESULTS CHANGE
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = useMemo(() => {
    return Math.max(
      Math.ceil((results?.length || 0) / rowsPerPage),
      1
    );
  }, [results]);

  const paginatedResults = useMemo(() => {
    const safeResults = results || [];

    const startIndex =
      (currentPage - 1) * rowsPerPage;

    const endIndex =
      startIndex + rowsPerPage;

    return safeResults.slice(
      startIndex,
      endIndex
    );
  }, [results, currentPage]);

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const endIndex =
    startIndex + rowsPerPage;

  const showingStart =
    results.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd =
    Math.min(
      endIndex,
      results.length
    );

  // ============================================================
  // RESULT POPUP
  // ============================================================

  const openPopup = (item) => {
    setSelectedResult(item);
    setOpenMenuId(null);
  };

  const closePopup = () => {
    setSelectedResult(null);
  };

  // ============================================================
  // RESULT LABEL
  // ============================================================

  const getResultLabel = (item) => {
    const rawResult =
      item?.finalResult ??
      item?.overall_result ??
      item?.result ??
      "";

    const normalized = String(rawResult)
      .trim()
      .toLowerCase();

    if (
      normalized === "pass" ||
      normalized === "passed" ||
      normalized === "competent"
    ) {
      return "Competent";
    }

    if (
      normalized === "fail" ||
      normalized === "failed" ||
      normalized === "not competent" ||
      normalized === "not yet competent"
    ) {
      return "Not Yet Competent";
    }

    if (
      normalized === "in evaluation" ||
      normalized === "in_evaluation" ||
      normalized === "pending" ||
      !normalized
    ) {
      return "In Evaluation";
    }

    return rawResult;
  };

  // ============================================================
  // RESULT BADGE
  // ============================================================

  const getResultBadgeClass = (result) => {
    switch (result) {
      case "Competent":
        return "border-green-200 bg-green-50 text-green-700";

      case "Not Yet Competent":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  };

  // ============================================================
  // DATE FORMATTER
  // ============================================================

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center text-sm font-medium text-gray-500">
          Loading results...
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      </section>
    );
  }

  // ============================================================
  // TABLE
  // ============================================================

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.40)]">

        {/* ======================================================
            TABLE
        ======================================================= */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            {/* ==================================================
                HEADER
            =================================================== */}

            <thead className="border-b border-gray-200 bg-gray-50/80">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  #
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Trainee Name
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Trainee ID
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Final Result
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Date Completed
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            {/* ==================================================
                BODY
            =================================================== */}

            <tbody className="divide-y divide-gray-100">

              {paginatedResults.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No results found.
                  </td>

                </tr>

              ) : (

                paginatedResults.map(
                  (item, index) => {

                    const rowId =
                      item?.resultId ??
                      `${item?.traineeId || "no-id"}-${index}`;

                    const resultLabel =
                      getResultLabel(item);

                    return (

                      <tr
                        key={rowId}
                        className="transition-colors hover:bg-gray-50/60"
                      >

                        {/* ======================================
                            NUMBER
                        ======================================= */}

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {startIndex + index + 1}
                        </td>

                        {/* ======================================
                            TRAINEE NAME
                        ======================================= */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-900">
                            {item?.traineeName ||
                              item?.trainee_name ||
                              "-"}
                          </p>

                        </td>

                        {/* ======================================
                            TRAINEE ID
                        ======================================= */}

                        <td className="px-5 py-4">

                          <span className="text-sm text-gray-600">
                            {item?.traineeId ||
                              item?.trainee_id ||
                              "-"}
                          </span>

                        </td>

                        {/* ======================================
                            FINAL RESULT
                        ======================================= */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getResultBadgeClass(
                              resultLabel
                            )}`}
                          >
                            {resultLabel}
                          </span>

                        </td>

                        {/* ======================================
                                  DATE COMPLETED
                        ======================================= */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(
                            item?.dateCompleted ||
                            item?.updated_at ||
                            item?.submitted_at ||
                            item?.created_at
                          )}
                        </td>

                        {/* ======================================
                            ACTIONS
                        ======================================= */}

                        <td className="relative px-5 py-4 text-center">

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              setOpenMenuId(
                                openMenuId === rowId
                                  ? null
                                  : rowId
                              );
                            }}
                            aria-label={`Actions for ${item?.traineeName ||
                              item?.traineeId ||
                              "trainee"
                              }`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-blue-100 hover:text-[#002f86]"
                          >

                            <span className="flex flex-col gap-1">

                              <span className="h-1 w-1 rounded-full bg-current" />

                              <span className="h-1 w-1 rounded-full bg-current" />

                              <span className="h-1 w-1 rounded-full bg-current" />

                            </span>

                          </button>

                          {/* ====================================
                              ACTION MENU
                          ===================================== */}

                          {openMenuId === rowId && (

                            <div className="absolute right-10 top-1/2 z-30 w-36 -translate-y-1/2 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">

                              <button
                                type="button"
                                onClick={() =>
                                  openPopup(item)
                                }
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                View Result
                              </button>

                            </div>

                          )}

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ======================================================
            PAGINATION
        ======================================================= */}

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">

          <p className="font-medium text-gray-600">

            Showing{" "}

            {showingStart}
            -
            {showingEnd}

            {" "}of{" "}

            {results.length}

          </p>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      page - 1,
                      1
                    )
                )
              }
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <ChevronLeft size={16} />

              Prev

            </button>

            <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700">
              {currentPage}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                )
              }
              disabled={
                currentPage >= totalPages
              }
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >

              Next

              <ChevronRight
                size={16}
              />

            </button>

          </div>

        </div>

      </section>

      {/* ========================================================
          VIEW RESULT MODAL
      ========================================================= */}

      {selectedResult && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closePopup}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Assessment Result
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Final result details
                </p>

              </div>

              <button
                type="button"
                onClick={closePopup}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >

                <X size={18} />

              </button>

            </div>

            {/* ================================================
                  MODAL CONTENT
            ================================================= */}

            <div className="space-y-6 px-6 py-6">

              {/* ==================================================
                  TRAINEE NAME
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Trainee Name
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedResult?.traineeName ||
                    selectedResult?.trainee_name ||
                    "-"}
                </p>
              </div>


              {/* ==================================================
                    TRAINEE ID
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Trainee ID
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedResult?.traineeId ||
                    selectedResult?.trainee_id ||
                    "-"}
                </p>
              </div>


              {/* ==================================================
                    WRITTEN SCORE
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Written Score
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedResult?.writtenScore !== null &&
                    selectedResult?.writtenScore !== undefined
                    ? selectedResult.writtenScore
                    : "-"}
                </p>
              </div>


              {/* ==================================================
                  AI EVALUATION SUMMARY
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  AI Evaluation Summary
                </p>

                {/* Empty AI Summary Container */}
                <div className="mt-2 min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 p-4">
                  {/* AI Evaluation Summary will be displayed here later */}
                </div>
              </div>


              {/* ==================================================
                    FINAL RESULT
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Final Result
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${getResultBadgeClass(
                      getResultLabel(selectedResult)
                    )}`}
                  >
                    {getResultLabel(selectedResult)}
                  </span>
                </div>
              </div>


              {/* ==================================================
                    DATE COMPLETED
              =================================================== */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Date Completed
                </p>

                <p className="mt-1 font-medium text-gray-700">
                  {formatDate(
                    selectedResult?.dateCompleted ||
                    selectedResult?.updated_at ||
                    selectedResult?.submitted_at ||
                    selectedResult?.created_at
                  )}
                </p>
              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}