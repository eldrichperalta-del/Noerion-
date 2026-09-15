import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";
import BasicInformationForm from "../../../components/admin/add-assessor/BasicInformationForm";
import FormProgressSidebar from "../../../components/admin/add-assessor/FormProgressSidebar";

function AddAssessor() {
  const navigate = useNavigate();

  // ============================================================
  // BASIC INFORMATION STATE
  // ============================================================

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    gender: "",
    birthDate: "",
    contactNumber: "",
    email: "",
  });

  // ============================================================
  // EMAIL VALIDATION
  // ============================================================

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValidEmail = emailRegex.test(
    formData.email.trim()
  );

  // ============================================================
  // REQUIRED FIELD VALIDATION
  // ============================================================

  const isFirstNameCompleted =
    formData.firstName.trim() !== "";

  const isLastNameCompleted =
    formData.lastName.trim() !== "";

  const isGenderCompleted =
    formData.gender.trim() !== "";

  const isBirthDateCompleted =
    formData.birthDate.trim() !== "";

  const isContactNumberCompleted =
    formData.contactNumber.trim() !== "";

  const isStepOneComplete =
    isFirstNameCompleted &&
    isLastNameCompleted &&
    isGenderCompleted &&
    isBirthDateCompleted &&
    isContactNumberCompleted &&
    isValidEmail;

  // ============================================================
  // UPDATE FORM FIELD
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    navigate("/admin/user-management/assessors");
  };

  // ============================================================
  // NEXT STEP
  // ============================================================

  const handleNext = () => {
    if (!isStepOneComplete) {
      return;
    }

    navigate(
      "/admin/user-management/add-assessor/account-setup",
      {
        state: {
          assessorData: formData,
        },
      }
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="px-6 pt-4 pb-6">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      {/* ========================================================
    BREADCRUMBS
======================================================== */}

      <nav className="-mt-4 mb-3 flex items-center gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/user-management")
          }
          className="text-gray-500 hover:text-[#002f86] hover:underline"
        >
          User Management
        </button>

        <span className="text-gray-400">
          &gt;
        </span>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/user-management/assessors")
          }
          className="text-gray-500 hover:text-[#002f86] hover:underline"
        >
          Assessor Management
        </button>

        <span className="text-gray-400">
          &gt;
        </span>

        <span className="text-[#002f86]">
          Add Assessor
        </span>
      </nav>

      {/* ========================================================
    PAGE HEADER
======================================================== */}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#15294b]">
          Add New Assessor
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Follow the steps below to register a new assessor and
          send them an invitation to create their account password.
        </p>
      </div>

      {/* ========================================================
          STEPPER
      ======================================================== */}

      <AddAssessorStepper
        currentStep={1}
      />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-6">

        {/* FORM */}

        <BasicInformationForm
          formData={formData}
          onChange={handleChange}
          isValidEmail={isValidEmail}
          onCancel={handleCancel}
          onNext={handleNext}
          isStepOneComplete={isStepOneComplete}
        />

        {/* PROGRESS SIDEBAR */}

        <FormProgressSidebar
          currentStep={1}
          isFirstNameCompleted={
            isFirstNameCompleted
          }
          isLastNameCompleted={
            isLastNameCompleted
          }
          isGenderCompleted={
            isGenderCompleted
          }
          isBirthDateCompleted={
            isBirthDateCompleted
          }
          isContactNumberCompleted={
            isContactNumberCompleted
          }
          isValidEmail={
            isValidEmail
          }
        />

      </div>
    </div>
  );
}

export default AddAssessor;