import { useEffect, useState } from "react";
import {
  X,
  ZoomIn,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../supabaseClient.js";

const personalFields = [
  ["first_name", "First Name"],
  ["last_name", "Last Name"],
  ["middle_name", "Middle Name (Optional)"],
  ["suffix", "Suffix (Optional)"],
  ["gender", "Gender"],
  ["date_of_birth", "Date of Birth"],
  ["contact_number", "Contact Number"],
  ["email", "Personal Email Address"],
];

const traineeFields = [
  ["training_center", "Training Center / TVET Institution"],
  ["nc_level", "NC Level"],
  ["qualification_course", "Qualification / Course"],
  ["batch", "Batch (Optional)"],
];

const assessorFields = [
  ["assessor_id_number", "TESDA Assessor ID Number"],
  ["assessment_center", "Assessment Center / Training Institution"],
  ["qualification_specialization", "Qualification / Specialization"],
  ["years_of_experience", "Years of Experience (Optional)"],
];

function Details({ fields, profile, extraData }) {
  const getFieldValue = (key) => {
    // 1. Direct profile value
    if (
      profile?.[key] !== undefined &&
      profile?.[key] !== null &&
      profile?.[key] !== ""
    ) {
      return profile[key];
    }

    // 2. Role-specific data fetched from Supabase
    if (
      extraData?.[key] !== undefined &&
      extraData?.[key] !== null &&
      extraData?.[key] !== ""
    ) {
      return extraData[key];
    }

    // 3. Assessor relationship
    const assessorRel = Array.isArray(profile?.assessor_profiles)
      ? profile.assessor_profiles[0]
      : profile?.assessor_profiles;

    if (
      assessorRel?.[key] !== undefined &&
      assessorRel?.[key] !== null &&
      assessorRel?.[key] !== ""
    ) {
      return assessorRel[key];
    }

    // 4. Trainee relationship
    const traineeRel = Array.isArray(profile?.trainee_profiles)
      ? profile.trainee_profiles[0]
      : profile?.trainee_profiles;

    if (
      traineeRel?.[key] !== undefined &&
      traineeRel?.[key] !== null &&
      traineeRel?.[key] !== ""
    ) {
      return traineeRel[key];
    }

    return "Not provided";
  };

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map(([key, label]) => (
        <div
          key={key}
          className="rounded-lg bg-gray-50 p-3"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </dt>

          <dd className="mt-1 break-words text-sm text-gray-900">
            {getFieldValue(key)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function RegistrationProfileModal({
  profile,
  title = "Profile Details",
  onClose,
  onApprove,
  onReject,
}) {
  // =========================
  // ALL STATE HOOKS FIRST
  // =========================

  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(false);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [extraRoleData, setExtraRoleData] = useState(null);

  // Safe even when profile is null
  const assessor =
    profile?.role?.toLowerCase() === "assessor" ||
    title.toLowerCase().includes("assessor");

  // =========================
  // FETCH ROLE DETAILS
  // =========================

  useEffect(() => {
    // Always clear previous data when modal/profile changes
    setExtraRoleData(null);

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
          "Error fetching role profile details:",
          err
        );
      }
    };

    fetchRoleDetails();
  }, [profile?.id, assessor]);

  // =========================
  // FETCH ASSESSOR DOCUMENTS
  // =========================

  useEffect(() => {
    // Reset documents every time the profile changes
    setDocumentFiles([]);

    if (!profile?.id || !assessor) {
      setLoadingDocs(false);
      return;
    }

    const fetchUserDocuments = async () => {
      setLoadingDocs(true);

      const BUCKET = "verification-docs";
      const userId = profile.id;

      try {
        const subfolders = [
          "accreditation",
          "gov_id",
        ];

        const allFiles = [];

        for (const subfolder of subfolders) {
          const path = `${userId}/${subfolder}`;

          const { data, error } = await supabase.storage
            .from(BUCKET)
            .list(path);

          if (error) {
            console.warn(
              `Unable to list ${path}:`,
              error
            );
            continue;
          }

          if (!data) {
            continue;
          }

          data.forEach((file) => {
            if (
              file.name ===
              ".emptyFolderPlaceholder"
            ) {
              return;
            }

            const filePath =
              `${path}/${file.name}`;

            const { data: urlData } =
              supabase.storage
                .from(BUCKET)
                .getPublicUrl(filePath);

            allFiles.push({
              name: file.name,
              category:
                subfolder === "gov_id"
                  ? "Government ID"
                  : "Accreditation Certificate",
              url:
                urlData?.publicUrl || "",
              path: filePath,
            });
          });
        }

        setDocumentFiles(allFiles);
      } catch (err) {
        console.error(
          "Error fetching documents:",
          err
        );
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchUserDocuments();
  }, [profile?.id, assessor]);

  // =========================
  // RESET MODAL STATE
  // =========================

  useEffect(() => {
    if (!profile) {
      setShowReject(false);
      setReason("");
      setPreviewPhoto(false);
    }
  }, [profile]);

  // =========================
  // IMPORTANT
  // THIS MUST BE AFTER ALL HOOKS
  // =========================

  if (!profile) {
    return null;
  }

  // =========================
  // INITIALS
  // =========================

  const initials = `${
    profile.first_name?.[0] ||
    profile.fullName?.[0] ||
    "?"
  }${
    profile.last_name?.[0] || ""
  }`.toUpperCase();

  // =========================
  // LEGACY DOCUMENTS
  // =========================

  const legacyDocuments = assessor
    ? [
        [
          "TESDA Assessor Accreditation Certificate",
          profile.accreditation_cert_url ||
            extraRoleData?.accreditation_cert_url,
        ],
        [
          "Government-issued ID",
          profile.government_id_url ||
            extraRoleData?.government_id_url,
        ],
      ]
    : [];

  // =========================
  // REJECT
  // =========================

  const handleConfirmReject = () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      return;
    }

    if (onReject) {
      onReject(profile.id, trimmedReason);
    }

    setReason("");
    setShowReject(false);

    if (onClose) {
      onClose();
    }
  };

  // =========================
  // APPROVE
  // =========================

  const handleApprove = () => {
    if (onApprove) {
      onApprove(profile.id);
    }

    if (onClose) {
      onClose();
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

        {/* =========================
            HEADER
        ========================= */}

        <header className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-5">

          <div className="relative group shrink-0">

            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-blue-200 bg-blue-100 text-lg font-bold text-[#002f86]">

              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}

            </div>

            {profile.profile_photo_url && (
              <button
                type="button"
                onClick={() =>
                  setPreviewPhoto(true)
                }
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                title="Click to view full photo"
              >
                <ZoomIn size={18} />
              </button>
            )}

          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>

            <p className="text-sm text-gray-500">
              Registration details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-2xl text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>

        </header>

        {/* =========================
            PREVIOUS REJECTION
        ========================= */}

        {profile.rejected_reason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">

            <span className="mb-1 block font-bold uppercase tracking-wider">
              Previous Rejection Reason:
            </span>

            {profile.rejected_reason}

          </div>
        )}

        {/* =========================
            PERSONAL INFORMATION
        ========================= */}

        <section>
          <h3 className="mb-3 text-lg font-bold text-gray-900">
            Personal Information
          </h3>

          <Details
            fields={personalFields}
            profile={profile}
            extraData={extraRoleData}
          />
        </section>

        {/* =========================
            ROLE INFORMATION
        ========================= */}

        <section className="mt-6">

          <h3 className="mb-3 text-lg font-bold text-gray-900">
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
          />

        </section>

        {/* =========================
            SUPPORTING DOCUMENTS
        ========================= */}

        {assessor && (
          <section className="mt-6">

            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              Supporting Documents
            </h3>

            {loadingDocs ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-6 text-sm text-gray-500">

                <RefreshCw
                  size={16}
                  className="animate-spin text-[#002f86]"
                />

                Fetching documents from storage...

              </div>
            ) : documentFiles.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">

                {documentFiles.map((doc) => (
                  <a
                    key={doc.path}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <div className="flex min-w-0 items-center gap-2">

                      <FileText
                        size={16}
                        className="shrink-0"
                      />

                      <span className="truncate">
                        {doc.category}:{" "}
                        {doc.name}
                      </span>

                    </div>

                    <ExternalLink
                      size={16}
                      className="ml-2 shrink-0"
                    />

                  </a>
                ))}

              </div>
            ) : legacyDocuments.some(
                ([, url]) => Boolean(url)
              ) ? (
              <div className="grid gap-3 sm:grid-cols-2">

                {legacyDocuments.map(
                  ([label, url]) =>
                    url ? (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <span className="truncate">
                          Open {label}
                        </span>

                        <ExternalLink
                          size={16}
                          className="ml-2 shrink-0"
                        />

                      </a>
                    ) : (
                      <div
                        key={label}
                        className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500"
                      >
                        {label}: Not provided
                      </div>
                    )
                )}

              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                No uploaded documents found for this assessor.
              </div>
            )}

          </section>
        )}

        {/* =========================
            FOOTER ACTIONS
        ========================= */}

        <footer className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5">

          {onReject && (
            <button
              type="button"
              onClick={() =>
                setShowReject(true)
              }
              className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
            >
              Reject
            </button>
          )}

          {onApprove && (
            <button
              type="button"
              onClick={handleApprove}
              className="rounded-lg bg-[#002f86] px-4 py-2 font-semibold text-white hover:bg-[#001f59]"
            >
              Approve
            </button>
          )}

        </footer>

        {/* =========================
            PHOTO PREVIEW
        ========================= */}

        {previewPhoto && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4">

            <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-2 shadow-2xl">

              <button
                type="button"
                onClick={() =>
                  setPreviewPhoto(false)
                }
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600"
                aria-label="Close photo preview"
              >
                <X size={18} />
              </button>

              <img
                src={profile.profile_photo_url}
                alt="Profile Full View"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />

            </div>

          </div>
        )}

        {/* =========================
            REJECTION MODAL
        ========================= */}

        {showReject && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <h3 className="text-lg font-bold text-gray-900">
                Reason for Rejection
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Provide a clear reason so the applicant knows what to update or resubmit.
              </p>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                className="mt-3 min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-[#002f86]"
                placeholder="Enter the reason to send to the applicant..."
              />

              <div className="mt-4 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setReason("");
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!reason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
