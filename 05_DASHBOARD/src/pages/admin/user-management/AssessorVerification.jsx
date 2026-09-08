import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FileText,
  Image,
  Upload,
  X,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "../../../supabaseClient.js";

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";

// ============================================================
// STORAGE BUCKET
// ============================================================

const ASSESSOR_DOCUMENTS_BUCKET =
  "assessor-documents";

// ============================================================
// HELPERS
// ============================================================

function sanitizeFileName(fileName) {
  return String(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeEmailForPath(email) {
  return String(email)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds
    );
  });
}

// ============================================================
// WAIT FOR PROFILE CREATED BY AUTH TRIGGER
// ============================================================

async function waitForProfile(
  userId,
  maxAttempts = 10
) {
  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq(
        "id",
        userId
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data;
    }

    await sleep(300);
  }

  return null;
}

// ============================================================
// UPLOAD ASSESSOR FILE
// ============================================================

async function uploadAssessorFile({
  file,
  folder,
  email,
}) {
  if (!file) {
    return null;
  }

  const emailFolder =
    sanitizeEmailForPath(email);

  const timestamp =
    Date.now();

  const fileName =
    sanitizeFileName(file.name);

  const filePath =
    `${folder}/${emailFolder}/${timestamp}-${fileName}`;

  const {
    error,
  } = await supabase.storage
    .from(ASSESSOR_DOCUMENTS_BUCKET)
    .upload(
      filePath,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type ||
          "application/octet-stream",
      }
    );

  if (error) {
    throw new Error(
      `Failed to upload ${file.name}: ${error.message}`
    );
  }

  return filePath;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function AssessorVerification() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  // ============================================================
  // GET DATA FROM PREVIOUS STEPS
  // ============================================================

  const assessorData =
    location.state?.assessorData;

  const professionalData =
    location.state?.professionalData;

  // ============================================================
  // FILE STATE
  // ============================================================

  const [
    profilePhoto,
    setProfilePhoto,
  ] = useState(null);

  const [
    profilePhotoPreview,
    setProfilePhotoPreview,
  ] = useState("");

  const [
    accreditationFile,
    setAccreditationFile,
  ] = useState(null);

  const [
    governmentIdFile,
    setGovernmentIdFile,
  ] = useState(null);

  // ============================================================
  // SUBMISSION STATE
  // ============================================================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  // ============================================================
  // FILE INPUT REFERENCES
  // ============================================================

  const photoInputRef =
    useRef(null);

  const accreditationInputRef =
    useRef(null);

  const governmentIdInputRef =
    useRef(null);

  // ============================================================
  // CLEAN UP PREVIEW URL
  // ============================================================

  useEffect(() => {
    return () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(
          profilePhotoPreview
        );
      }
    };
  }, [
    profilePhotoPreview,
  ]);

  // ============================================================
  // PROTECT PAGE FROM DIRECT ACCESS
  // ============================================================

  if (
    !assessorData ||
    !professionalData
  ) {
    navigate(
      "/admin/user-management/add-assessor",
      {
        replace: true,
      }
    );

    return null;
  }

  // ============================================================
  // FILE VALIDATION
  // ============================================================

  const isPhotoValid =
    Boolean(profilePhoto);

  const isAccreditationValid =
    Boolean(accreditationFile);

  const isGovernmentIdValid =
    Boolean(governmentIdFile);

  const isStepThreeComplete =
    isPhotoValid &&
    isAccreditationValid &&
    isGovernmentIdValid;

  // ============================================================
  // PROFILE PHOTO CHANGE
  // ============================================================

  const handlePhotoChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        profilePhotoPreview
      ) {
        URL.revokeObjectURL(
          profilePhotoPreview
        );
      }

      setProfilePhoto(
        file
      );

      setProfilePhotoPreview(
        URL.createObjectURL(
          file
        )
      );
    };

  // ============================================================
  // REMOVE PROFILE PHOTO
  // ============================================================

  const handleRemovePhoto =
    () => {
      if (
        profilePhotoPreview
      ) {
        URL.revokeObjectURL(
          profilePhotoPreview
        );
      }

      setProfilePhoto(
        null
      );

      setProfilePhotoPreview(
        ""
      );

      if (
        photoInputRef.current
      ) {
        photoInputRef.current.value =
          "";
      }
    };

  // ============================================================
  // ACCREDITATION FILE CHANGE
  // ============================================================

  const handleAccreditationChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setAccreditationFile(
        file
      );
    };

  // ============================================================
  // GOVERNMENT ID FILE CHANGE
  // ============================================================

  const handleGovernmentIdChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setGovernmentIdFile(
        file
      );
    };

  // ============================================================
  // REMOVE ACCREDITATION
  // ============================================================

  const handleRemoveAccreditation =
    () => {
      setAccreditationFile(
        null
      );

      if (
        accreditationInputRef.current
      ) {
        accreditationInputRef.current.value =
          "";
      }
    };

  // ============================================================
  // REMOVE GOVERNMENT ID
  // ============================================================

  const handleRemoveGovernmentId =
    () => {
      setGovernmentIdFile(
        null
      );

      if (
        governmentIdInputRef.current
      ) {
        governmentIdInputRef.current.value =
          "";
      }
    };

  // ============================================================
  // BACK
  // ============================================================

  const handleBack =
    () => {
      navigate(
        "/admin/user-management/add-assessor/account-setup",
        {
          state: {
            assessorData,
            professionalData,
          },
        }
      );
    };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel =
    () => {
      navigate(
        "/admin/user-management/assessors"
      );
    };

  // ============================================================
  // SUBMIT / CREATE / RESUBMIT
  // ============================================================

  const handleSubmit =
    async () => {
      if (
        !isStepThreeComplete ||
        isSubmitting
      ) {
        return;
      }

      setSubmitError(
        ""
      );

      setIsSubmitting(
        true
      );

      try {
        // ======================================================
        // NORMALIZE EMAIL
        // ======================================================

        const email =
          String(
            assessorData.email
          )
            .trim()
            .toLowerCase();

        if (!email) {
          throw new Error(
            "Assessor email is required."
          );
        }

        // ======================================================
        // CHECK EXISTING PROFILE
        // ======================================================

        const {
          data: existingProfile,
          error: existingProfileError,
        } = await supabase
          .from("profiles")
          .select(
            `
              id,
              email,
              role,
              registration_status,
              is_approved,
              rejected_reason
            `
          )
          .eq(
            "email",
            email
          )
          .maybeSingle();

        if (
          existingProfileError
        ) {
          throw existingProfileError;
        }

        let userId =
          existingProfile?.id ||
          null;

        let isResubmission =
          false;

        let isNewAccount =
          false;

        // ======================================================
        // HANDLE EXISTING PROFILE
        // ======================================================

        if (
          existingProfile
        ) {
          const existingRole =
            String(
              existingProfile.role ||
              ""
            )
              .toLowerCase()
              .trim();

          if (
            existingRole &&
            existingRole !==
              "assessor"
          ) {
            throw new Error(
              "An account with this email already exists under a different role."
            );
          }

          const existingStatus =
            String(
              existingProfile.registration_status ||
              ""
            )
              .toLowerCase()
              .trim();

          if (
            existingStatus ===
            "pending"
          ) {
            throw new Error(
              "An assessor registration with this email is already pending approval."
            );
          }

          if (
            existingStatus ===
            "approved"
          ) {
            throw new Error(
              "An assessor account with this email is already approved."
            );
          }

          if (
            existingStatus ===
            "rejected"
          ) {
            isResubmission =
              true;
          } else {
            throw new Error(
              `An assessor account already exists with registration status: ${existingProfile.registration_status}.`
            );
          }
        }

        // ======================================================
        // CREATE AUTH ACCOUNT FOR NEW ASSESSOR
        // ======================================================

        if (
          !userId
        ) {
          const password =
            assessorData.password;

          if (!password) {
            throw new Error(
              "Password is missing. Please go back to Account Setup and enter a password."
            );
          }

          const {
            data: authData,
            error: authError,
          } = await supabase.auth.signUp(
            {
              email,
              password,
              options: {
                data: {
                  first_name:
                    assessorData.firstName ||
                    "",

                  last_name:
                    assessorData.lastName ||
                    "",

                  role:
                    "assessor",
                },
              },
            }
          );

          if (
            authError
          ) {
            throw authError;
          }

          userId =
            authData?.user?.id ||
            null;

          if (
            !userId
          ) {
            throw new Error(
              "Authentication account could not be created."
            );
          }

          isNewAccount =
            true;

          // ====================================================
          // WAIT FOR AUTH TRIGGER TO CREATE MAIN PROFILE
          // ====================================================

          const triggerProfile =
            await waitForProfile(
              userId
            );

          if (
            !triggerProfile
          ) {
            throw new Error(
              "Authentication account was created, but the system could not find the profile created by the signup trigger. Please try again."
            );
          }
        }

        // ======================================================
        // UPLOAD FILES
        // ======================================================

        const [
          profilePhotoPath,
          accreditationPath,
          governmentIdPath,
        ] = await Promise.all([
          uploadAssessorFile({
            file:
              profilePhoto,

            folder:
              "profile-photos",

            email,
          }),

          uploadAssessorFile({
            file:
              accreditationFile,

            folder:
              "accreditation-certificates",

            email,
          }),

          uploadAssessorFile({
            file:
              governmentIdFile,

            folder:
              "government-ids",

            email,
          }),
        ]);

        // ======================================================
        // UPDATE MAIN PROFILE
        //
        // IMPORTANT:
        // The auth trigger already creates the profile for new
        // accounts. We only UPDATE it here.
        // ======================================================

        const profilePayload = {
          email,

          first_name:
            assessorData.firstName ||
            "",

          middle_name:
            assessorData.middleName ||
            null,

          last_name:
            assessorData.lastName ||
            "",

          suffix:
            assessorData.suffix ||
            null,

          gender:
            assessorData.gender ||
            null,

          date_of_birth:
            assessorData.dateOfBirth ||
            null,

          contact_number:
            assessorData.contactNumber ||
            null,

          role:
            "assessor",

          registration_status:
            "pending",

          is_approved:
            false,

          rejected_reason:
            null,

          profile_photo_url:
            profilePhotoPath,
        };

        const {
          data: updatedProfile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .update(
            profilePayload
          )
          .eq(
            "id",
            userId
          )
          .select(
            "id"
          )
          .maybeSingle();

        if (
          profileError
        ) {
          throw new Error(
            `Failed to save main profile: ${profileError.message}`
          );
        }

        if (
          !updatedProfile?.id
        ) {
          throw new Error(
            "The main profile could not be updated."
          );
        }

        // ======================================================
        // UPSERT ASSESSOR PROFILE
        // ======================================================

        const assessorProfilePayload = {
          user_id:
            userId,

          email,

          assessor_id_number:
            professionalData.assessorId,

          qualification_specialization:
            professionalData.specialization,

          assessment_center:
            professionalData.assessmentCenter,

          years_of_experience:
            professionalData.yearsOfExperience
              ? Number(
                  professionalData.yearsOfExperience
                )
              : null,

          accreditation_cert_url:
            accreditationPath,

          government_id_url:
            governmentIdPath,
        };

        const {
          error:
            assessorProfileError,
        } = await supabase
          .from(
            "assessor_profiles"
          )
          .upsert(
            assessorProfilePayload,
            {
              onConflict:
                "user_id",
            }
          );

        if (
          assessorProfileError
        ) {
          throw new Error(
            `Failed to save assessor profile: ${assessorProfileError.message}`
          );
        }

        // ======================================================
        // SUCCESS
        // ======================================================

        alert(
          isResubmission
            ? "Assessor registration has been resubmitted for approval."
            : isNewAccount
              ? "Assessor account has been created successfully and is pending approval."
              : "Assessor registration has been updated successfully and is pending approval."
        );

        navigate(
          "/admin/user-management/assessors",
          {
            replace: true,
          }
        );
      } catch (
        error
      ) {
        console.error(
          "ASSESSOR SUBMISSION ERROR:",
          error
        );

        setSubmitError(
          error?.message ||
            "Failed to create assessor."
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="h-full overflow-y-auto px-6 pt-4 pb-6">

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#15294b]">
          Add New Assessor
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Upload the required verification documents before
          creating the assessor account.
        </p>
      </div>

      <AddAssessorStepper
        currentStep={3}
      />

      <div className="mx-auto max-w-[1000px]">

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          {submitError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* PROFILE PHOTO */}

          <section>

            <h3 className="mb-3 text-sm font-bold text-gray-800">
              Profile Photo
              <span className="ml-1 text-red-500">
                *
              </span>
            </h3>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">

              <input
                ref={
                  photoInputRef
                }
                type="file"
                accept="image/jpeg,image/png"
                onChange={
                  handlePhotoChange
                }
                className="hidden"
              />

              {profilePhotoPreview ? (
                <div className="flex items-center gap-5">

                  <img
                    src={
                      profilePhotoPreview
                    }
                    alt="Profile preview"
                    className="h-28 w-28 rounded-xl border border-gray-200 object-cover"
                  />

                  <div className="flex flex-col gap-2">

                    <p className="text-sm font-semibold text-gray-800">
                      {
                        profilePhoto?.name
                      }
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleRemovePhoto
                      }
                      disabled={
                        isSubmitting
                      }
                      className="flex w-fit items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <X
                        size={16}
                      />

                      Remove Photo
                    </button>

                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">

                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-blue-50">
                    <Image
                      size={24}
                      className="text-[#15294b]"
                    />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    Upload Profile Photo
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    JPG or PNG format.
                  </p>

                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      photoInputRef.current?.click()
                    }
                    className="mt-4 flex items-center gap-2 rounded-lg bg-[#15294b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f1f3b] disabled:opacity-50"
                  >
                    <Upload
                      size={16}
                    />

                    Choose Photo
                  </button>

                </div>
              )}

            </div>

          </section>

          {/* SUPPORTING DOCUMENTS */}

          <section className="mt-8">

            <h3 className="mb-3 text-sm font-bold text-gray-800">
              Supporting Documents
            </h3>

            <div className="grid gap-5 md:grid-cols-2">

              {/* ACCREDITATION */}

              <div className="rounded-xl border border-gray-200 p-5">

                <div className="mb-4 flex items-center gap-3">

                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50">
                    <FileText
                      size={19}
                      className="text-[#15294b]"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      TESDA Accreditation Certificate
                    </h4>

                    <p className="text-xs text-gray-500">
                      Required document
                    </p>
                  </div>

                </div>

                <input
                  ref={
                    accreditationInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={
                    handleAccreditationChange
                  }
                  className="hidden"
                />

                {accreditationFile ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">

                    <div className="flex items-center justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-green-800">
                          {
                            accreditationFile.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          File selected successfully
                        </p>

                      </div>

                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={
                          handleRemoveAccreditation
                        }
                        className="shrink-0 text-red-600 transition hover:text-red-800 disabled:opacity-50"
                      >
                        <X
                          size={18}
                        />
                      </button>

                    </div>

                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      accreditationInputRef.current?.click()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-semibold text-[#15294b] transition hover:border-[#15294b] hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Upload
                      size={17}
                    />

                    Upload Certificate
                  </button>
                )}

              </div>

              {/* GOVERNMENT ID */}

              <div className="rounded-xl border border-gray-200 p-5">

                <div className="mb-4 flex items-center gap-3">

                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50">
                    <FileText
                      size={19}
                      className="text-[#15294b]"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      Government-issued ID
                    </h4>

                    <p className="text-xs text-gray-500">
                      Required document
                    </p>
                  </div>

                </div>

                <input
                  ref={
                    governmentIdInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={
                    handleGovernmentIdChange
                  }
                  className="hidden"
                />

                {governmentIdFile ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">

                    <div className="flex items-center justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-green-800">
                          {
                            governmentIdFile.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          File selected successfully
                        </p>

                      </div>

                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={
                          handleRemoveGovernmentId
                        }
                        className="shrink-0 text-red-600 transition hover:text-red-800 disabled:opacity-50"
                      >
                        <X
                          size={18}
                        />
                      </button>

                    </div>

                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={() =>
                      governmentIdInputRef.current?.click()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-semibold text-[#15294b] transition hover:border-[#15294b] hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Upload
                      size={17}
                    />

                    Upload Government ID
                  </button>
                )}

              </div>

            </div>

          </section>

          {/* REVIEW SUMMARY */}

          <section className="mt-8 rounded-xl border border-blue-100 bg-blue-50/40 p-5">

            <div className="mb-4 flex items-center gap-2">

              <CheckCircle2
                size={19}
                className="text-[#15294b]"
              />

              <h3 className="text-sm font-bold text-[#15294b]">
                Assessor Summary
              </h3>

            </div>

            <div className="grid gap-4 text-sm sm:grid-cols-2">

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Assessor Name
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    `${assessorData.firstName} ${
                      assessorData.middleName || ""
                    } ${assessorData.lastName}`.trim()
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Email
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    assessorData.email
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Assessor ID
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    professionalData.assessorId
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Specialization
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    professionalData.specialization
                  }
                </p>
              </div>

            </div>

          </section>

          {/* ACTION BUTTONS */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={
                  isSubmitting
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleBack
                }
                disabled={
                  isSubmitting
                }
                className="flex items-center gap-2 rounded-lg border border-[#15294b] bg-white px-5 py-2.5 text-sm font-semibold text-[#15294b] transition hover:bg-blue-50 disabled:opacity-50"
              >
                <ArrowLeft
                  size={16}
                />

                Back
              </button>

            </div>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                !isStepThreeComplete ||
                isSubmitting
              }
              className="rounded-lg bg-[#15294b] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting
                ? "Submitting..."
                : "Create Assessor"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AssessorVerification;