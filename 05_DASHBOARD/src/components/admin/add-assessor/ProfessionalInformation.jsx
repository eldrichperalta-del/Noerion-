import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";

import ProfessionalInformationForm from "../../../components/admin/add-assessor/ProfessionalInformationForm";

import FormProgressSidebar from "../../../components/admin/add-assessor/FormProgressSidebar";

function ProfessionalInformation() {
  const navigate = useNavigate();

  const location = useLocation();

  // ============================================================
  // GET BASIC INFORMATION FROM STEP 1
  // ============================================================

  const assessorData =
    location.state?.assessorData;

  // ============================================================
  // REDIRECT IF USER DIRECTLY OPENS THIS PAGE
  // ============================================================

  useEffect(() => {
    if (!assessorData) {
      navigate(
        "/user-management/add-assessor",
        {
          replace: true,
        }
      );
    }
  }, [
    assessorData,
    navigate,
  ]);

  // ============================================================
  // PROFESSIONAL INFORMATION STATE
  // ============================================================

  const [
    professionalData,
    setProfessionalData,
  ] = useState({
    assessorId: "",
    assessmentCenter: "",
    specialization: "",
    experience: "",
  });

  // ============================================================
  // FILE STATE
  // ============================================================

  const [
    photoFile,
    setPhotoFile,
  ] = useState(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [
    photoInputKey,
    setPhotoInputKey,
  ] = useState(0);

  const [
    documents,
    setDocuments,
  ] = useState({
    accreditation: null,
    governmentId: null,
  });

  // ============================================================
  // UPDATE PROFESSIONAL FORM
  // ============================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfessionalData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  // ============================================================
  // PROFILE PHOTO
  // ============================================================

  const handlePhotoChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // ----------------------------------------------------------
    // FILE TYPE VALIDATION
    // ----------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Please upload a JPG or PNG image."
      );

      return;
    }

    // ----------------------------------------------------------
    // FILE SIZE VALIDATION
    // MAXIMUM 5 MB
    // ----------------------------------------------------------

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      alert(
        "Profile photo must not exceed 5 MB."
      );

      return;
    }

    // ----------------------------------------------------------
    // SAVE FILE
    // ----------------------------------------------------------

    setPhotoFile(
      file
    );

    // ----------------------------------------------------------
    // CREATE PREVIEW
    // ----------------------------------------------------------

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setPhotoPreview(
      previewUrl
    );
  };

  // ============================================================
  // REMOVE PROFILE PHOTO
  // ============================================================

  const handleRemovePhoto =
    () => {
      if (
        photoPreview
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }

      setPhotoFile(
        null
      );

      setPhotoPreview(
        ""
      );

      // ----------------------------------------------------------
      // RESET FILE INPUT
      // ----------------------------------------------------------

      setPhotoInputKey(
        (current) =>
          current + 1
      );
    };

  // ============================================================
  // DOCUMENT VALIDATION
  // ============================================================

  const validateDocument =
    (file) => {
      if (!file) {
        return {
          valid: false,
        };
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        alert(
          "Only PDF, JPG, and PNG files are allowed."
        );

        return {
          valid: false,
        };
      }

      // ----------------------------------------------------------
      // MAXIMUM 10 MB
      // ----------------------------------------------------------

      const maxSize =
        10 * 1024 * 1024;

      if (
        file.size >
        maxSize
      ) {
        alert(
          "Document must not exceed 10 MB."
        );

        return {
          valid: false,
        };
      }

      return {
        valid: true,
      };
    };

  // ============================================================
  // ACCREDITATION DOCUMENT
  // ============================================================

  const handleAccreditationChange =
    (
      event
    ) => {
      const file =
        event.target.files?.[0] ||
        null;

      if (!file) {
        return;
      }

      const validation =
        validateDocument(
          file
        );

      if (
        !validation.valid
      ) {
        return;
      }

      setDocuments(
        (
          current
        ) => ({
          ...current,
          accreditation:
            file,
        })
      );
    };

  // ============================================================
  // GOVERNMENT ID
  // ============================================================

  const handleGovernmentIdChange =
    (
      event
    ) => {
      const file =
        event.target.files?.[0] ||
        null;

      if (!file) {
        return;
      }

      const validation =
        validateDocument(
          file
        );

      if (
        !validation.valid
      ) {
        return;
      }

      setDocuments(
        (
          current
        ) => ({
          ...current,
          governmentId:
            file,
        })
      );
    };

  // ============================================================
  // STEP VALIDATION
  // ============================================================

  const isAssessorIdComplete =
    professionalData.assessorId
      .trim() !== "";

  const isAssessmentCenterComplete =
    professionalData.assessmentCenter
      .trim() !== "";

  const isSpecializationComplete =
    professionalData.specialization
      .trim() !== "";

  const hasProfilePhoto =
    Boolean(
      photoFile
    );

  const hasAccreditation =
    Boolean(
      documents.accreditation
    );

  const isStepTwoComplete =
    isAssessorIdComplete &&
    isAssessmentCenterComplete &&
    isSpecializationComplete &&
    hasProfilePhoto &&
    hasAccreditation;

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    navigate(
      "/user-management/add-assessor",
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
      "/user-management"
    );
  };

  // ============================================================
  // NEXT
  // ============================================================

  const handleNext = () => {
    if (
      !isStepTwoComplete
    ) {
      return;
    }

    navigate(
      "/user-management/add-assessor/review-confirm",
      {
        state: {
          assessorData,
          professionalData,
          photoFile,
          photoPreview,
          documents,
        },
      }
    );
  };

  // ============================================================
  // PREVENT RENDER IF NO STEP 1 DATA
  // ============================================================

  if (
    !assessorData
  ) {
    return null;
  }

  return (
    <div className="px-6 pt-4 pb-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#15294b]">
          Add New Assessor
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Provide the assessor's professional information and
          supporting documents.
        </p>
      </div>

      {/* ======================================================
          STEPPER
      ====================================================== */}

      <AddAssessorStepper
        currentStep={2}
      />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-6">
        <ProfessionalInformationForm
          professionalData={
            professionalData
          }
          onChange={
            handleChange
          }
          photoPreview={
            photoPreview
          }
          photoInputKey={
            photoInputKey
          }
          onPhotoChange={
            handlePhotoChange
          }
          onRemovePhoto={
            handleRemovePhoto
          }
          accreditationFile={
            documents.accreditation
          }
          governmentIdFile={
            documents.governmentId
          }
          onAccreditationChange={
            handleAccreditationChange
          }
          onGovernmentIdChange={
            handleGovernmentIdChange
          }
          onBack={
            handleBack
          }
          onCancel={
            handleCancel
          }
          onNext={
            handleNext
          }
          isStepTwoComplete={
            isStepTwoComplete
          }
        />

        <FormProgressSidebar
          currentStep={2}
          isAssessorIdCompleted={
            isAssessorIdComplete
          }
          isAssessmentCenterCompleted={
            isAssessmentCenterComplete
          }
          isSpecializationCompleted={
            isSpecializationComplete
          }
          hasProfilePhoto={
            hasProfilePhoto
          }
          hasAccreditation={
            hasAccreditation
          }
          hasGovernmentId={
            Boolean(
              documents.governmentId
            )
          }
          stepType="professional"
        />
      </div>
    </div>
  );
}

export default ProfessionalInformation;