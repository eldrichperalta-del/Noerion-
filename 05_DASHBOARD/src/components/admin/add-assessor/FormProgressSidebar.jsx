import { Check } from "lucide-react";

// ============================================================
// PROGRESS ITEM
// ============================================================

function ProgressItem({
  completed,
  label,
  optional = false,
}) {
  return (
    <div className="flex items-center gap-3">
      {completed ? (
        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#15294b]">
          <Check
            size={14}
            className="text-white"
          />
        </div>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
      )}

      <span
        className={
          completed
            ? "text-sm font-medium text-[#15294b]"
            : "text-sm text-gray-600"
        }
      >
        {label}

        {optional && (
          <span className="ml-1 text-xs text-gray-400">
            (Optional)
          </span>
        )}
      </span>
    </div>
  );
}

// ============================================================
// FORM PROGRESS SIDEBAR
// ============================================================

function FormProgressSidebar({
  currentStep,

  // ==========================================================
  // STEP 1 - BASIC INFORMATION
  // ==========================================================

  isFirstNameCompleted = false,
  isLastNameCompleted = false,
  isGenderCompleted = false,
  isBirthDateCompleted = false,
  isContactNumberCompleted = false,
  isValidEmail = false,

  // ==========================================================
  // STEP 2 - PROFESSIONAL INFORMATION
  // ==========================================================

  isAssessorIdCompleted = false,
  isAssessmentCenterCompleted = false,
  isSpecializationCompleted = false,

  // ==========================================================
  // STEP 3 - VERIFICATION DOCUMENTS
  // ==========================================================

  hasProfilePhoto = false,
  hasAccreditation = false,
  hasGovernmentId = false,
}) {
  // ==========================================================
  // STEP 1
  // ==========================================================

  const showStepOne =
    currentStep === 1;

  // ==========================================================
  // STEP 2
  // ==========================================================

  const showStepTwo =
    currentStep === 2;

  // ==========================================================
  // STEP 3
  // ==========================================================

  const showStepThree =
    currentStep === 3;

  return (
    <aside className="h-fit w-[290px] shrink-0 rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
      
      {/* ======================================================
          HEADER
      ====================================================== */}

      <h3 className="text-xl font-bold text-[#15294b]">
        Form Progress
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Step {currentStep} of 3
      </p>

      {/* ======================================================
          STEP 1 - BASIC INFORMATION
      ====================================================== */}

      {showStepOne && (
        <div className="mt-6 space-y-4">
          <ProgressItem
            completed={isFirstNameCompleted}
            label="First Name"
          />

          <ProgressItem
            completed={isLastNameCompleted}
            label="Last Name"
          />

          <ProgressItem
            completed={isGenderCompleted}
            label="Gender"
          />

          <ProgressItem
            completed={isBirthDateCompleted}
            label="Date of Birth"
          />

          <ProgressItem
            completed={isContactNumberCompleted}
            label="Contact Number"
          />

          <ProgressItem
            completed={isValidEmail}
            label="Valid Email Address"
          />
        </div>
      )}

      {/* ======================================================
          STEP 2 - PROFESSIONAL INFORMATION
      ====================================================== */}

      {showStepTwo && (
        <div className="mt-6 space-y-4">
          <ProgressItem
            completed={isAssessorIdCompleted}
            label="TESDA Assessor ID"
          />

          <ProgressItem
            completed={isAssessmentCenterCompleted}
            label="Assessment Center"
          />

          <ProgressItem
            completed={isSpecializationCompleted}
            label="Specialization"
          />

          <ProgressItem
            completed={true}
            label="Years of Experience"
            optional={true}
          />
        </div>
      )}

      {/* ======================================================
          STEP 3 - VERIFICATION
      ====================================================== */}

      {showStepThree && (
        <div className="mt-6 space-y-4">
          <ProgressItem
            completed={hasProfilePhoto}
            label="Profile Photo"
          />

          <ProgressItem
            completed={hasAccreditation}
            label="Accreditation Certificate"
          />

          <ProgressItem
            completed={hasGovernmentId}
            label="Government ID"
            optional={true}
          />
        </div>
      )}

      {/* ======================================================
          INFORMATION
      ====================================================== */}

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs leading-5 text-[#15294b]">
          Complete all required information before proceeding to
          the next step.
        </p>
      </div>
    </aside>
  );
}

export default FormProgressSidebar;