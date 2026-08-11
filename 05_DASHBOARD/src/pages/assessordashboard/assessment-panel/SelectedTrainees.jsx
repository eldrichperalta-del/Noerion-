import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import SelectedTraineesTable from "../../../components/assessordashboard/flow/SelectedTraineesTable";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";
import { useAssessments } from "../../../context/AssessmentContext";

export default function SelectedTrainees() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Navigation state passed from AssessmentPanel
  const selectedCourse = state?.selectedCourse || "Assessment Batch";
  const batchId = state?.batchId;
  const assessmentId = state?.assessmentId || state?.courseId;
  const batchCode = state?.batchCode || state?.courseCode || "N/A";

  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  const { setSelectedAssessment, setSelectedTrainee } = useAssessments();

  useEffect(() => {
    async function fetchAssignedTrainees() {
      setLoading(true);
      try {
        // 1. Fetch assigned trainees from `assignments` table
        let query = supabase.from("assignments").select("*");

        if (batchId) {
          query = query.eq("batch_id", batchId);
        } else if (assessmentId) {
          query = query.eq("assessment_id", assessmentId);
        }

        const { data: assignmentsData, error: assignError } = await query;

        if (assignError) throw assignError;

        if (assignmentsData && assignmentsData.length > 0) {
          // Extract unique trainee IDs and assignment IDs
          const traineeIds = [
            ...new Set(assignmentsData.map((a) => a.trainee_id).filter(Boolean)),
          ];
          const assignmentIds = assignmentsData.map((a) => a.id).filter(Boolean);

          // 2. Fetch trainee profile names from `profiles`
          let profilesMap = {};
          if (traineeIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .in("id", traineeIds);

            if (profilesData) {
              profilesData.forEach((p) => {
                profilesMap[p.id] = p;
              });
            }
          }

          // 3. Fetch submission statuses from `assessment_submissions`
          let submissionsMap = {};
          if (assignmentIds.length > 0 || traineeIds.length > 0) {
            let subQuery = supabase.from("assessment_submissions").select("*");

            if (assignmentIds.length > 0) {
              subQuery = subQuery.in("assignment_id", assignmentIds);
            } else if (traineeIds.length > 0) {
              subQuery = subQuery.in("trainee_id", traineeIds);
            }

            const { data: subsData } = await subQuery;

            if (subsData) {
              subsData.forEach((s) => {
                const key = s.assignment_id || s.trainee_id;
                submissionsMap[key] = s;
              });
            }
          }

          // 4. Combine into formatted list expected by SelectedTraineesTable
          const formatted = assignmentsData.map((assignment) => {
            const profile = profilesMap[assignment.trainee_id];
            const submission =
              submissionsMap[assignment.id] || submissionsMap[assignment.trainee_id];

            // Resolve Name
            const fullName = profile
              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                profile.email
              : assignment.trainee_id
              ? `Trainee #${assignment.trainee_id.slice(0, 8)}`
              : "Assigned Trainee";

            // Resolve Status
            let status = "Not Started";
            if (submission) {
              if (submission.status === "evaluated" || submission.status === "completed") {
                status = "Evaluated";
              } else if (submission.status === "submitted") {
                status = "Submitted";
              } else if (submission.status === "in_progress") {
                status = "In Progress";
              }
            } else if (assignment.status === "completed") {
              status = "Evaluated";
            } else if (assignment.status === "in_progress") {
              status = "In Progress";
            }

            return {
              id: assignment.trainee_id || assignment.id,
              assignmentId: assignment.id,
              batchId: assignment.batch_id || batchId,
              assessmentId: assignment.assessment_id || assessmentId,
              fullName,
              traineeId: assignment.trainee_id
                ? `#TRA-${assignment.trainee_id.slice(0, 6).toUpperCase()}`
                : `#ASSIGN-${assignment.id.slice(0, 6).toUpperCase()}`,
              course: selectedCourse,
              status,
              submission: submission || null,
              assignment: assignment,
            };
          });

          setTrainees(formatted);
        } else {
          setTrainees([]);
        }
      } catch (err) {
        console.error("Error fetching assigned trainees:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedTrainees();
  }, [batchId, assessmentId, selectedCourse]);

  const handleViewAssessment = (trainee) => {
    const assessmentInfo = {
      id: trainee.assessmentId || assessmentId,
      batchId: trainee.batchId || batchId,
      courseCode: batchCode,
      courseName: selectedCourse,
    };

    setSelectedAssessment(assessmentInfo);
    setSelectedTrainee(trainee);

    navigate("/assessor/assessment-panel/assessment-overview", {
      state: {
        trainee,
        assessment: assessmentInfo,
        selectedCourse,
        batchId: trainee.batchId || batchId,
        batchCode,
        assignmentId: trainee.assignmentId,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: "Assessment Panel",
            to: "/assessor/assessment-panel",
          },
          {
            label: `${selectedCourse} (${batchCode})`,
          },
        ]}
      />

      <AssessorPageHeader
        title={`Trainees for ${selectedCourse}`}
        subtitle="Select a trainee to review and begin the assessment."
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-sm">
          Fetching assigned trainees for this batch...
        </div>
      ) : (
        <SelectedTraineesTable
          trainees={trainees}
          actionLabel="View Assessment"
          onAction={handleViewAssessment}
        />
      )}
    </div>
  );
}