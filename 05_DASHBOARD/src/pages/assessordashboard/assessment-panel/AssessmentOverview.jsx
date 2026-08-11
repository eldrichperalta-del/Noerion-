import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import { useAssessments } from "../../../context/AssessmentContext";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessmentOverviewPanel from "../../../components/assessordashboard/flow/AssessmentOverviewPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

export default function AssessmentOverview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { selectedAssessment, selectedTrainee } = useAssessments();

  const trainee = selectedTrainee || state?.trainee;
  const assessment = selectedAssessment || state?.assessment;

  const selectedCourse = state?.selectedCourse || assessment?.courseName;
  const batchCode = state?.batchCode || trainee?.batchCode;

  const [assessmentDetails, setAssessmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // Fetch detailed assessment data (duration, total items)
  // ==========================================================
  useEffect(() => {
    async function fetchAssessmentDetails() {
      if (!assessment?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select("total_items, time_limit_minutes, set_type")
          .eq("id", assessment.id)
          .single();

        if (!error && data) {
          setAssessmentDetails({
            totalItems: data.total_items || 40,
            duration: data.time_limit_minutes || 40,
            setType: data.set_type || "Multiple Choice",
          });
        }
      } catch (err) {
        console.error("Error fetching assessment details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessmentDetails();
  }, [assessment?.id]);

  // ==========================================================
  // Prevent direct access if no trainee/assessment is selected
  // ==========================================================
  if (!trainee || !assessment) {
    return <Navigate to="/assessor/assessment-panel" replace />;
  }

  // Use the trainee status derived from the previous page's fetch
  const currentStatus = trainee.status || "Not Started";

  const assessmentSections = [
    {
      id: 1,
      title: "Written Assessment",
      description: "Evaluates theoretical knowledge of course concepts.",
      status: currentStatus,
      eegStatus: currentStatus === "Submitted" ? "Recording Complete" : "Waiting for Connection",
    },
  ];

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: "Assessment Panel",
            to: "/assessor/assessment-panel",
          },
          {
            label: `${selectedCourse} ${batchCode ? `(${batchCode})` : ""}`,
            to: "/assessor/assessment-panel/selected-trainees",
            state: {
              selectedCourse,
              batchId: state?.batchId,
              assessmentId: assessment?.id,
              batchCode,
            },
          },
          {
            label: trainee.fullName,
          },
        ]}
      />

      <AssessorPageHeader
        title="Assessment Overview"
        subtitle="Review trainee information before starting the written assessment."
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-sm">
          Loading assessment details...
        </div>
      ) : (
        <AssessmentOverviewPanel
          trainee={trainee}
          assessment={assessment}
          sections={assessmentSections}
          details={assessmentDetails} // <--- Pass DB details to Panel
          onEvaluate={() =>
            navigate("/assessor/assessment-panel/written-review", {
              state: {
                trainee,
                assessment,
                selectedCourse,
                batchId: state?.batchId,
                assignmentId: state?.assignmentId,
              },
            })
          }
        />
      )}
    </div>
  );
}