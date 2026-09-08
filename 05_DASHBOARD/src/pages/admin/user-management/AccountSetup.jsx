import { useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";
import FormProgressSidebar from "../../../components/admin/add-assessor/FormProgressSidebar";

function AccountSetup() {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // GET STEP 1 DATA
  // ============================================================

  const assessorData = location.state?.assessorData;

  // ============================================================
  // PROFESSIONAL INFORMATION STATE
  // ============================================================

  const [professionalData, setProfessionalData] = useState({
    assessorId: "",
    assessmentCenter: "",
    specialization: "",
    experience: "",
  });

  // ============================================================
  // PROTECT PAGE FROM DIRECT ACCESS
  // ============================================================

  if (!assessorData) {
    return (
      <Navigate
        to="/admin/user-management/add-assessor"
        replace
      />
    );
  }

  // ============================================================
  // REQUIRED FIELD VALIDATION
  // ============================================================

  const isAssessorIdCompleted =
    professionalData.assessorId.trim() !== "";

  const isAssessmentCenterCompleted =
    professionalData.assessmentCenter.trim() !== "";

  const isSpecializationCompleted =
    professionalData.specialization.trim() !== "";

  const isStepTwoComplete =
    isAssessorIdCompleted &&
    isAssessmentCenterCompleted &&
    isSpecializationCompleted;

  // ============================================================
  // UPDATE FORM FIELD
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfessionalData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ============================================================
  // BACK TO STEP 1
  // ============================================================

  const handleBack = () => {
    navigate(
      "/admin/user-management/add-assessor",
      {
        state: {
          assessorData,
        },
      }
    );
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    navigate(
      "/admin/user-management/assessors"
    );
  };

  // ============================================================
  // NEXT STEP
  // ============================================================

  const handleNext = () => {
    if (!isStepTwoComplete) {
      return;
    }

    navigate(
      "/admin/user-management/add-assessor/verification",
      {
        state: {
          assessorData,
          professionalData,
        },
      }
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="h-full overflow-y-auto px-6 pt-4 pb-6">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#15294b]">
          Add New Assessor
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Provide the assessor's professional information before
          proceeding to verification.
        </p>
      </div>

      {/* ========================================================
          STEPPER
      ======================================================== */}

      <AddAssessorStepper
        currentStep={2}
      />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-6">

        {/* ======================================================
            FORM
        ====================================================== */}

        <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#15294b]">
              Professional Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the professional details of the assessor.
            </p>
          </div>

          {/* ====================================================
              FORM FIELDS
          ==================================================== */}

          <div className="grid gap-5 sm:grid-cols-2">

            {/* TESDA ASSESSOR ID */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="assessorId"
                className="text-sm font-semibold text-gray-700"
              >
                TESDA Assessor ID Number
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="assessorId"
                type="text"
                name="assessorId"
                value={professionalData.assessorId}
                onChange={handleChange}
                placeholder="Enter assessor ID number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
              />
            </div>

            {/* ASSESSMENT CENTER */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="assessmentCenter"
                className="text-sm font-semibold text-gray-700"
              >
                Assessment Center /
                Training Institution
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="assessmentCenter"
                type="text"
                name="assessmentCenter"
                value={professionalData.assessmentCenter}
                onChange={handleChange}
                placeholder="Enter assessment center"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
              />
            </div>

            {/* SPECIALIZATION */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="specialization"
                className="text-sm font-semibold text-gray-700"
              >
                Qualification /
                Specialization
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="specialization"
                type="text"
                name="specialization"
                value={professionalData.specialization}
                onChange={handleChange}
                placeholder="Enter specialization"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
              />
            </div>

            {/* YEARS OF EXPERIENCE */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="experience"
                className="text-sm font-semibold text-gray-700"
              >
                Years of Experience
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                id="experience"
                type="number"
                name="experience"
                min="0"
                value={professionalData.experience}
                onChange={handleChange}
                placeholder="Enter years of experience"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
              />
            </div>

          </div>

          {/* ====================================================
              ACTION BUTTONS
          ==================================================== */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">

            {/* LEFT BUTTONS */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-[#15294b] bg-white px-5 py-2.5 text-sm font-semibold text-[#15294b] transition hover:bg-blue-50"
              >
                Back
              </button>

            </div>

            {/* NEXT BUTTON */}

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepTwoComplete}
              className="rounded-lg bg-[#15294b] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>

          </div>

        </div>

        {/* ======================================================
            PROGRESS SIDEBAR
        ====================================================== */}

        <FormProgressSidebar
          currentStep={2}
          isFirstNameCompleted={true}
          isLastNameCompleted={true}
          isGenderCompleted={true}
          isBirthDateCompleted={true}
          isContactNumberCompleted={true}
          isValidEmail={true}
        />

      </div>

    </div>
  );
}

export default AccountSetup;
