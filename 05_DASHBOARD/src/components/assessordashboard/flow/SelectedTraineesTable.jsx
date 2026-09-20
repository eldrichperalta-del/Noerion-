import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AssessorStatusBadge from "../shared/AssessorStatusBadge";

const ROWS_PER_PAGE = 5;

const getDisplayStatus = (
  trainee,
  assessmentCategory
) => {
  const status = String(
    trainee.status || ""
  )
    .trim()
    .toLowerCase();

  // =========================================================
  // NO ASSESSMENT
  // =========================================================
  //
  // This MUST be checked first.
  //
  // A completed assessment batch does NOT mean every assigned
  // trainee completed the assessment.
  //
  // If there is no assessment_submissions record, the parent
  // TraineesProgress page sets the trainee status to:
  //
  //     "No Assessment"
  //
  // Keep that status even when the batch category is Completed.
  // =========================================================

  if (
    status === "no assessment" ||
    status === "no_assessment"
  ) {
    return "No Assessment";
  }


  // =========================================================
  // UPCOMING BATCH
  // =========================================================
  //
  // For an assessment that has not started yet, trainees should
  // appear as Not Started.
  // =========================================================

  if (
    assessmentCategory === "Upcoming"
  ) {
    return "Not Started";
  }


  // =========================================================
  // ACTUAL TRAINEE ASSESSMENT STATUS
  // =========================================================
  //
  // From this point onward, use the trainee's actual status.
  // Do NOT use assessmentCategory === "Completed" to overwrite it.
  // =========================================================

  if (
    status === "completed" ||
    status === "evaluated"
  ) {
    return "Completed";
  }


  if (
    status === "submitted"
  ) {
    return "Submitted";
  }


  if (
    status === "in progress" ||
    status === "in_progress"
  ) {
    return "In Progress";
  }


  if (
    status === "in evaluation" ||
    status === "in_evaluation"
  ) {
    return "In Evaluation";
  }


  // =========================================================
  // DEFAULT
  // =========================================================

  return "Not Started";
};

export default function SelectedTraineesTable({
  trainees = [],
  actionLabel,
  onAction,
  assessmentCategory = "Ongoing",
}) {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const showStatusFilter =
    assessmentCategory === "Ongoing";

  const statusOptions = [
    "All",
    "No Assessment",
    "Not Started",
    "In Progress",
    "Submitted",
  ];

  const showAction = Boolean(
    actionLabel && onAction
  );

  // =========================================================
  // FILTER TRAINEES
  // =========================================================

  const filteredTrainees = useMemo(() => {
    return trainees.filter((trainee) => {
      const fullName = String(
        trainee.fullName ??
        trainee.name ??
        trainee.fullname ??
        ""
      );

      const traineeId = String(
        trainee.traineeId ?? ""
      );

      const displayStatus =
        getDisplayStatus(
          trainee,
          assessmentCategory
        );

      const searchQuery =
        searchTerm.trim().toLowerCase();

      const matchesSearch =
        fullName
          .toLowerCase()
          .includes(searchQuery) ||
        traineeId
          .toLowerCase()
          .includes(searchQuery);

      const matchesStatus =
        !showStatusFilter ||
        statusFilter === "All" ||
        displayStatus.toLowerCase() ===
        statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    trainees,
    searchTerm,
    statusFilter,
    assessmentCategory,
    showStatusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(
    filteredTrainees.length /
    ROWS_PER_PAGE
  );

  const showPagination =
    filteredTrainees.length >
    ROWS_PER_PAGE;

  // Reset to page 1 whenever the filtered
  // results change.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    assessmentCategory,
  ]);

  // Prevent the current page from becoming
  // invalid after filtering.
  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedTrainees = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ROWS_PER_PAGE;

    const endIndex =
      startIndex + ROWS_PER_PAGE;

    return filteredTrainees.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredTrainees,
    currentPage,
  ]);

  // =========================================================
  // PAGINATION RANGE
  // =========================================================

  const startRow =
    filteredTrainees.length === 0
      ? 0
      : (currentPage - 1) *
      ROWS_PER_PAGE +
      1;

  const endRow = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredTrainees.length
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="-mt-1 space-y-4">

      {/* =====================================================
          SEARCH + STATUS FILTER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search by Trainee Name or ID..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {showStatusFilter && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Filter by Status:
            </span>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "All"
                      ? "All Statuses"
                      : status}
                  </option>
                )
              )}
            </select>
          </div>
        )}

      </div>


      {/* =====================================================
          TABLE HEADER
      ===================================================== */}

      <div
        className={`grid ${showAction
          ? "grid-cols-12"
          : "grid-cols-10"
          } items-center rounded-xl bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600`}
      >
        <div className="col-span-4">
          Trainee Name
        </div>

        <div className="col-span-3">
          Trainee ID
        </div>

        <div className="col-span-3">
          Assessment Status
        </div>

        {showAction && (
          <div className="col-span-2 text-right">
            Action
          </div>
        )}
      </div>


      {/* =====================================================
          TABLE ROWS
      ===================================================== */}

      <div className="space-y-4">

        {paginatedTrainees.map(
          (trainee) => {
            const fullName =
              trainee.fullName ??
              trainee.name ??
              trainee.fullname ??
              "Unnamed Trainee";

            const displayStatus =
              getDisplayStatus(
                trainee,
                assessmentCategory
              );

            return (
              <div
                key={
                  trainee.assignmentId ??
                  trainee.id
                }
                className={`grid ${showAction
                  ? "grid-cols-12"
                  : "grid-cols-10"
                  } items-center rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
              >

                <div className="col-span-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    {fullName}
                  </h3>
                </div>

                <div className="col-span-3">
                  <p className="text-sm text-gray-500">
                    {trainee.traineeId}
                  </p>
                </div>

                <div className="col-span-3">
                  <AssessorStatusBadge
                    status={displayStatus}
                  />
                </div>

                {showAction && (
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() =>
                        onAction(trainee)
                      }
                      className="rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#001f59] hover:shadow-lg active:scale-95"
                    >
                      {actionLabel}
                    </button>
                  </div>
                )}

              </div>
            );
          }
        )}

        {filteredTrainees.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500 shadow-sm">
            No trainees found for this batch.
          </div>
        )}

      </div>


      {/* =====================================================
          PAGINATION
          
          HIDDEN WHEN 5 OR FEWER ROWS EXIST
      ===================================================== */}

      {showPagination && (
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

          {/* -------------------------------------------------
              RESULT COUNT
          ------------------------------------------------- */}

          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {startRow}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {endRow}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {filteredTrainees.length}
            </span>{" "}
            trainees
          </p>


          {/* -------------------------------------------------
              PAGINATION CONTROLS
          ------------------------------------------------- */}

          <div className="flex items-center gap-2">

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
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft
                size={17}
              />
              Previous
            </button>


            {/* PAGE NUMBERS */}

            <div className="flex items-center gap-1">

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${currentPage === page
                    ? "bg-[#002f86] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  aria-current={
                    currentPage === page
                      ? "page"
                      : undefined
                  }
                >
                  {page}
                </button>
              ))}

            </div>


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
                currentPage ===
                totalPages
              }
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
              <ChevronRight
                size={17}
              />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}