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

  useEffect(() => {
    async function fetchAssignedBatches() {
      setLoading(true);

      try {
        // 1. Get current logged-in assessor
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const currentAssessorId = user?.id;

        // 2. Fetch assessment batches
        let query = supabase
          .from("assessment_batches")
          .select("*");

        if (currentAssessorId) {
          query = query.eq("assessor_id", currentAssessorId);
        }

        const {
          data: batchesData,
          error: batchesError,
        } = await query;

        // Fallback if assessor-specific query returns nothing
        let rawBatches = batchesData;

        if (
          batchesError ||
          !rawBatches ||
          rawBatches.length === 0
        ) {
          const { data: fallbackBatches } = await supabase
            .from("assessment_batches")
            .select("*");

          rawBatches = fallbackBatches || [];
        }

        // 3. Count trainees assigned to each batch
        const {
          data: assignmentsData,
        } = await supabase
          .from("assignments")
          .select("batch_id, trainee_id");

        const traineeCountsMap = {};

        if (assignmentsData) {
          assignmentsData.forEach((assignment) => {
            if (assignment.batch_id) {
              traineeCountsMap[assignment.batch_id] =
                (traineeCountsMap[assignment.batch_id] || 0) + 1;
            }
          });
        }

        // 4. Format assessment batches
        if (rawBatches && rawBatches.length > 0) {
          const formatted = rawBatches.map((batch) => {
            const rawDate =
              batch.assessment_date ||
              batch.created_at;

            const startTime = batch.start_time || null;
            const endTime = batch.end_time || null;

            /*
             * ---------------------------------------------------------------
             * Determine assessment status
             *
             * Upcoming  = Pending
             * Ongoing   = Ongoing
             * Completed = Completed
             * ---------------------------------------------------------------
             */

            let category = "Upcoming";
            let displayStatus = "Pending";

            if (rawDate) {
              const dateString = new Date(rawDate)
                .toISOString()
                .split("T")[0];

              let startDateTime;
              let endDateTime;

              if (startTime) {
                startDateTime = new Date(
                  `${dateString}T${startTime}`
                );
              } else {
                startDateTime = new Date(rawDate);
              }

              if (endTime) {
                endDateTime = new Date(
                  `${dateString}T${endTime}`
                );
              } else {
                // If there is no end time, use duration if available
                if (batch.duration) {
                  endDateTime = new Date(
                    startDateTime.getTime() +
                    Number(batch.duration) * 60 * 1000
                  );
                } else {
                  // Default to one hour
                  endDateTime = new Date(
                    startDateTime.getTime() +
                    60 * 60 * 1000
                  );
                }
              }

              const now = new Date();

              if (now < startDateTime) {
                category = "Upcoming";
                displayStatus = "Pending";
              } else if (
                now >= startDateTime &&
                now <= endDateTime
              ) {
                category = "Ongoing";
                displayStatus = "Ongoing";
              } else {
                category = "Completed";
                displayStatus = "Completed";
              }
            }

            // Format date
            const formattedDate = rawDate
              ? new Date(rawDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )
              : "N/A";

            // Format time
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

            // Generate batch code
            const batchCode =
              batch.batch_code ||
              batch.batch_id ||
              (batch.id
                ? `BATCH-${batch.id
                  .slice(0, 8)
                  .toUpperCase()}`
                : "N/A");

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

              category,

              status: displayStatus,
            };

            
          });

          setAssignedBatches(formatted);
        } else {
          setAssignedBatches([]);
        }
      } catch (error) {
        console.error(
          "Error loading assessment batches:",
          error
        );

        setAssignedBatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedBatches();
  }, []);

  /*
   * ==========================================================================
   * SEARCH + STATUS FILTER
   * ==========================================================================
   */

  const filteredAssessments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let result = assignedBatches;

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
    assignedBatches,
    searchTerm,
    statusFilter,
  ]);

  /*
   * ==========================================================================
   * VIEW TRAINEES
   * ==========================================================================
   */

  const handleViewTrainees = (batch) => {
    navigate("/assessor/assessment-panel/selected-trainees", {
      state: {
        selectedCourse: batch.name,
        batchId: batch.id,
        assessmentId: batch.assessmentId,
        batchCode: batch.code,
        assessmentCategory: batch.category,
      },
    });
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
 * FORMAT TIME
 * ============================================================================
 *
 * Converts:
 * 08:00:00 → 8:00 AM
 * 13:30:00 → 1:30 PM
 */

function formatTime(time) {
  if (!time) {
    return "N/A";
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}