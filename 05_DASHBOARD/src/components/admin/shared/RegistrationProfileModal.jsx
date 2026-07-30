import { useState, useEffect } from "react";
import { X, ZoomIn, FileText, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "../../../supabaseClient"; // Adjust path if needed

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

function Details({ fields, profile }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map(([key, label]) => (
        <div key={key} className="rounded-lg bg-gray-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </dt>
          <dd className="mt-1 break-words text-sm text-gray-900">
            {profile[key] || "Not provided"}
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
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(false);

  // Determine if user is an Assessor
  const assessor =
    profile?.role === "assessor" || title.toLowerCase().includes("assessor");

  // Dynamic Supabase Document Fetching State
  const [documentFiles, setDocumentFiles] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    // ONLY fetch documents if the user is an assessor
    if (!profile?.id || !assessor) return;

    const fetchUserDocuments = async () => {
      setLoadingDocs(true);
      const BUCKET = "verification-docs";
      const userId = profile.id;

      try {
        const subfolders = ["accreditation", "gov_id"];
        let allFiles = [];

        for (const subfolder of subfolders) {
          const path = `${userId}/${subfolder}`;
          const { data, error } = await supabase.storage
            .from(BUCKET)
            .list(path);

          if (!error && data) {
            data.forEach((file) => {
              if (file.name !== ".emptyFolderPlaceholder") {
                const filePath = `${path}/${file.name}`;
                const { data: urlData } = supabase.storage
                  .from(BUCKET)
                  .getPublicUrl(filePath);

                allFiles.push({
                  name: file.name,
                  category:
                    subfolder === "gov_id"
                      ? "Government ID"
                      : "Accreditation",
                  url: urlData?.publicUrl,
                  path: filePath,
                });
              }
            });
          }
        }

        setDocumentFiles(allFiles);
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchUserDocuments();
  }, [profile?.id, assessor]);

  if (!profile) return null;

  const initials = `${profile.first_name?.[0] || profile.fullName?.[0] || "?"}${
    profile.last_name?.[0] || ""
  }`;

  // Static fallback documents from profile object if Supabase docs aren't fetched
  const legacyDocuments = assessor
    ? [
        [
          "TESDA Assessor Accreditation Certificate",
          profile.accreditation_cert_url,
        ],
        ["Government-issued ID", profile.government_id_url],
      ]
    : [];

  const handleConfirmReject = () => {
    if (reason.trim()) {
      onReject(profile.id, reason.trim());
      setShowReject(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {/* HEADER */}
        <header className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-5">
          {/* PROFILE PHOTO DISPLAY */}
          <div className="relative group shrink-0">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-blue-100 text-lg font-bold text-[#002f86] border border-blue-200">
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

            {/* Click to Zoom Overlay */}
            {profile.profile_photo_url && (
              <button
                type="button"
                onClick={() => setPreviewPhoto(true)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100 text-white"
                title="Click to view full photo"
              >
                <ZoomIn size={18} />
              </button>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">Registration details</p>
          </div>

          <button
            onClick={onClose}
            className="ml-auto text-2xl text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {/* Existing Rejection Warning */}
        {profile.rejected_reason && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <span className="font-bold uppercase tracking-wider block mb-1">
              Previous Rejection Reason:
            </span>
            {profile.rejected_reason}
          </div>
        )}

        {/* PERSONAL INFORMATION SECTION */}
        <section>
          <h3 className="mb-3 text-lg font-bold text-gray-900">
            Personal Information
          </h3>
          <Details fields={personalFields} profile={profile} />
        </section>

        {/* PROFESSIONAL / TRAINING INFORMATION SECTION */}
        <section className="mt-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">
            {assessor ? "Professional Information" : "Training Information"}
          </h3>
          <Details
            fields={assessor ? assessorFields : traineeFields}
            profile={profile}
          />
        </section>

        {/* SUPPORTING DOCUMENTS SECTION (ONLY SHOWS FOR ASSESSOR) */}
        {assessor && (
          <section className="mt-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900 flex items-center gap-2">
              Supporting Documents
            </h3>

            {loadingDocs ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 rounded-lg bg-gray-50">
                <RefreshCw size={16} className="animate-spin text-[#002f86]" />
                Fetching documents from storage...
              </div>
            ) : documentFiles.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {documentFiles.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={16} className="shrink-0" />
                      <span className="truncate">
                        {doc.category}: {doc.name}
                      </span>
                    </div>
                    <ExternalLink size={16} className="shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            ) : legacyDocuments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {legacyDocuments.map(([label, url]) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Open {label}
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

        {/* FOOTER / ACTION CONTROLS */}
        <footer className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            onClick={() => setShowReject(true)}
            className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
          >
            Reject
          </button>
          <button
            onClick={() => {
              onApprove(profile.id);
              onClose();
            }}
            className="rounded-lg bg-[#002f86] px-4 py-2 font-semibold text-white hover:bg-[#001f59]"
          >
            Approve
          </button>
        </footer>

        {/* FULL IMAGE ZOOM MODAL */}
        {previewPhoto && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4">
            <div className="relative max-w-lg w-full rounded-2xl bg-slate-900 p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => setPreviewPhoto(false)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600"
              >
                <X size={18} />
              </button>
              <img
                src={profile.profile_photo_url}
                alt="Profile Full View"
                className="max-h-[80vh] w-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* REJECTION REASON MODAL */}
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
                onChange={(event) => setReason(event.target.value)}
                className="mt-3 min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-[#002f86]"
                placeholder="Enter the reason to send to the applicant..."
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowReject(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
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