import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient.js";

import CourseListTable from "../../components/assessordashboard/assessment-panel/CourseListTable.jsx";
import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader.jsx";

export default function AssessmentPanel() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  // Each row represents one trainee's assignment, not the whole batch.
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAssignedBatches() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user?.id) {
          if (isMounted) setAssignedBatches([]);
          return;
        }

        const { data: batchesData, error: batchesError } = await supabase
          .from("assessment_batches")
          .select("*")
          .eq("assessor_id", user.id);

        if (batchesError) throw batchesError;

        const rawBatches = batchesData || [];
        if (rawBatches.length === 0) {
          if (isMounted) setAssignedBatches([]);
          return;
        }

        const batchIds = rawBatches.map((batch) => batch.id).filter(Boolean);
        const { data: assignmentsData, error: assignmentsError } =
          await supabase
            .from("assignments")
            .select("id, batch_id, trainee_id")
            .in("batch_id", batchIds);

        if (assignmentsError) throw assignmentsError;

        const assignments = assignmentsData || [];
        const assignmentsByBatch = {};
        assignments.forEach((assignment) => {
          if (!assignmentsByBatch[assignment.batch_id]) {
            assignmentsByBatch[assignment.batch_id] = [];
          }
          assignmentsByBatch[assignment.batch_id].push(assignment);
        });

        const assignmentIds = assignments.map((assignment) => assignment.id).filter(Boolean);
        let submittedIds = new Set();

        if (assignmentIds.length > 0) {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from("assessment_submissions")
            .select("assignment_id, status, submitted_at")
            .in("assignment_id", assignmentIds);

          if (submissionsError) {
            console.warn("Unable to fetch assessment submissions:", submissionsError);
          } else {
            submittedIds = getSubmittedAssignmentIds(submissionsData || []);
          }
        }

        const formattedRows = rawBatches.flatMap((batch) => {
          const batchAssignments = assignmentsByBatch[batch.id] || [];
          const batchCode =
            batch.batch_code ||
            batch.batch_id ||
            (batch.id ? `BATCH-${batch.id.slice(0, 8).toUpperCase()}` : "N/A");

          const rawDate = batch.assessment_date || null;
          const startTime = batch.start_time || null;
          const endTime = batch.end_time || null;
          let formattedTime = "N/A";

          if (startTime && endTime) {
            formattedTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
          } else if (startTime) {
            formattedTime = formatTime(startTime);
          } else if (batch.duration) {
            formattedTime = `${batch.duration} Mins`;
          }

          const common = {
            batchId: batch.id,
            assessmentId: batch.assessment_id,
            name: batch.assessment_name || "Untitled Assessment Batch",
            code: batchCode,
            date: rawDate ? formatAssessmentDate(rawDate) : "N/A",
            time: formattedTime,
            rawDate,
            startTime,
            endTime,
            duration: batch.duration ?? null,
          };

          // Keep a separate row for each assigned trainee so submitted and
          // unfinished trainees from the same batch can appear in different sections.
          if (batchAssignments.length > 0) {
            return batchAssignments.map((assignment) => ({
              ...common,
              id: `${batch.id}-${assignment.id}`,
              assignmentId: assignment.id,
              traineeId: assignment.trainee_id,
              trainees: 1,
              isSubmitted: submittedIds.has(assignment.id),
              category: "Upcoming",
              status: "Pending",
            }));
          }

          // Preserve visibility for a batch with no linked assignments.
          return [{
            ...common,
            id: batch.id,
            assignmentId: null,
            traineeId: null,
            traineeLabel: "No trainees assigned",
            trainees: 0,
            isSubmitted: false,
            category: "Upcoming",
            status: "Pending",
          }];
        });

        if (isMounted) setAssignedBatches(formattedRows);
      } catch (error) {
        console.error("Error loading assessor assessment batches:", error);
        if (isMounted) setAssignedBatches([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAssignedBatches();
    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Refresh each trainee's submission state every five seconds. The status
   * is per assignment, so a submitted trainee can be Completed while other
   * trainees assigned to the same batch remain Ongoing.
   */
  const assignmentIdsKey = assignedBatches
    .map((row) => row.assignmentId)
    .filter(Boolean)
    .join("|");

  useEffect(() => {
    const assignmentIds = [...new Set(
      assignedBatches.map((row) => row.assignmentId).filter(Boolean)
    )];
    if (assignmentIds.length === 0) return undefined;

    let isMounted = true;

    const refreshSubmissionStatus = async () => {
      const { data, error } = await supabase
        .from("assessment_submissions")
        .select("assignment_id, status, submitted_at")
        .in("assignment_id", assignmentIds);

      if (error) {
        console.warn("Unable to refresh assessment submissions:", error);
        return;
      }

      const submittedIds = getSubmittedAssignmentIds(data || []);
      if (isMounted) {
        setAssignedBatches((previous) =>
          previous.map((row) => row.assignmentId
            ? { ...row, isSubmitted: submittedIds.has(row.assignmentId) }
            : row
          )
        );
      }
    };

    refreshSubmissionStatus();
    const intervalId = setInterval(refreshSubmissionStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [assignmentIdsKey]);

  const liveAssessments = useMemo(() => {
    return assignedBatches.map((assessment) => {
      // Submission always wins over the schedule: a trainee who has submitted
      // is Completed immediately, even if the scheduled end time is later.
      if (assessment.assignmentId && assessment.isSubmitted) {
        return { ...assessment, category: "Completed", status: "Completed" };
      }

      let category = "Upcoming";
      let displayStatus = "Pending";

      if (assessment.rawDate) {
        const dateString = String(assessment.rawDate).slice(0, 10);
        const startDateTime = createLocalDateTime(
          dateString,
          assessment.startTime || "00:00:00"
        );

        if (currentTime < startDateTime) {
          category = "Upcoming";
          displayStatus = "Pending";
        } else {
          // Do not mark a trainee Completed merely because the end time passed.
          // Only a real submission can complete that trainee's row.
          category = "Ongoing";
          displayStatus = "Ongoing";
        }
      }

      return { ...assessment, category, status: displayStatus };
    });
  }, [assignedBatches, currentTime]);

  const filteredAssessments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let result = liveAssessments;

    if (query) {
      result = result.filter((assessment) =>
        `${assessment.name} ${assessment.code} ${assessment.traineeLabel || ""}`
          .toLowerCase()
          .includes(query)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((assessment) => assessment.category === statusFilter);
    }

    return {
      upcoming: result.filter((assessment) => assessment.category === "Upcoming"),
      ongoing: result.filter((assessment) => assessment.category === "Ongoing"),
      completed: result.filter((assessment) => assessment.category === "Completed"),
    };
  }, [liveAssessments, searchTerm, statusFilter]);

  const handleViewTrainees = (row) => {
    navigate("/assessor/assessment-panel/selected-trainees", {
      state: {
        selectedCourse: row.name,
        batchId: row.batchId || row.id,
        assessmentId: row.assessmentId,
        batchCode: row.code,
        assessmentCategory: row.category,
        traineeId: row.traineeId || null,
        assignmentId: row.assignmentId || null,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assessment Management"
        subtitle="Manage and monitor your assigned assessments"
      />

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center font-medium text-gray-500 shadow-sm">
          Fetching assigned assessments...
        </div>
      ) : (
        <CourseListTable
          assessments={filteredAssessments}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onViewTrainees={handleViewTrainees}
        />
      )}
    </div>
  );
}

function getSubmittedAssignmentIds(submissions) {
  return new Set(
    submissions
      .filter((submission) => {
        const status = String(submission.status || "").toLowerCase();
        return Boolean(submission.submitted_at) ||
          ["submitted", "completed", "finished"].includes(status);
      })
      .map((submission) => submission.assignment_id)
      .filter(Boolean)
  );
}

/*
 * ============================================================================
 * CREATE LOCAL DATE/TIME
 * ============================================================================
 *
 * IMPORTANT:
 *
 * assessment_date:
 *     2026-09-21
 *
 * start_time:
 *     01:31 AM
 *
 * becomes:
 *
 *     September 21, 2026 at 1:31 AM
 *
 * using the browser's local timezone.
 */

function createLocalDateTime(
  dateString,
  time
) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  const normalizedTime =
    normalizeTime(time);

  const [hours, minutes, seconds] =
    normalizedTime.split(":").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hours || 0,
    minutes || 0,
    seconds || 0,
    0
  );
}

/*
 * ============================================================================
 * NORMALIZE TIME
 * ============================================================================
 *
 * Supports both:
 *
 * 01:31 AM
 * 01:31:00 AM
 * 13:31
 * 13:31:00
 */

function normalizeTime(time) {
  if (!time) {
    return "00:00:00";
  }

  const value = String(time)
    .trim()
    .toUpperCase();

  // ========================================================================
  // 12-HOUR FORMAT
  // ========================================================================

  const twelveHourMatch = value.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/
  );

  if (twelveHourMatch) {
    let hours = Number(
      twelveHourMatch[1]
    );

    const minutes = Number(
      twelveHourMatch[2]
    );

    const seconds = Number(
      twelveHourMatch[3] || 0
    );

    const period = twelveHourMatch[4];

    if (period === "AM") {
      if (hours === 12) {
        hours = 0;
      }
    } else if (period === "PM") {
      if (hours !== 12) {
        hours += 12;
      }
    }

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  // ========================================================================
  // 24-HOUR FORMAT
  // ========================================================================

  const twentyFourHourMatch =
    value.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

  if (twentyFourHourMatch) {
    const hours = Number(
      twentyFourHourMatch[1]
    );

    const minutes = Number(
      twentyFourHourMatch[2]
    );

    const seconds = Number(
      twentyFourHourMatch[3] || 0
    );

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  /*
   * Fallback.
   */
  return "00:00:00";
}

/*
 * ============================================================================
 * PARSE DURATION
 * ============================================================================
 *
 * Examples:
 *
 * "4 minutes" → 4
 * "22 hours 59 minutes" → 1379
 * 4 → 4
 */

function parseDurationMinutes(duration) {
  if (
    duration === null ||
    duration === undefined ||
    duration === ""
  ) {
    return 60;
  }

  if (typeof duration === "number") {
    return duration;
  }

  const value = String(duration)
    .trim()
    .toLowerCase();

  let totalMinutes = 0;

  const hoursMatch = value.match(
    /(\d+(?:\.\d+)?)\s*hour/
  );

  const minutesMatch = value.match(
    /(\d+(?:\.\d+)?)\s*minute/
  );

  if (hoursMatch) {
    totalMinutes +=
      Number(hoursMatch[1]) * 60;
  }

  if (minutesMatch) {
    totalMinutes += Number(
      minutesMatch[1]
    );
  }

  /*
   * If the value is simply a number string,
   * treat it as minutes.
   */
  if (
    totalMinutes === 0 &&
    /^\d+(?:\.\d+)?$/.test(value)
  ) {
    totalMinutes = Number(value);
  }

  return totalMinutes > 0
    ? totalMinutes
    : 60;
}

/*
 * ============================================================================
 * FORMAT DATE
 * ============================================================================
 */

function formatAssessmentDate(rawDate) {
  if (!rawDate) {
    return "N/A";
  }

  /*
   * assessment_date is PostgreSQL DATE:
   *
   * YYYY-MM-DD
   *
   * Extract it directly rather than using new Date().
   */

  const dateString = String(rawDate).slice(
    0,
    10
  );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return "N/A";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

/*
 * ============================================================================
 * FORMAT TIME
 * ============================================================================
 *
 * Converts:
 *
 * 08:00:00 → 8:00 AM
 * 13:30:00 → 1:30 PM
 * 01:31 AM → 1:31 AM
 */

function formatTime(time) {
  if (!time) {
    return "N/A";
  }

  const normalizedTime =
    normalizeTime(time);

  const [hours, minutes] =
    normalizedTime
      .split(":")
      .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

