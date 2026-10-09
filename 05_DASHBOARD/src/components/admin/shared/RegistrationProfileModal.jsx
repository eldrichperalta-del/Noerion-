import { useEffect, useState } from "react";

import {
  X,
  ZoomIn,
  FileText,
  ExternalLink,
  RefreshCw,
  User,
  Calendar,
  Phone,
  Mail,
  School,
  IdCard,
  Briefcase,
  Layers3,
  ListRestart,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../../../supabaseClient.js";

// =========================================================
// STORAGE CONFIGURATION
// =========================================================

const ASSESSOR_DOCUMENTS_BUCKET = "assessor-documents";

// =========================================================
// PROFILE FIELD DEFINITIONS
// =========================================================

const personalFields = [
  ["first_name", "First Name", User],
  ["last_name", "Last Name", User],
  ["middle_name", "Middle Name (Optional)", User],
  ["suffix", "Suffix (Optional)", Tag],
  ["gender", "Gender", Briefcase],
  ["date_of_birth", "Date of Birth", Calendar],
  ["contact_number", "Contact Number", Phone],
  ["email", "Personal Email Address", Mail],
];

const traineeFields = [
  [
    "training_center",
    "Training Center / TVET Institution",
    School,
  ],
  ["nc_level", "NC Level", Layers3],
  [
    "qualification_course",
    "Qualification / Course",
    Briefcase,
  ],
  ["batch", "Batch (Optional)", ListRestart],
];

const assessorFields = [
  [
    "assessor_id_number",
    "TESDA Assessor ID Number",
    IdCard,
  ],
  [
    "assessment_center",
    "Assessment Center / Training Institution",
    School,
  ],
  [
    "qualification_specialization",
    "Qualification / Specialization",
    Briefcase,
  ],
  [
    "years_of_experience",
    "Years of Experience (Optional)",
    Briefcase,
  ],
];

// =========================================================
// HELPER: GET ASSESSOR RELATION
// =========================================================

function getAssessorRelation(profile) {
  if (!profile?.assessor_profiles) {
    return null;
  }

  return Array.isArray(profile.assessor_profiles)
    ? profile.assessor_profiles[0]
    : profile.assessor_profiles;
}

// =========================================================
// HELPER: GET TRAINEE RELATION
// =========================================================

function getTraineeRelation(profile) {
  if (!profile?.trainee_profiles) {
    return null;
  }

  return Array.isArray(profile.trainee_profiles)
    ? profile.trainee_profiles[0]
    : profile.trainee_profiles;
}

// =========================================================
// HELPER: CHECK IF VALUE IS FULL URL
// =========================================================

function isFullUrl(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://"))
  );
}

// =========================================================
// HELPER: CREATE SIGNED STORAGE URL
// =========================================================

async function getStorageUrl(
  path,
  bucket = ASSESSOR_DOCUMENTS_BUCKET
) {
  if (!path) {
    return "";
  }

  let cleanPath = String(path).trim();

  if (!cleanPath) {
    return "";
  }

  // If this is already a full Supabase Storage URL,
  // extract the actual Storage object path so we can
  // create a signed URL from the correct bucket.
  if (isFullUrl(cleanPath)) {
    const marker =
      `/storage/v1/object/public/${bucket}/`;

    if (cleanPath.includes(marker)) {
      cleanPath = cleanPath.split(marker)[1];
    } else {
      // If it is a full URL but does not belong
      // to the requested bucket, leave it alone.
      return cleanPath;
    }
  }

  cleanPath = cleanPath
    .replace(/^\/+/, "")
    .trim();

  if (!cleanPath) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, 60 * 60);

  if (error) {
    console.error(
      `[RegistrationProfileModal] Error creating signed URL from ${bucket}:`,
      error,
      cleanPath
    );

    return "";
  }

  return data?.signedUrl || "";
}

// =========================================================
// DETAILS COMPONENT
// =========================================================

function Details({
  fields,
  profile,
  extraData,
  isEditing = false,
  editForm = {},
  onFieldChange,
}) {
  const getFieldValue = (key) => {
    if (
      profile?.[key] !== undefined &&
      profile?.[key] !== null &&
      profile?.[key] !== ""
    ) {
      return profile[key];
    }

    if (
      extraData?.[key] !== undefined &&
      extraData?.[key] !== null &&
      extraData?.[key] !== ""
    ) {
      return extraData[key];
    }

    const assessorRel = getAssessorRelation(profile);

    if (
      assessorRel?.[key] !== undefined &&
      assessorRel?.[key] !== null &&
      assessorRel?.[key] !== ""
    ) {
      return assessorRel[key];
    }

    const traineeRel = getTraineeRelation(profile);

    if (
      traineeRel?.[key] !== undefined &&
      traineeRel?.[key] !== null &&
      traineeRel?.[key] !== ""
    ) {
      return traineeRel[key];
    }

    return "";
  };

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {fields.map(([key, label, Icon]) => {
        const value = Object.prototype.hasOwnProperty.call(
          editForm,
          key
        )
          ? editForm[key] ?? ""
          : getFieldValue(key);

        return (
          <div
            key={key}
            className="flex flex-col gap-1"
          >
            <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
              {Icon && (
                <Icon
                  size={14}
                  className="text-[#9ca3af]"
                />
              )}

              {label}
            </dt>

            {isEditing ? (
              key === "gender" ? (
                <select
                  value={value}
                  onChange={(event) =>
                    onFieldChange(
                      key,
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
                >
                  <option value="">
                    Select Gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              ) : (
                <input
                  type={
                    key === "date_of_birth"
                      ? "date"
                      : key === "email"
                        ? "email"
                        : key === "years_of_experience"
                          ? "number"
                          : "text"
                  }
                  value={value}
                  onChange={(event) =>
                    onFieldChange(
                      key,
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
                />
              )
            ) : (
              <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">
                {value || "Not provided"}
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function RegistrationProfileModal({
  profile,
  title = "Profile Details",
  onClose,
  onApprove,
  onReject,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  currentNumber = 0,
  totalProfiles = 0,
}) {
  // =======================================================
  // STATE
  // =======================================================

  const [showReject, setShowReject] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const [previewPhoto, setPreviewPhoto] =
    useState(false);

  const [documentFiles, setDocumentFiles] =
    useState([]);

  const [loadingDocs, setLoadingDocs] =
    useState(false);

  const [extraRoleData, setExtraRoleData] =
    useState(null);

  const [profilePhotoUrl, setProfilePhotoUrl] =
    useState("");

  const [isEditing, setIsEditing] =
    useState(false);

  const [savingChanges, setSavingChanges] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  const [editForm, setEditForm] =
    useState({});

  // Local status allows the modal to immediately
  // reflect Approve/Reject without waiting for
  // the parent list to refresh.
  const [localStatus, setLocalStatus] =
    useState("");

  // =======================================================
  // DETERMINE ROLE
  // =======================================================

  const assessor =
    profile?.role?.toLowerCase() === "assessor" ||
    title
      .toLowerCase()
      .includes("assessor");

  // =======================================================
  // RESET COMPONENT STATE
  // =======================================================

  useEffect(() => {
    setExtraRoleData(null);
    setDocumentFiles([]);
    setProfilePhotoUrl("");
    setShowReject(false);
    setReason("");
    setPreviewPhoto(false);
    setIsEditing(false);
    setSavingChanges(false);
    setSaveError("");
    setEditForm({});
    setLocalStatus("");
  }, [profile?.id]);

  // =======================================================
  // FETCH ROLE DETAILS
  // =======================================================

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const fetchRoleDetails = async () => {
      try {
        const table = assessor
          ? "assessor_profiles"
          : "trainee_profiles";

        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (error) {
          console.error(
            `Error fetching ${table}:`,
            error
          );
          return;
        }

        setExtraRoleData(data ?? null);
      } catch (err) {
        console.error(
          "Error fetching role details:",
          err
        );
      }
    };

    fetchRoleDetails();
  }, [profile?.id, assessor]);

  // =======================================================
  // INITIALIZE EDIT FORM
  // =======================================================

  useEffect(() => {
    if (!profile) {
      return;
    }

    const assessorRelation =
      getAssessorRelation(profile);

    const traineeRelation =
      getTraineeRelation(profile);

    const source = {
      ...(traineeRelation || {}),
      ...(assessorRelation || {}),
      ...profile,
      ...(extraRoleData || {}),
    };

    const fields = [
      ...personalFields,
      ...(assessor
        ? assessorFields
        : traineeFields),
    ];

    const initialForm = {};

    fields.forEach(([key]) => {
      initialForm[key] =
        source?.[key] ?? "";
    });

    setEditForm(initialForm);
  }, [
    profile?.id,
    extraRoleData,
    assessor,
  ]);

  // =======================================================
  // RESOLVE PROFILE PHOTO
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const resolveProfilePhoto = async () => {
      const photoValue =
        profile?.profile_photo_url;

      if (
        typeof photoValue !== "string" ||
        photoValue.trim() === ""
      ) {
        if (!cancelled) {
          setProfilePhotoUrl("");
        }

        return;
      }

      const photoPath =
        photoValue.trim();

      // =====================================================
      // TRAINEE PHOTO
      // Bucket: trainee-documents
      // =====================================================

      if (
        profile?.role?.toLowerCase() ===
        "trainee"
      ) {
        const resolvedUrl =
          await getStorageUrl(
            photoPath,
            "trainee-documents"
          );

        if (!cancelled) {
          setProfilePhotoUrl(
            resolvedUrl
          );
        }

        return;
      }

      // =====================================================
      // ASSESSOR PHOTO
      // Bucket: assessor-documents
      // =====================================================

      if (
        profile?.role?.toLowerCase() ===
        "assessor"
      ) {
        const resolvedUrl =
          await getStorageUrl(
            photoPath,
            ASSESSOR_DOCUMENTS_BUCKET
          );

        if (!cancelled) {
          setProfilePhotoUrl(
            resolvedUrl
          );
        }

        return;
      }

      // =====================================================
      // FALLBACK
      // =====================================================

      if (!cancelled) {
        setProfilePhotoUrl(
          isFullUrl(photoPath)
            ? photoPath
            : ""
        );
      }
    };

    resolveProfilePhoto();

    return () => {
      cancelled = true;
    };
  }, [
    profile?.id,
    profile?.role,
    profile?.profile_photo_url,
  ]);

  // =======================================================
  // FETCH ASSESSOR DOCUMENTS
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const fetchUserDocuments =
      async () => {
        if (!assessor) {
          if (!cancelled) {
            setDocumentFiles([]);
            setLoadingDocs(false);
          }

          return;
        }

        setLoadingDocs(true);

        try {
          const assessorRelation =
            getAssessorRelation(profile);

          const accreditationPath =
            profile?.accreditation_cert_url ||
            assessorRelation?.accreditation_cert_url ||
            extraRoleData?.accreditation_cert_url ||
            null;

          const governmentIdPath =
            profile?.government_id_url ||
            assessorRelation?.government_id_url ||
            extraRoleData?.government_id_url ||
            null;

          const documentsToResolve = [
            {
              category:
                "TESDA Assessor Accreditation Certificate",
              path:
                accreditationPath,
            },
            {
              category:
                "Government-issued ID",
              path:
                governmentIdPath,
            },
          ];

          const resolvedDocuments = [];

          for (
            const document of documentsToResolve
          ) {
            if (!document.path) {
              continue;
            }

            const resolvedUrl =
              await getStorageUrl(
                document.path
              );

            if (!resolvedUrl) {
              continue;
            }

            const fileName =
              String(
                document.path
              )
                .split("/")
                .pop() ||
              "View Document";

            resolvedDocuments.push({
              category:
                document.category,
              name:
                fileName,
              path:
                document.path,
              url:
                resolvedUrl,
            });
          }

          if (!cancelled) {
            setDocumentFiles(
              resolvedDocuments
            );
          }
        } catch (err) {
          console.error(
            "Error fetching assessor documents:",
            err
          );

          if (!cancelled) {
            setDocumentFiles([]);
          }
        } finally {
          if (!cancelled) {
            setLoadingDocs(false);
          }
        }
      };

    fetchUserDocuments();

    return () => {
      cancelled = true;
    };
  }, [
    assessor,
    profile?.id,
    profile?.accreditation_cert_url,
    profile?.government_id_url,
    profile?.assessor_profiles,
    extraRoleData?.accreditation_cert_url,
    extraRoleData?.government_id_url,
  ]);

  // =======================================================
  // GUARD
  // =======================================================

  if (!profile) {
    return null;
  }

  // =======================================================
  // PROFILE VALUES
  // =======================================================

  const initials =
    `${profile.first_name?.[0] ||
      profile.fullName?.[0] ||
      "?"
      }${profile.last_name?.[0] || ""}`
      .toUpperCase();

  // =======================================================
  // NORMALIZED STATUS
  // =======================================================

  const normalizedStatus =
    String(
      localStatus ||
      profile.status ||
      profile.registration_status ||
      ""
    )
      .toLowerCase()
      .trim();

  const isApproved =
    normalizedStatus.includes(
      "approved"
    );

  const isRejected =
    normalizedStatus.includes(
      "rejected"
    ) ||
    normalizedStatus.includes(
      "reject"
    );

  const isDeactivated =
    normalizedStatus.includes(
      "deactivated"
    );

  const isFinalStatus =
    isApproved ||
    isRejected ||
    isDeactivated;

  // =======================================================
  // ACTION HANDLERS
  // =======================================================

  const handleFieldChange = (
    key,
    value
  ) => {
    setEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =======================================================
  // START EDITING
  // =======================================================

  const handleStartEditing = () => {
    setSaveError("");
    setIsEditing(true);
  };

  // =======================================================
  // CANCEL EDITING
  // =======================================================

  const handleCancelEditing = () => {
    const assessorRelation =
      getAssessorRelation(profile);

    const traineeRelation =
      getTraineeRelation(profile);

    const source = {
      ...(traineeRelation || {}),
      ...(assessorRelation || {}),
      ...profile,
      ...(extraRoleData || {}),
    };

    const fields = [
      ...personalFields,
      ...(assessor
        ? assessorFields
        : traineeFields),
    ];

    const restoredForm = {};

    fields.forEach(([key]) => {
      restoredForm[key] =
        source?.[key] ?? "";
    });

    setEditForm(restoredForm);
    setSaveError("");
    setIsEditing(false);
  };

  // =======================================================
  // SAVE CHANGES
  // =======================================================

  const handleSaveChanges = async () => {
    if (!profile?.id) {
      return;
    }

    setSavingChanges(true);
    setSaveError("");

    try {
      // -----------------------------------------------------
      // PERSONAL INFORMATION
      // profiles table
      // -----------------------------------------------------

      const profileUpdates = {};

      personalFields.forEach(([key]) => {
        profileUpdates[key] =
          editForm[key] ?? "";
      });

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", profile.id);

      if (profileError) {
        throw profileError;
      }

      // -----------------------------------------------------
      // ROLE-SPECIFIC INFORMATION
      // trainee_profiles / assessor_profiles
      // -----------------------------------------------------

      const roleFields = assessor
        ? assessorFields
        : traineeFields;

      const roleUpdates = {};

      roleFields.forEach(([key]) => {
        roleUpdates[key] =
          editForm[key] ?? "";
      });

      const roleTable = assessor
        ? "assessor_profiles"
        : "trainee_profiles";

      const {
        error: roleError,
      } = await supabase
        .from(roleTable)
        .update(roleUpdates)
        .eq("user_id", profile.id);

      if (roleError) {
        throw roleError;
      }

      // -----------------------------------------------------
      // UPDATE LOCAL FORM DATA
      //
      // IMPORTANT:
      // Do NOT call setExtraRoleData here.
      // Doing so can cause the initialization effect
      // to rebuild the form from stale profile data.
      // -----------------------------------------------------

      setEditForm((current) => ({
        ...current,
        ...profileUpdates,
        ...roleUpdates,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error(
        "[RegistrationProfileModal] Error saving profile changes:",
        error
      );

      setSaveError(
        error?.message ||
        "Unable to save the changes. Please try again."
      );
    } finally {
      setSavingChanges(false);
    }
  };

  // =======================================================
  // CONFIRM REJECT
  // =======================================================

  const handleConfirmReject = () => {
    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      return;
    }

    if (onReject) {
      onReject(
        profile.id,
        trimmedReason
      );
    }

    // Immediately change the modal
    // into its final-status state.
    setLocalStatus("rejected");

    setReason("");
    setShowReject(false);
  };

  // =======================================================
  // APPROVE
  // =======================================================

  const handleApprove = () => {
    if (onApprove) {
      onApprove(profile.id);
    }

    // Immediately change the modal
    // into its final-status state.
    setLocalStatus("approved");
  };

  // =======================================================
  // PREVIOUS
  // =======================================================

  const handlePrevious = () => {
    if (
      canGoPrevious &&
      onPrevious
    ) {
      onPrevious();
    }
  };

  // =======================================================
  // NEXT
  // =======================================================

  const handleNext = () => {
    if (
      canGoNext &&
      onNext
    ) {
      onNext();
    }
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-[#15294b] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <User
              size={18}
              className="text-white"
            />

            <h2 className="text-lg font-semibold">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white transition hover:text-red-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6">

          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <div className="mb-8 flex items-center gap-5 border-b border-[#e5e7eb] pb-6">
            <div className="group relative shrink-0">

              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#f1f5f9] text-3xl font-bold text-[#15294b] shadow-inner">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      console.error(
                        "[RegistrationProfileModal] FAILED TO LOAD PROFILE PHOTO:",
                        profilePhotoUrl
                      );

                      console.error(
                        "[RegistrationProfileModal] Image error:",
                        event
                      );

                      setProfilePhotoUrl("");
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              {profilePhotoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPhoto(true)
                  }
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <ZoomIn size={18} />
                </button>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#111827]">
                {profile.fullName ||
                  `${profile.first_name || ""} ${profile.last_name || ""
                    }`.trim()}
              </h2>

              <p className="text-sm text-[#6b7280]">
                Registration details
              </p>

              {/* =================================================
                  FINAL REGISTRATION STATUS
                  Only appears after approval, rejection,
                  or deactivation.
              ================================================= */}

              {isApproved && (
                <div className="mt-3">
                  <span className="inline-flex rounded-lg bg-green-100 px-5 py-2.5 text-sm font-semibold text-green-700">
                    Approved
                  </span>
                </div>
              )}

              {isRejected && (
                <div className="mt-3">
                  <span className="inline-flex rounded-lg bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-700">
                    Rejected
                  </span>
                </div>
              )}

              {isDeactivated && (
                <div className="mt-3">
                  <span className="inline-flex rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700">
                    Deactivated
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              REJECTION REASON
          ================================================= */}

          {profile.rejected_reason && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <span className="mb-1 block font-bold uppercase tracking-wider">
                Previous Rejection Reason:
              </span>

              {profile.rejected_reason}
            </div>
          )}

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section>
            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              Personal Information
            </h3>

            <Details
              fields={personalFields}
              profile={profile}
              extraData={extraRoleData}
              isEditing={isEditing}
              editForm={editForm}
              onFieldChange={
                handleFieldChange
              }
            />
          </section>

          {/* =================================================
              PROFESSIONAL / TRAINING INFORMATION
          ================================================= */}

          <section className="mt-10">
            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              {assessor
                ? "Professional Information"
                : "Training Information"}
            </h3>

            <Details
              fields={
                assessor
                  ? assessorFields
                  : traineeFields
              }
              profile={profile}
              extraData={extraRoleData}
              isEditing={isEditing}
              editForm={editForm}
              onFieldChange={
                handleFieldChange
              }
            />
          </section>

          {/* =================================================
              SUPPORTING DOCUMENTS
          ================================================= */}

          {assessor && (
            <section className="mt-10">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[#111827]">
                <FileText
                  size={20}
                  className="text-[#15294b]"
                />

                Supporting Documents
              </h3>

              {loadingDocs ? (
                <div className="flex items-center justify-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] py-8 text-sm text-[#6b7280]">
                  <RefreshCw
                    size={18}
                    className="animate-spin text-[#15294b]"
                  />

                  Loading supporting documents...
                </div>
              ) : (
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">

                  {/* =================================================
                      ACCREDITATION CERTIFICATE
                  ================================================= */}

                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                      TESDA Assessor Accreditation Certificate
                    </dt>

                    {documentFiles.find(
                      (document) =>
                        document.category ===
                        "TESDA Assessor Accreditation Certificate"
                    ) ? (
                      <a
                        href={
                          documentFiles.find(
                            (document) =>
                              document.category ===
                              "TESDA Assessor Accreditation Certificate"
                          ).url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm font-semibold text-[#111827] transition hover:border-[#15294b] hover:bg-blue-50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            size={16}
                            className="shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                          />

                          <span className="truncate">
                            View Document
                          </span>
                        </div>

                        <ExternalLink
                          size={16}
                          className="ml-2 shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                        />
                      </a>
                    ) : (
                      <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
                        Not provided
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      GOVERNMENT ID
                  ================================================= */}

                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                      Government-issued ID
                    </dt>

                    {documentFiles.find(
                      (document) =>
                        document.category ===
                        "Government-issued ID"
                    ) ? (
                      <a
                        href={
                          documentFiles.find(
                            (document) =>
                              document.category ===
                              "Government-issued ID"
                          ).url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm font-semibold text-[#111827] transition hover:border-[#15294b] hover:bg-blue-50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText
                            size={16}
                            className="shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                          />

                          <span className="truncate">
                            View Document
                          </span>
                        </div>

                        <ExternalLink
                          size={16}
                          className="ml-2 shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                        />
                      </a>
                    ) : (
                      <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
                        Not provided
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =================================================
              SAVE ERROR
          ================================================= */}

          {saveError && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-12 flex items-center justify-between gap-4 border-t border-[#e5e7eb] pt-6">

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <span className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#15294b] shadow-sm">
                {currentNumber}
                {" / "}
                {totalProfiles}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="flex items-center gap-3">

              {/* =================================================
                  PENDING REGISTRATION
                  SHOW REJECT / APPROVE
              ================================================= */}

              {!isFinalStatus ? (
                <>
                  {onReject && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowReject(true)
                      }
                      className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      Reject
                    </button>
                  )}

                  {onApprove && (
                    <button
                      type="button"
                      onClick={
                        handleApprove
                      }
                      className="rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b]"
                    >
                      Approve
                    </button>
                  )}
                </>
              ) : (

                /* =================================================
                   FINAL STATUS
                   SHOW CANCEL / EDIT
                ================================================= */

                <>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={
                          handleCancelEditing
                        }
                        disabled={
                          savingChanges
                        }
                        className="rounded-lg border border-[#d1d5db] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleSaveChanges
                        }
                        disabled={
                          savingChanges
                        }
                        className="flex items-center gap-2 rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingChanges && (
                          <RefreshCw
                            size={16}
                            className="animate-spin"
                          />
                        )}

                        {savingChanges
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-[#d1d5db] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] shadow-sm transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleStartEditing
                        }
                        className="rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b]"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* =====================================================
          PHOTO PREVIEW MODAL
      ===================================================== */}

      {previewPhoto && profilePhotoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] max-w-4xl">
            <button
              type="button"
              onClick={() =>
                setPreviewPhoto(false)
              }
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
              aria-label="Close photo preview"
            >
              <X size={20} />
            </button>

            <img
              src={profilePhotoUrl}
              alt="Profile preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* =====================================================
          REJECT MODAL
      ===================================================== */}

      {showReject && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">

            {/* REJECT HEADER */}

            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#111827]">
                Reject Registration
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowReject(false);
                  setReason("");
                }}
                className="text-gray-500 transition hover:text-red-500"
                aria-label="Close rejection dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* REJECT BODY */}

            <div className="p-6">
              <p className="mb-4 text-sm text-[#6b7280]">
                Please provide a reason for rejecting
                this registration.
              </p>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Enter rejection reason..."
                className="w-full resize-none rounded-lg border border-[#d1d5db] bg-white p-3 text-sm text-[#111827] outline-none transition placeholder:text-gray-400 focus:border-[#15294b] focus:ring-2 focus:ring-[#15294b]/10"
              />

              {!reason.trim() && (
                <p className="mt-2 text-xs text-red-500">
                  A rejection reason is required.
                </p>
              )}
            </div>

            {/* REJECT ACTIONS */}

            <div className="flex items-center justify-end gap-3 border-t border-[#e5e7eb] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowReject(false);
                  setReason("");
                }}
                className="rounded-lg border border-[#d1d5db] bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmReject
                }
                disabled={!reason.trim()}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}