import { createContext, useContext, useState } from "react";
import { mockAssessments } from "../data/mockAssessments";

const AssessmentContext = createContext();

export function AssessmentProvider({ children }) {
  // ==========================================================
  // Assessment List
  // ==========================================================
  const [assessments, setAssessments] = useState(mockAssessments);

  // ==========================================================
  // Current Assessment Workflow
  // ==========================================================
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedTrainee, setSelectedTrainee] = useState(null);

  // ==========================================================
  // Update Assessment Status
  // ==========================================================
  const updateAssessmentStatus = (assessmentId, status) => {
    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === assessmentId
          ? {
              ...assessment,
              status,
            }
          : assessment
      )
    );
  };

  // ==========================================================
  // Replace Assessment
  // ==========================================================
  const updateAssessment = (updatedAssessment) => {
    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === updatedAssessment.id
          ? updatedAssessment
          : assessment
      )
    );
  };

  return (
    <AssessmentContext.Provider
      value={{
        assessments,
        updateAssessmentStatus,
        updateAssessment,

        // ======================================================
        // Current Workflow
        // ======================================================
        selectedAssessment,
        setSelectedAssessment,

        selectedTrainee,
        setSelectedTrainee,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessments() {
  return useContext(AssessmentContext);
}