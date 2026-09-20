import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient.js";

import CourseListTable from "../../components/assessordashboard/assessment-panel/CourseListTable.jsx";
import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader.jsx";

export default function AssessmentPanel() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
   * ==========================================================================
   * LIVE CURRENT TIME
   * ==========================================================================
   *
   * Updates every second so the assessment automatically moves:
   *
   * Upcoming → Ongoing → Completed
   *
   * without requiring a page refresh.
   */

  const [currentTime, setCurrentTime] = useState(
    () => new Date()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /*
   * ==========================================================================
   * FETCH ASSESSMENTS ASSIGNED TO CURRENT ASSESSOR
   * ==========================================================================
   */

  useEffect(() => {
    let isMounted = true;

    async function fetchAssignedBatches() {
      setLoading(true);

      try {
        // =====================================================================
        // 1. GET CURRENT LOGGED-IN ASSESSOR
        // =====================================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        const currentAssessorId = user?.id;

        if (!currentAssessorId) {
          if (isMounted) {
            setAssignedBatches([]);
          }

          return;
        }

        // =====================================================================
        // 2. FETCH ONLY THIS ASSESSOR'S ASSESSMENT BATCHES
        // =====================================================================

        const {
          data: batchesData,
          error: batchesError,
        } = await supabase
          .from("assessment_batches")
          .select("*")
          .eq("assessor_id", currentAssessorId);

        if (batchesError) {
          throw batchesError;
        }

        const rawBatches = batchesData || [];

        if (rawBatches.length === 0) {
          if (isMounted) {
            setAssignedBatches([]);
          }

          return;
        }

        // =====================================================================
        // 3. GET BATCH IDS BELONGING TO THIS ASSESSOR
        // =====================================================================

        const batchIds = rawBatches
          .map((batch) => batch.id)
          .filter(Boolean);

        // =====================================================================
        // 4. FETCH TRAINEE ASSIGNMENTS ONLY FOR THESE BATCHES
        // =====================================================================

        let assignmentsData = [];

        if (batchIds.length > 0) {
          const {
            data,
            error: assignmentsError,
          } = await supabase
            .from("assignments")
            .select("batch_id, trainee_id")
            .in("batch_id", batchIds);

          if (assignmentsError) {
            console.warn(
              "Unable to fetch trainee assignments:",
              assignmentsError
            );
          } else {
            assignmentsData = data || [];
          }
        }

        // =====================================================================
        // 5. COUNT TRAINEES PER BATCH
        // =====================================================================

        const traineeCountsMap = {};

        assignmentsData.forEach((assignment) => {
          if (assignment.batch_id) {
            traineeCountsMap[assignment.batch_id] =
              (traineeCountsMap[assignment.batch_id] || 0) + 1;
          }
        });

        // =====================================================================
        // 6. FORMAT ASSESSMENT BATCHES
        // =====================================================================

        const formatted = rawBatches.map((batch) => {
          /*
           * IMPORTANT:
           *
           * assessment_date in assessment_batches is a PostgreSQL DATE:
           *
           *     2026-09-21
           *
           * Therefore, DO NOT use:
           *
           *     new Date(assessment_date).toISOString()
           *
           * because that introduces unnecessary timezone conversion.
           */

          const rawDate =
            batch.assessment_date || null;

          const startTime =
            batch.start_time || null;

          const endTime =
            batch.end_time || null;

          const batchCode =
            batch.batch_code ||
            batch.batch_id ||
            (batch.id
              ? `BATCH-${batch.id
                  .slice(0, 8)
                  .toUpperCase()}`
              : "N/A");

          // ===================================================================
          // FORMAT DATE
          // ===================================================================

          const formattedDate = rawDate
            ? formatAssessmentDate(rawDate)
            : "N/A";

          // ===================================================================
          // FORMAT TIME
          // ===================================================================

          let formattedTime = "N/A";

          if (startTime && endTime) {
            formattedTime = `${formatTime(
              startTime
            )} - ${formatTime(endTime)}`;
          } else if (startTime) {
            formattedTime = formatTime(startTime);
          } else if (batch.duration) {
            formattedTime = `${batch.duration} Mins`;
          }

          return {
            id: batch.id,

            assessmentId:
              batch.assessment_id,

            name:
              batch.assessment_name ||
              "Untitled Assessment Batch",

            code: batchCode,

            trainees:
              traineeCountsMap[batch.id] ?? 0,

            date: formattedDate,

            time: formattedTime,

            /*
             * Keep the raw scheduling values.
             *
             * These are used by liveAssessments to calculate the current
             * status every second.
             */
            rawDate,

            startTime,

            endTime,

            duration:
              batch.duration ?? null,

            category: "Upcoming",

            status: "Pending",
          };
        });

        if (isMounted) {
          setAssignedBatches(formatted);
        }
      } catch (error) {
        console.error(
          "Error loading assessor assessment batches:",
          error
        );

        if (isMounted) {
          setAssignedBatches([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAssignedBatches();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * ==========================================================================
   * LIVE ASSESSMENT STATUS
   * ==========================================================================
   *
   * The database is NOT queried every second.
   *
   * currentTime changes every second, which causes this calculation to run
   * again and automatically move each assessment to the correct section.
   *
   * Rules:
   *
   * BEFORE START:
   *     Upcoming / Pending
   *
   * AT START UNTIL END:
   *     Ongoing / Ongoing
   *
   * AT OR AFTER END:
   *     Completed / Completed
   */

  const liveAssessments = useMemo(() => {
    return assignedBatches.map((assessment) => {
      const {
        rawDate,
        startTime,
        endTime,
        duration,
      } = assessment;

      let category = "Upcoming";
      let displayStatus = "Pending";

      if (rawDate) {
        /*
         * assessment_date is already:
         *
         * YYYY-MM-DD
         *
         * Example:
         *
         * 2026-09-21
         *
         * Do NOT convert this with new Date(rawDate).
         */

        const dateString = String(rawDate).slice(
          0,
          10
        );

        let startDateTime;
        let endDateTime;

        // =====================================================================
        // START DATETIME
        // =====================================================================

        startDateTime = createLocalDateTime(
          dateString,
          startTime || "00:00:00"
        );

        // =====================================================================
        // END DATETIME
        // =====================================================================

        if (endTime) {
          endDateTime = createLocalDateTime(
            dateString,
            endTime
          );
        } else if (duration) {
          /*
           * If there is no end_time, use duration.
           *
           * Example:
           * 4 minutes
           */

          const durationMinutes =
            parseDurationMinutes(duration);

          endDateTime = new Date(
            startDateTime.getTime() +
              durationMinutes * 60 * 1000
          );
        } else {
          /*
           * No end time and no duration:
           * default to one hour.
           */

          endDateTime = new Date(
            startDateTime.getTime() +
              60 * 60 * 1000
          );
        }

        // =====================================================================
        // DETERMINE LIVE STATUS
        // =====================================================================

        if (currentTime < startDateTime) {
          /*
           * The assessment has not started yet.
           */
          category = "Upcoming";
          displayStatus = "Pending";
        } else if (currentTime < endDateTime) {
          /*
           * The assessment is currently happening.
           */
          category = "Ongoing";
          displayStatus = "Ongoing";
        } else {
          /*
           * The assessment has ended.
           */
          category = "Completed";
          displayStatus = "Completed";
        }
      }

      return {
        ...assessment,
        category,
        status: displayStatus,
      };
    });
  }, [
    assignedBatches,
    currentTime,
  ]);

  /*
   * ==========================================================================
   * SEARCH + STATUS FILTER
   * ==========================================================================
   */

  const filteredAssessments = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    let result = liveAssessments;

    // Search
    if (query) {
      result = result.filter((assessment) =>
        `${assessment.name} ${assessment.code}`
          .toLowerCase()
          .includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(
        (assessment) =>
          assessment.category === statusFilter
      );
    }

    return {
      upcoming: result.filter(
        (assessment) =>
          assessment.category === "Upcoming"
      ),

      ongoing: result.filter(
        (assessment) =>
          assessment.category === "Ongoing"
      ),

      completed: result.filter(
        (assessment) =>
          assessment.category === "Completed"
      ),
    };
  }, [
    liveAssessments,
    searchTerm,
    statusFilter,
  ]);

  /*
   * ==========================================================================
   * VIEW TRAINEES
   * ==========================================================================
   */

  const handleViewTrainees = (batch) => {
    navigate(
      "/assessor/assessment-panel/selected-trainees",
      {
        state: {
          selectedCourse: batch.name,
          batchId: batch.id,
          assessmentId: batch.assessmentId,
          batchCode: batch.code,
          assessmentCategory: batch.category,
        },
      }
    );
  };

  /*
   * ==========================================================================
   * PAGE
   * ==========================================================================
   */

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

