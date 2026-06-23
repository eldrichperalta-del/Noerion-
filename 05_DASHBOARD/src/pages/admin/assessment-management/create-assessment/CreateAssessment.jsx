import { useState } from "react";

import StepProgressBar from "../../../../components/admin/create-assessment/StepProgressBar";

import SelectTrainees from "./SelectTrainees";
import AssignAssessor from "./AssignAssessor";
import ScheduleAssessment from "./ScheduleAssessment";
import ReviewConfirm from "./ReviewConfirm";

function CreateAssessment() {
  // Tracks which step of the assessment wizard is currently active (1–4)
  const [currentStep, setCurrentStep] = useState(1);

  // Main data object that holds ALL assessment information across steps
  // This structure is backend-ready (can be sent as API payload)
  const [assessmentData, setAssessmentData] = useState({
    trainees: [], // selected trainees list
    assessor: {}, // selected assessor object
    schedule: {
      date: "",      // assessment date
      startTime: "", // start time
      endTime: "",   // end time
    },
    qualification: "", // assessment qualification/category
  });

  // Resets the entire wizard back to initial state
  // Used after successful assessment creation
  const resetAssessment = () => {
    setAssessmentData({
      trainees: [],
      assessor: {},
      schedule: {
        date: "",
        startTime: "",
        endTime: "",
      },
      qualification: "",
    });

    // Return user back to Step 1
    setCurrentStep(1);
  };

  // Debug: logs current step for development tracking
  console.log("CURRENT STEP:", currentStep);

  // Moves user forward in the step wizard (Step 1 → Step 4)
  const nextStep = () => {
    console.log("NEXT STEP CLICKED:", currentStep);

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Moves user backward in the step wizard
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen p-0">

      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E3A8A]">
          Create Assessment
        </h1>
        <p className="mt-2 text-gray-600">
          Follow the steps to set up a new assessment.
        </p>
      </div>

      {/* PROGRESS INDICATOR */}
      <div className="mb-8">
        <StepProgressBar currentStep={currentStep} />
      </div>

      {/* STEP 1: Select Trainees */}
      {currentStep === 1 && (
        <SelectTrainees
          assessmentData={assessmentData}
          setAssessmentData={setAssessmentData}
          onNext={nextStep}
        />
      )}

      {/* STEP 2: Assign Assessor */}
      {currentStep === 2 && (
        <AssignAssessor
          assessmentData={assessmentData}
          setAssessmentData={setAssessmentData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {/* STEP 3: Schedule Assessment */}
      {currentStep === 3 && (
        <ScheduleAssessment
          assessmentData={assessmentData}
          setAssessmentData={setAssessmentData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {/* STEP 4: Review + Confirm */}
      {currentStep === 4 && (
        <ReviewConfirm
          assessmentData={assessmentData}
          onNext={nextStep}
          onBack={prevStep}
          resetAssessment={resetAssessment}
        />
      )}

    </div>
  );
}

export default CreateAssessment;