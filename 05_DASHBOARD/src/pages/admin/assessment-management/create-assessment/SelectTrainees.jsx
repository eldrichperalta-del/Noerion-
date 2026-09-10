import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../../../supabaseClient.js";

const ITEMS_PER_PAGE = 5;

export default function SelectTrainees({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [traineeList, setTraineeList] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Retrieve previously selected trainees
  const initialSelected =
    assessmentData?.trainees ||
    assessmentData?.selectedTrainees ||
    [];

  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelected
      .map((t) => String(t.id || t.user_id))
      .filter(Boolean)
  );

  // ============================================================
  // FETCH TRAINEES
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchTrainees = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Fetch approved trainees
        const {
          data: approvedTrainees,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            role,
            first_name,
            last_name,
            is_approved,
            registration_status,
            trainee_profiles (
              nc_level,
              qualification_course,
              training_center
            )
          `)
          .eq("role", "trainee")
          .or(
            "is_approved.eq.true,registration_status.eq.Approved"
          );

        if (profilesError) {
          throw profilesError;
        }

        // 2. Fetch assignments for session checks
        const {
          data: activeAssignments,
          error: assignError,
        } = await supabase
          .from("assignments")
          .select("id, trainee_id, assessment_id, status, assessment_date, start_time, attempt_number");

        if (assignError) {
          throw assignError;
        }

        // 3. Fetch assessment submissions for evaluation checks
        const {
          data: submissionsData,
          error: subError,
        } = await supabase
          .from("assessment_submissions")
          .select("assignment_id, trainee_id, overall_result, status, created_at")
          .order("created_at", { ascending: true });

        if (subError) {
          console.warn("Could not fetch submissions history:", subError.message);
        }

        const now = new Date();

        if (isMounted && approvedTrainees) {
          const formatted = approvedTrainees.map((item) => {
            const traineeIdStr = String(item.id);

            const rawTraineeProf = Array.isArray(
              item.trainee_profiles
            )
              ? item.trainee_profiles[0]
              : item.trainee_profiles;

            const name = [
              item.first_name,
              item.last_name,
            ]
              .filter(Boolean)
              .join(" ");

            const qualification =
              rawTraineeProf?.nc_level ||
              rawTraineeProf?.qualification_course ||
              "NC II";

            // Match assignments and submissions by trainee_id
            const traineeAssignments = (activeAssignments || []).filter(
              (a) => String(a.trainee_id) === traineeIdStr
            );
            const traineeSubmissions = (submissionsData || []).filter(
              (s) => String(s.trainee_id) === traineeIdStr
            );

            // Total attempts
            const totalAttemptsCount = Math.max(
              traineeAssignments.length,
              traineeSubmissions.length
            );

            // Get latest assignment (e.g., id: 16 for Eldrich Tester, id: 4 for Testing Ground)
            const latestAssignment = traineeAssignments.slice(-1)[0];

            // Match submission STRICTLY by matching assignment_id (e.g., assignment_id === 16)
            const currentSubmission = traineeSubmissions.find(
              (s) => String(s.assignment_id) === String(latestAssignment?.id)
            );

            let displayStatus = "Active";
            let isClickable = true;

            const assignStatus = (latestAssignment?.status || "").toLowerCase().trim();
            const subStatus = (currentSubmission?.status || "").toLowerCase().trim();
            const overallResult = (currentSubmission?.overall_result || "").toLowerCase().trim();

            if (latestAssignment) {
              // CASE 1: Assignment is Completed or Submission is Submitted -> Waiting for Assessor
              if (
                assignStatus === "completed" ||
                subStatus === "submitted" ||
                overallResult.includes("eval")
              ) {
                // Unless the assessor has fully finished evaluating it
                if (subStatus === "evaluated" && overallResult !== "in evaluation") {
                  displayStatus = "Active";
                  isClickable = true;
                } else {
                  displayStatus = "In Evaluation";
                  isClickable = false;
                }
              }
              // CASE 2: Assignment is Pending / Scheduled / In Progress and NOT submitted yet
              else if (
                ["pending", "scheduled", "assigned", "in progress"].includes(assignStatus)
              ) {
                let scheduledDateTime = null;
                if (latestAssignment.assessment_date && latestAssignment.start_time) {
                  const dateOnly = String(latestAssignment.assessment_date).split("T")[0];
                  scheduledDateTime = new Date(`${dateOnly} ${latestAssignment.start_time}`);
                }

                if (assignStatus === "scheduled" && scheduledDateTime && now < scheduledDateTime) {
                  displayStatus = "Scheduled";
                } else {
                  displayStatus = "In Another Session";
                }

                isClickable = false;
              }
              // CASE 3: Closed or Evaluated assignment
              else {
                displayStatus = "Active";
                isClickable = true;
              }
            } else {
              displayStatus = "Active";
              isClickable = true;
            }

            return {
              id: traineeIdStr,
              fullName:
                name.trim() ||
                item.email ||
                "Unnamed Trainee",
              email:
                item.email ||
                "No Email",
              qualification,
              assessmentStatus: displayStatus,
              isClickable,
              attemptCount: totalAttemptsCount,
              raw: item,
            };
          });

          setTraineeList(formatted);
        }
      } catch (err) {
        console.error(
          "Supabase trainees fetch error:",
          err.message
        );

        if (isMounted) {
          setErrorMsg(
            "Failed to load trainees from DB: " +
            err.message
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTrainees();

    return () => {
      isMounted = false;
    };
  }, [assessmentData]);

  // ============================================================
  // FILTER TRAINEES
  // ============================================================

  const filteredTrainees = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return traineeList.filter((trainee) => {
      const searchTarget = `
        ${trainee.fullName}
        ${trainee.id}
        ${trainee.email}
      `.toLowerCase();

      const matchesSearch =
        searchTarget.includes(normalizedSearch);

      const matchesQualification =
        qualificationFilter === "All" ||
        trainee.qualification.toLowerCase() ===
        qualificationFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesQualification
      );
    });
  }, [
    traineeList,
    search,
    qualificationFilter,
  ]);

  // ============================================================
  // SELECTABLE TRAINEES
  // ============================================================

  const selectableTrainees = useMemo(() => {
    return filteredTrainees.filter(
      (trainee) => trainee.isClickable
    );
  }, [filteredTrainees]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = Math.ceil(
    filteredTrainees.length /
    ITEMS_PER_PAGE
  );

  const paginatedTrainees = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    const endIndex =
      startIndex + ITEMS_PER_PAGE;

    return filteredTrainees.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredTrainees,
    currentPage,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    qualificationFilter,
  ]);

  // Make sure current page is still valid
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

  // ============================================================
  // SELECT ALL
  // ============================================================

  const allSelected =
    selectableTrainees.length > 0 &&
    selectableTrainees.every((trainee) =>
      selectedIds.includes(
        String(trainee.id)
      )
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      const selectableIds = new Set(
        selectableTrainees.map((trainee) =>
          String(trainee.id)
        )
      );

      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !selectableIds.has(id)
        )
      );
    } else {
      const newIds =
        selectableTrainees.map(
          (trainee) =>
            String(trainee.id)
        );

      setSelectedIds((previous) =>
        Array.from(
          new Set([
            ...previous,
            ...newIds,
          ])
        )
      );
    }
  };

  // ============================================================
  // SELECT ONE TRAINEE
  // ============================================================

  const toggleSelectOne = (id) => {
    const targetTrainee =
      traineeList.find(
        (trainee) =>
          String(trainee.id) ===
          String(id)
      );

    // Block unselectable trainees
    if (
      !targetTrainee ||
      !targetTrainee.isClickable
    ) {
      return;
    }

    const stringId = String(id);

    setSelectedIds((previous) =>
      previous.includes(stringId)
        ? previous.filter(
          (item) =>
            item !== stringId
        )
        : [
          ...previous,
          stringId,
        ]
    );
  };

  // ============================================================
  // NEXT
  // ============================================================

  const handleContinue = () => {
    const selectedObjects =
      traineeList.filter((trainee) =>
        selectedIds.includes(
          String(trainee.id)
        )
      );

    setAssessmentData((previous) => ({
      ...previous,
      trainees: selectedObjects,
      selectedTrainees:
        selectedObjects,
    }));

    onNext();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="-mt-4 rounded-2xl bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

      {/* TITLE */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Step 2: Select Trainees
      </h2>

      {/* SEARCH + FILTER */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">

        {/* Search */}
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
            placeholder="Search trainee name or email"
            className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
          />
        </label>

        {/* Qualification */}
        <select
          value={qualificationFilter}
          onChange={(event) =>
            setQualificationFilter(
              event.target.value
            )
          }
          className="rounded-xl border border-gray-400 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
        >
          <option value="All">
            All Qualifications
          </option>

          <option value="NC II">
            NC II
          </option>

          <option value="IT 2">
            IT 2
          </option>
        </select>

      </div>

      {/* ERROR */}
      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border-2 border-gray-100">

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading trainees from database...
          </div>
        ) : (
          <table className="w-full text-left">

            {/* TABLE HEADER */}
            <thead className="bg-gray-200 text-sm text-gray-700">

              <tr>

                <th className="w-14 px-4 py-4 text-center">

                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={
                      selectableTrainees.length ===
                      0
                    }
                    onChange={
                      toggleSelectAll
                    }
                    className="h-5 w-5 cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </th>

                <th className="px-4 py-4">
                  Trainee Name
                </th>

                <th className="px-4 py-4">
                  Email
                </th>

                <th className="px-4 py-4">
                  Qualification
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

                <th className="px-4 py-4 text-center">
                  Attempt
                </th>

              </tr>

            </thead>

            {/* TABLE BODY */}
            <tbody className="text-sm">

              {paginatedTrainees.map(
                (trainee) => {

                  const isChecked =
                    selectedIds.includes(
                      String(
                        trainee.id
                      )
                    );

                  const isSelectable = trainee.isClickable;

                  return (
                    <tr
                      key={trainee.id}
                      onClick={() =>
                        toggleSelectOne(
                          trainee.id
                        )
                      }
                      className={`border-b border-gray-200 transition-colors ${isSelectable
                        ? "cursor-pointer hover:bg-gray-100"
                        : "cursor-not-allowed bg-gray-50 opacity-70"
                        }`}
                    >

                      {/* CHECKBOX */}
                      <td className="px-4 py-3 text-center">

                        <input
                          type="checkbox"
                          checked={
                            isChecked
                          }
                          disabled={
                            !isSelectable
                          }
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          onChange={() =>
                            toggleSelectOne(
                              trainee.id
                            )
                          }
                          className="h-5 w-5 cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
                        />

                      </td>

                      {/* NAME */}
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {trainee.fullName}
                      </td>

                      {/* EMAIL */}
                      <td className="px-4 py-3 text-gray-700">
                        {trainee.email}
                      </td>

                      {/* QUALIFICATION */}
                      <td className="px-4 py-3 text-gray-700">
                        {trainee.qualification}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">

                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            trainee.assessmentStatus === "Active"
                              ? "bg-green-100 text-green-700"
                              : trainee.assessmentStatus === "In Evaluation"
                              ? "bg-blue-100 text-blue-700"
                              : trainee.assessmentStatus === "In Another Session"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {
                            trainee.assessmentStatus
                          }
                        </span>

                      </td>

                      {/* ATTEMPT */}
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">
                        {trainee.attemptCount > 0 ? `${trainee.attemptCount} Attempt` : "-"}
                      </td>

                    </tr>
                  );
                }
              )}

              {/* NO RESULTS */}
              {filteredTrainees.length ===
                0 &&
                !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-gray-500"
                    >
                      No approved trainees found in database.
                    </td>
                  </tr>
                )}

            </tbody>

          </table>
        )}

      </div>

      {/* Footer / Pagination / Action Controls */}
      <div className="mt-4 flex items-start justify-between px-2 py-2 text-sm">
        {/* LEFT: Selected trainees */}
        <p className="pt-2 font-medium text-gray-700">
          Selected trainees:{" "}
          <span className="font-bold text-[#001F5B]">
            {selectedIds.length}
          </span>
        </p>

        {/* RIGHT: Pagination + Back/Next */}
        <div className="flex flex-col items-end gap-4">
          {/* Pagination */}
          {filteredTrainees.length >= ITEMS_PER_PAGE && (
            <div className="flex items-center gap-3 text-gray-600">
              <span>
                Showing{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredTrainees.length
                )}{" "}
                of {filteredTrainees.length} trainees
              </span>

              {/* Previous */}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>

              {/* Page Numbers */}
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md border px-3 py-1 font-medium ${currentPage === page
                      ? "border-gray-300 bg-gray-100"
                      : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Page */}
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>
            </div>
          )}

          {/* Back / Next */}
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
              disabled={selectedIds.length === 0}
              onClick={handleContinue}
              className={`rounded-lg px-6 py-3 font-semibold text-white transition ${selectedIds.length > 0
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
  );
}