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
  ["training_center", "Training Center / TVET Institution", School],
  ["nc_level", "NC Level", Layers3],
  ["qualification_course", "Qualification / Course", Briefcase],
  ["batch", "Batch (Optional)", ListRestart],
];

const assessorFields = [
  ["assessor_id_number", "TESDA Assessor ID Number", IdCard],
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

function Details({
  fields,
  profile,
  extraData,
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

    const assessorRel =
      Array.isArray(
        profile?.assessor_profiles
      )
        ? profile.assessor_profiles[0]
        : profile?.assessor_profiles;

    if (
      assessorRel?.[key] !== undefined &&
      assessorRel?.[key] !== null &&
      assessorRel?.[key] !== ""
    ) {
      return assessorRel[key];
    }

    const traineeRel =
      Array.isArray(
        profile?.trainee_profiles
      )
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
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {fields.map(
        ([key, label, Icon]) => (
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

            <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">
              {getFieldValue(key)}
            </dd>
          </div>
        )
      )}
    </dl>
  );
}

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

  const assessor =
    profile?.role?.toLowerCase() ===
      "assessor" ||
    title
      .toLowerCase()
      .includes("assessor");

  useEffect(() => {
    setExtraRoleData(null);
    setShowReject(false);
    setReason("");
    setPreviewPhoto(false);

    if (!profile?.id) {
      return;
    }

    const fetchRoleDetails = async () => {
      try {
        const table =
          assessor
            ? "assessor_profiles"
            : "trainee_profiles";

        const { data, error } =
          await supabase
            .from(table)
            .select("*")
            .eq(
              "user_id",
              profile.id
            )
            .maybeSingle();

        if (error) {
          console.error(
            `Error fetching ${table}:`,
            error
          );

          return;
        }

        setExtraRoleData(
          data ?? null
        );
      } catch (err) {
        console.error(
          "Error fetching role details:",
          err
        );
      }
    };

    fetchRoleDetails();
  }, [
    profile?.id,
    assessor,
  ]);

  useEffect(() => {
    setDocumentFiles([]);

    if (
      !profile?.id ||
      !assessor
    ) {
      setLoadingDocs(false);
      return;
    }

    const fetchUserDocuments =
      async () => {
        setLoadingDocs(true);

        const BUCKET =
          "verification-docs";

        try {
          const subfolders = [
            "accreditation",
            "gov_id",
          ];

          const allFiles = [];

          for (
            const subfolder of subfolders
          ) {
            const path =
              `${profile.id}/${subfolder}`;

            const {
              data,
              error,
            } =
              await supabase.storage
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

            data.forEach(
              (file) => {
                if (
                  file.name ===
                  ".emptyFolderPlaceholder"
                ) {
                  return;
                }

                const filePath =
                  `${path}/${file.name}`;

                const {
                  data: urlData,
                } =
                  supabase.storage
                    .from(BUCKET)
                    .getPublicUrl(
                      filePath
                    );

                allFiles.push({
                  name:
                    file.name,

                  category:
                    subfolder ===
                    "gov_id"
                      ? "Government ID"
                      : "Accreditation Certificate",

                  url:
                    urlData?.publicUrl ||
                    "",

                  path:
                    filePath,
                });
              }
            );
          }

          setDocumentFiles(
            allFiles
          );
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
  }, [
    profile?.id,
    assessor,
  ]);

  if (!profile) {
    return null;
  }

  const initials =
    `${profile.first_name?.[0] ||
      profile.fullName?.[0] ||
      "?"}${profile.last_name?.[0] ||
      ""}`.toUpperCase();

  const normalizedStatus =
    String(
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

  const legacyDocuments =
    assessor
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

    setReason("");
    setShowReject(false);
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(
        profile.id
      );
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious && onPrevious) {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (canGoNext && onNext) {
      onNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
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
          <div className="mb-8 flex items-center gap-5 border-b border-[#e5e7eb] pb-6">
            <div className="group relative shrink-0">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#f1f5f9] text-3xl font-bold text-[#15294b] shadow-inner">
                {profile.profile_photo_url ? (
                  <img
                    src={
                      profile.profile_photo_url
                    }
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
                >
                  <ZoomIn size={18} />
                </button>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#111827]">
                {profile.fullName ||
                  `${profile.first_name || ""} ${profile.last_name || ""}`}
              </h2>

              <p className="text-sm text-[#6b7280]">
                Registration details
              </p>
            </div>
          </div>

          {profile.rejected_reason && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <span className="mb-1 block font-bold uppercase tracking-wider">
                Previous Rejection Reason:
              </span>

              {profile.rejected_reason}
            </div>
          )}

          <section>
            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              Personal Information
            </h3>

            <Details
              fields={
                personalFields
              }
              profile={
                profile
              }
              extraData={
                extraRoleData
              }
            />
          </section>

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
              profile={
                profile
              }
              extraData={
                extraRoleData
              }
            />
          </section>

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

                  Fetching documents from storage...
                </div>
              ) : documentFiles.length >
                0 ? (
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {documentFiles.map(
                    (doc) => (
                      <div
                        key={
                          doc.path
                        }
                        className="flex flex-col gap-1"
                      >
                        <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                          {
                            doc.category
                          }
                        </dt>

                        <a
                          href={
                            doc.url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm font-semibold text-[#111827] transition hover:border-[#15294b] hover:bg-blue-50"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText
                              size={
                                16
                              }
                              className="shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                            />

                            <span className="truncate">
                              {
                                doc.name
                              }
                            </span>
                          </div>

                          <ExternalLink
                            size={
                              16
                            }
                            className="ml-2 shrink-0 text-[#9ca3af] group-hover:text-[#15294b]"
                          />
                        </a>
                      </div>
                    )
                  )}
                </div>
              ) : legacyDocuments.some(
                  ([, url]) =>
                    Boolean(
                      url
                    )
                ) ? (
                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {legacyDocuments.map(
                    (
                      [
                        label,
                        url,
                      ]
                    ) =>
                      url ? (
                        <div
                          key={
                            label
                          }
                          className="flex flex-col gap-1"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                            {
                              label
                            }
                          </dt>

                          <a
                            href={
                              url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm font-semibold text-[#111827] transition hover:border-[#15294b] hover:bg-blue-50"
                          >
                            <span className="truncate">
                              View
                              Document
                            </span>

                            <ExternalLink
                              size={
                                16
                              }
                            />
                          </a>
                        </div>
                      ) : (
                        <div
                          key={
                            label
                          }
                          className="flex flex-col gap-1"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                            {
                              label
                            }
                          </dt>

                          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
                            Not
                            provided
                          </div>
                        </div>
                      )
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-6 text-center text-sm text-[#6b7280]">
                  No uploaded
                  documents found for
                  this assessor.
                </div>
              )}
            </section>
          )}

          <footer className="mt-12 flex items-center justify-between gap-4 border-t border-[#e5e7eb] pt-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  handlePrevious
                }
                disabled={
                  !canGoPrevious
                }
                className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={16}
                />

                Prev
              </button>

              <span className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#15294b] shadow-sm">
                {currentNumber}
                {" / "}
                {totalProfiles}
              </span>

              <button
                type="button"
                onClick={
                  handleNext
                }
                disabled={
                  !canGoNext
                }
                className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next

                <ChevronRight
                  size={16}
                />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isApproved && (
                <span className="rounded-lg bg-green-100 px-5 py-2.5 text-sm font-semibold text-green-700">
                  Approved
                </span>
              )}

              {isRejected && (
                <span className="rounded-lg bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-700">
                  Rejected
                </span>
              )}

              {isDeactivated && (
                <span className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700">
                  Deactivated
                </span>
              )}

              {!isFinalStatus &&
                onReject && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowReject(
                        true
                      )
                    }
                    className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    Reject
                  </button>
                )}

              {!isFinalStatus &&
                onApprove && (
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
            </div>
          </footer>
        </div>

        {previewPhoto && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-2 shadow-2xl">
              <button
                type="button"
                onClick={() =>
                  setPreviewPhoto(
                    false
                  )
                }
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
              >
                <X size={18} />
              </button>

              <img
                src={
                  profile.profile_photo_url
                }
                alt="Profile Full View"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {showReject && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">
                Reason for
                Rejection
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Provide a clear reason
                so the applicant knows
                what to update or
                resubmit.
              </p>

              <textarea
                value={
                  reason
                }
                onChange={(
                  event
                ) =>
                  setReason(
                    event.target.value
                  )
                }
                className="mt-3 min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#15294b]"
                placeholder="Enter the reason to send to the applicant..."
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(
                      false
                    );

                    setReason("");
                  }}
                  className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#111827] transition hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleConfirmReject
                  }
                  disabled={
                    !reason.trim()
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm
                  Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}