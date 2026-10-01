import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../../../supabaseClient.js";

const ITEMS_PER_PAGE = 5;

export default function AssignAssessor({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Available");

  const [loading, setLoading] = useState(true);
  const [assessors, setAssessors] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================================
  // RETRIEVE PREVIOUSLY SELECTED ASSESSOR
  // ============================================================

  const initialSelected =
    assessmentData?.selectedAssessor ||
    assessmentData?.assessor ||
    null;

  const [selectedId, setSelectedId] = useState(
    initialSelected?.id
      ? String(initialSelected.id)
      : null
  );

  // ============================================================
  // FETCH ASSESSORS
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchAssessors = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // ======================================================
        // 1. FETCH APPROVED ASSESSORS
        //
        // IMPORTANT:
        // Assessor ID comes ONLY from assessor_profiles.
        // ======================================================

        const {
          data: approvedAssessors,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            role,
            first_name,
            last_name,
            contact_number,
            profile_photo_url,
            registration_status,
            assessor_profiles (
              user_id,
              assessor_id_number,
              qualification_specialization,
              assessment_center,
              years_of_experience,
              accreditation_cert_url,
              government_id_url
            )
          `)
          .eq("role", "assessor")
          .eq("registration_status", "Approved");

        if (profilesError) {
          throw profilesError;
        }

        // ======================================================
        // 2. FETCH ASSIGNMENTS
        // ======================================================

        const {
          data: assignmentsData,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(`
            id,
            assessor_id,
            status
          `);

        if (assignmentsError) {
          throw assignmentsError;
        }

        // ======================================================
        // 3. FETCH SUBMISSIONS
        // ======================================================

        const {
          data: submissionsData,
          error: submissionsError,
        } = await supabase
          .from("assessment_submissions")
          .select(`
            assignment_id,
            assessor_id,
            status,
            overall_result
          `);

        if (submissionsError) {
          console.warn(
            "Could not fetch submissions:",
            submissionsError.message
          );
        }

        // ======================================================
        // 4. DETERMINE BUSY ASSESSORS
        // ======================================================

        const assignmentSubmissionMap = new Map();

        const pendingAssessorIds = new Set();

        (submissionsData || []).forEach((submission) => {
          const submissionStatus = String(
            submission.status || ""
          )
            .toLowerCase()
            .trim();

          const overallResult = String(
            submission.overall_result || ""
          )
            .toLowerCase()
            .trim();

          if (submission.assignment_id) {
            assignmentSubmissionMap.set(
              String(submission.assignment_id),
              {
                status: submissionStatus,
                result: overallResult,
              }
            );
          }

          const isEvaluated =
            submissionStatus === "evaluated" ||
            overallResult === "competent" ||
            overallResult === "not yet competent";

          if (
            submission.assessor_id &&
            !isEvaluated
          ) {
            pendingAssessorIds.add(
              String(submission.assessor_id)
            );
          }
        });

        const busyAssessorIds = new Set(
          pendingAssessorIds
        );

        // ======================================================
        // 5. CHECK ACTIVE ASSIGNMENTS
        // ======================================================

        (assignmentsData || []).forEach((assignment) => {
          if (!assignment.assessor_id) {
            return;
          }

          const assessorId = String(
            assignment.assessor_id
          );

          const assignmentStatus = String(
            assignment.status || ""
          )
            .toLowerCase()
            .trim();

          const submissionInfo =
            assignmentSubmissionMap.get(
              String(assignment.id)
            );

          let isEvaluated = false;

          if (submissionInfo) {
            isEvaluated =
              submissionInfo.status === "evaluated" ||
              submissionInfo.result === "competent" ||
              submissionInfo.result ===
              "not yet competent";
          }

          const isCompleted =
            assignmentStatus === "completed";

          if (!isEvaluated && !isCompleted) {
            busyAssessorIds.add(assessorId);
          }
        });

        // ======================================================
        // 6. FORMAT ASSESSORS
        // ======================================================

        if (isMounted && approvedAssessors) {
          const formattedAssessors =
            approvedAssessors.map((item) => {
              const assessorProfile =
                Array.isArray(item.assessor_profiles)
                  ? item.assessor_profiles[0]
                  : item.assessor_profiles;

              const fullName = [
                item.first_name,
                item.last_name,
              ]
                .filter(Boolean)
                .join(" ")
                .trim();

              // =================================================
              // ASSESSOR ID
              //
              // Match AssessorManagement / AssessorTable format.
              // =================================================

              const formattedAssessorId = `ASR-${String(item.id).slice(0, 7).toUpperCase()}`;

              // =================================================
              // AVAILABILITY
              // =================================================

              const assessorUserId = String(item.id);

              const isBusy =
                busyAssessorIds.has(assessorUserId);

              return {
                id: assessorUserId,

                fullName:
                  fullName ||
                  item.email ||
                  "Unnamed Assessor",

                email:
                  item.email ||
                  "No Email",

                contactNumber:
                  item.contact_number ||
                  "N/A",

                photoUrl:
                  item.profile_photo_url ||
                  null,

                assessorId:
                  formattedAssessorId,

                specialization:
                  assessorProfile?.qualification_specialization ||
                  "General",

                assessmentCenter:
                  assessorProfile?.assessment_center ||
                  "N/A",

                yearsExperience:
                  assessorProfile?.years_of_experience ??
                  0,

                status:
                  isBusy
                    ? "Unavailable"
                    : "Available",

                raw:
                  item,

                assessorProfile:
                  assessorProfile || null,
              };
            });

          setAssessors(formattedAssessors);
        }
      } catch (error) {
        console.error(
          "Supabase assessors fetch error:",
          error.message
        );

        if (isMounted) {
          setErrorMsg(
            "Failed to load assessors from DB: " +
            error.message
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAssessors();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // FILTER ASSESSORS
  // ============================================================

  const filteredAssessors = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return assessors.filter((assessor) => {
      const searchTarget = `
        ${assessor.fullName}
        ${assessor.assessorId}
        ${assessor.email}
        ${assessor.specialization}
      `.toLowerCase();

      const matchesSearch =
        searchTarget.includes(
          normalizedSearch
        );

      const matchesStatus =
        statusFilter === "All" ||
        assessor.status.toLowerCase() ===
        statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    assessors,
    search,
    statusFilter,
  ]);

  // ============================================================
  // RESET PAGINATION WHEN FILTERS CHANGE
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalItems =
    filteredAssessors.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems /
      ITEMS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    ITEMS_PER_PAGE;

  const endIndex = Math.min(
    startIndex +
    ITEMS_PER_PAGE,
    totalItems
  );

  const paginatedAssessors =
    filteredAssessors.slice(
      startIndex,
      endIndex
    );

  const showingStart =
    totalItems > 0
      ? startIndex + 1
      : 0;

  const showingEnd =
    totalItems > 0
      ? endIndex
      : 0;

  // ============================================================
  // PAGINATION HANDLERS
  // ============================================================

  const goToPreviousPage = () => {
    setCurrentPage((previous) =>
      Math.max(
        previous - 1,
        1
      )
    );
  };

  const goToNextPage = () => {
    setCurrentPage((previous) =>
      Math.min(
        previous + 1,
        totalPages
      )
    );
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // ============================================================
  // SELECT ASSESSOR
  // ============================================================

  const selectAssessor = (assessor) => {
    if (
      assessor.status !==
      "Available"
    ) {
      return;
    }

    setSelectedId(
      String(assessor.id)
    );

    setAssessmentData((previous) => ({
      ...previous,

      // Keep both keys for compatibility
      // with the existing assessment flow.
      selectedAssessor:
        assessor,

      assessor:
        assessor,
    }));
  };

  // ============================================================
  // SELECTED ASSESSOR
  // ============================================================

  const selectedAssessor =
    assessors.find(
      (assessor) =>
        String(assessor.id) ===
        String(selectedId)
    ) || null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="-mt-4 grid min-h-[75vh] grid-cols-12 gap-6">

      {/* =====================================================
          LEFT MAIN PANEL
      ===================================================== */}

      <div className="col-span-12 flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)] lg:col-span-9">

        <div>

          {/* TITLE */}

          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Choose one assessor for this assessment session
          </h2>

          {/* =================================================
              SEARCH + STATUS FILTER
          ================================================= */}

          <div className="mb-4 flex flex-col gap-3 md:flex-row">

            {/* SEARCH */}

            <label className="relative flex-1">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search assessor name, specialization, or ID"
                className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
              />

            </label>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-gray-400 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
            >
              <option value="Available">
                Available
              </option>

              <option value="Unavailable">
                Unavailable
              </option>

              <option value="All">
                All Status
              </option>
            </select>

          </div>

          {/* ERROR */}

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-xl border-2 border-gray-100">

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading assessors from database...
              </div>
            ) : (
              <table className="w-full text-left">

                {/* HEADER */}

                <thead className="bg-gray-200 text-sm text-gray-700">

                  <tr>

                    <th className="w-14 px-4 py-4 text-center">
                      Select
                    </th>

                    <th className="px-4 py-4">
                      Assessor Name
                    </th>

                    <th className="px-4 py-4">
                      Assessor ID
                    </th>

                    <th className="px-4 py-4">
                      Qualification
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                {/* BODY */}

                <tbody className="text-sm">

                  {paginatedAssessors.map(
                    (assessor) => {

                      const isChecked =
                        String(
                          selectedId
                        ) ===
                        String(
                          assessor.id
                        );

                      const isAvailable =
                        assessor.status ===
                        "Available";

                      return (
                        <tr
                          key={
                            assessor.id
                          }
                          onClick={() =>
                            selectAssessor(
                              assessor
                            )
                          }
                          className={`border-b border-gray-200 transition-colors ${isAvailable
                            ? "cursor-pointer hover:bg-gray-100"
                            : "cursor-not-allowed bg-gray-50 opacity-70"
                            }`}
                        >

                          {/* SELECT */}

                          <td className="px-4 py-3 text-center">

                            <input
                              type="radio"
                              name="assessor"
                              checked={
                                isChecked
                              }
                              disabled={
                                !isAvailable
                              }
                              onChange={() =>
                                selectAssessor(
                                  assessor
                                )
                              }
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              className="h-5 w-5 cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
                            />

                          </td>

                          {/* NAME */}

                          <td className="px-4 py-3 font-medium text-gray-900">
                            {
                              assessor.fullName
                            }
                          </td>

                          {/* ASSESSOR ID */}

                          <td className="px-4 py-3 text-gray-700">
                            {
                              assessor.assessorId
                            }
                          </td>

                          {/* QUALIFICATION */}

                          <td className="px-4 py-3 text-gray-700">
                            {
                              assessor.specialization
                            }
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-3">

                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                                }`}
                            >
                              {
                                assessor.status
                              }
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                  {/* NO RESULTS */}

                  {paginatedAssessors.length ===
                    0 &&
                    !loading && (
                      <tr>

                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-500"
                        >
                          No assessors found.
                        </td>

                      </tr>
                    )}

                </tbody>

              </table>
            )}

          </div>

        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-4 flex items-start justify-between px-2 py-2 text-sm">

          {/* SELECTED COUNT */}

          <p className="font-medium text-gray-700">
            {selectedAssessor
              ? "Selected: 1 assessor"
              : "Select 1 assessor"}
          </p>

          {/* RIGHT */}

          <div className="flex flex-col items-end gap-4">

            {/* PAGINATION */}

            <div className="flex items-center gap-3 text-gray-600">

              <span>
                Showing{" "}
                {showingStart}-
                {showingEnd} of{" "}
                {totalItems} assessor
                {totalItems !== 1
                  ? "s"
                  : ""}
              </span>

              {/* PREVIOUS */}

              <button
                type="button"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  safeCurrentPage === 1
                }
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>

              {/* PAGE NUMBERS */}

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    goToPage(page)
                  }
                  className={`rounded-md border px-3 py-1 font-medium ${safeCurrentPage ===
                    page
                    ? "border-gray-300 bg-gray-100"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              ))}

              {/* NEXT */}

              <button
                type="button"
                onClick={
                  goToNextPage
                }
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>

            </div>

            {/* BACK / NEXT */}

            <div className="flex gap-3">

              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                disabled={
                  !selectedAssessor
                }
                onClick={onNext}
                className={`rounded-lg px-6 py-3 font-semibold text-white transition ${selectedAssessor
                  ? "bg-[#001F5B] hover:bg-[#001746]"
                  : "cursor-not-allowed bg-gray-300"
                  }`}
              >
                Next
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          RIGHT SIDEBAR
      ===================================================== */}

      <aside className="col-span-12 flex flex-col items-center rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)] lg:col-span-3">

        <h3 className="w-full border-b pb-3 text-center text-lg font-bold text-gray-900">
          Selected Assessor
        </h3>

        {selectedAssessor ? (
          <div className="mt-6 flex w-full flex-col items-center space-y-4 text-center">

            {/* PROFILE PHOTO */}

            {selectedAssessor.photoUrl ? (
              <img
                src={
                  selectedAssessor.photoUrl
                }
                alt={
                  selectedAssessor.fullName
                }
                className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#001F5B] text-2xl font-bold text-white shadow-md">
                {selectedAssessor.fullName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            {/* INFO */}

            <div className="space-y-1">

              <h4 className="text-lg font-bold text-gray-900">
                {
                  selectedAssessor.fullName
                }
              </h4>

              {/* ASSESSOR ID */}

              <p className="text-sm font-medium text-gray-600">
                ID:{" "}
                {
                  selectedAssessor.assessorId
                }
              </p>

              {/* QUALIFICATION */}

              <p className="text-sm text-gray-500">
                {
                  selectedAssessor.specialization
                }
              </p>

            </div>

            {/* STATUS */}

            <span
              className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${selectedAssessor.status ===
                "Available"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              {
                selectedAssessor.status
              }
            </span>

          </div>
        ) : (
          <div className="my-auto text-center text-sm text-gray-500">
            <p>
              Please choose an assessor from the table
              to view details.
            </p>
          </div>
        )}

      </aside>

    </div>
  );
}

