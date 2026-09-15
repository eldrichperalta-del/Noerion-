import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AddTraineeStepper from "./AddTraineeStepper";
import TrainingInformationForm from "./TrainingInformationForm";
import FormProgressSidebar from "./FormProgressSidebar";

function TrainingInformation() {
  const location = useLocation();
  const navigate = useNavigate();

  const traineeData = location.state?.traineeData;

  const [trainingData, setTrainingData] = useState({
    trainingCenter: "",
    ncLevel: "",
    qualificationCourse: "",
    batch: "",
  });

  // If the user opens this page directly without completing Step 1,
  // return them to the Basic Information page.
  if (!traineeData) {
    navigate("/admin/user-management/add-trainee", { replace: true });
    return null;
  }

  const handleChange = (field, value) => {
    setTrainingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStepTwoComplete =
    trainingData.trainingCenter.trim() !== "" &&
    trainingData.ncLevel.trim() !== "" &&
    trainingData.qualificationCourse.trim() !== "";

  const handleBack = () => {
    navigate("/admin/user-management/add-trainee", {
      state: {
        traineeData,
      },
    });
  };

  const handleCancel = () => {
    navigate("/admin/user-management/trainees");
  };

  const handleNext = () => {
    if (!isStepTwoComplete) return;

    navigate("/admin/user-management/add-trainee/verification", {
      state: {
        traineeData,
        trainingData,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#eef4f8] px-6 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#001F5B]">
          Add New Trainee
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Register a new trainee in the system.
        </p>
      </div>

      {/* Stepper */}
      <AddTraineeStepper currentStep={2} />

      {/* Main Content */}
      <div className="mt-6 flex items-start gap-6">
        {/* Form */}
        <TrainingInformationForm
          trainingData={trainingData}
          onChange={handleChange}
          onBack={handleBack}
          onCancel={handleCancel}
          onNext={handleNext}
          isStepTwoComplete={isStepTwoComplete}
        />

        {/* Progress Sidebar */}
        <FormProgressSidebar
          currentStep={2}
          isFirstNameCompleted={Boolean(traineeData.firstName?.trim())}
          isLastNameCompleted={Boolean(traineeData.lastName?.trim())}
          isGenderCompleted={Boolean(traineeData.gender)}
          isBirthDateCompleted={Boolean(traineeData.birthDate)}
          isContactNumberCompleted={Boolean(
            traineeData.contactNumber?.trim()
          )}
          isValidEmail={Boolean(traineeData.email?.trim())}
          isTrainingCenterCompleted={Boolean(
            trainingData.trainingCenter.trim()
          )}
          isNcLevelCompleted={Boolean(trainingData.ncLevel.trim())}
          isQualificationCourseCompleted={Boolean(
            trainingData.qualificationCourse.trim()
          )}
          isBatchCompleted={Boolean(trainingData.batch.trim())}
          hasProfilePhoto={false}
        />
      </div>
    </div>
  );
}

export default TrainingInformation;

