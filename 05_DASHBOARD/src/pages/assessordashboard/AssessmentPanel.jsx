import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient.js";

import CourseListTable from "../../components/assessordashboard/assessment-panel/CourseListTable.jsx";

import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader.jsx";

export default function AssessmentPanel() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedBatches() {
      setLoading(true);
      try {
        // 1. Get current logged-in assessor ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const currentAssessorId = user?.id;

        // 2. Fetch batches from `assessment_batches` table
        let query = supabase.from("assessment_batches").select("*");

        if (currentAssessorId) {
          query = query.eq("assessor_id", currentAssessorId);
        }

        const { data: batchesData, error: batchesError } = await query;

        // Fallback: If no batch matched assessor_id specifically, fetch all active batches
        let rawBatches = batchesData;
        if (batchesError || !rawBatches || rawBatches.length === 0) {
          const { data: fallbackBatches } = await supabase
            .from("assessment_batches")
            .select("*");
          rawBatches = fallbackBatches || [];
        }

        // 3. Count assigned trainees per batch from `assignments` table
        const { data: assignmentsData } = await supabase
          .from("assignments")
          .select("batch_id, trainee_id");

        const traineeCountsMap = {};
        if (assignmentsData) {
          assignmentsData.forEach((a) => {
            if (a.batch_id) {
              traineeCountsMap[a.batch_id] = (traineeCountsMap[a.batch_id] || 0) + 1;
            }
          });
        }

        // 4. Map columns directly to CourseListTable props
        if (rawBatches && rawBatches.length > 0) {
          const formatted = rawBatches.map((batch) => {
            const scheduleText =
              batch.start_time && batch.end_time
                ? `${batch.start_time} - ${batch.end_time}`
                : batch.duration
                ? `${batch.duration} Mins`
                : "Scheduled";

            const rawDate = batch.assessment_date || batch.created_at;

            // Generate clean Batch ID / Code format
            const batchCode =
              batch.batch_code ||
              batch.batch_id ||
              (batch.id ? `BATCH-${batch.id.slice(0, 8).toUpperCase()}` : "N/A");

            return {
              id: batch.id,
              assessmentId: batch.assessment_id,
              name: batch.assessment_name || "Untitled Assessment Batch",
              code: batchCode, // <--- Displays Batch ID / Batch Code here
              activeTrainees: traineeCountsMap[batch.id] ?? 0,
              schedule: scheduleText,
              startDate: rawDate
                ? new Date(rawDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A",
            };
          });

          setAssignedBatches(formatted);
        } else {
          setAssignedBatches([]);
        }
      } catch (err) {
        console.error("Error loading assessment batches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedBatches();
  }, []);

  // Search and date filters
  const filteredBatches = useMemo(() => {
    let result = assignedBatches;

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((batch) =>
        `${batch.name} ${batch.code}`.toLowerCase().includes(query)
      );
    }

    if (selectedDate) {
      result = result.filter((batch) => {
        if (!batch.startDate || batch.startDate === "N/A") return false;
        return batch.startDate.includes(selectedDate);
      });
    }

    return result;
  }, [searchTerm, selectedDate, assignedBatches]);

  const handleViewTrainees = (batch) => {
    navigate("/assessor/assessment-panel/selected-trainees", {
      state: {
        selectedCourse: batch.name,
        batchId: batch.id,
        assessmentId: batch.assessmentId,
        batchCode: batch.code,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assessment Panel"
        subtitle="Manage and monitor your assigned assessment batches"
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-sm">
          Fetching assigned assessment batches...
        </div>
      ) : (
        <CourseListTable
          courses={filteredBatches}
          searchTerm={searchTerm}
          selectedDate={selectedDate}
          onSearchChange={setSearchTerm}
          onDateChange={setSelectedDate}
          onViewTrainees={handleViewTrainees}
        />
      )}
    </div>
  );
}