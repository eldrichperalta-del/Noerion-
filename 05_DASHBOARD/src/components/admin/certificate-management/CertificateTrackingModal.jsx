import { useEffect } from "react";

/**
 * ==========================================
 * CERTIFICATE TRACKING MODAL (BACKEND READY)
 * ==========================================
 * Shows verification tracking history/status.
 * Safe for real API data (null-safe + formatted).
 */

export default function CertificateTrackingModal({
  open,
  certificate,
  onClose,
}) {

  // =========================
  // ESC KEY SUPPORT (UX STANDARD)
  // =========================
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // =========================
  // SAFE GUARD
  // =========================
  if (!open || !certificate) return null;

  // =========================
  // SAFE DATA EXTRACTION
  // =========================
  const {
    lastVerificationDate = null,
    verificationStatus = "Unknown",
  } = certificate;

  // =========================
  // FORMATTED DATE (BACKEND SAFE)
  // =========================
  const formattedDate =
    lastVerificationDate
      ? new Date(lastVerificationDate).toLocaleString()
      : "Never Scanned";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">

      {/* BACKDROP CLICK CLOSE */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Tracking Details
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-4 p-5 text-sm text-gray-700">

          {/* LAST CHECK */}
          <div>
            <p className="font-semibold">Last Verification Check</p>
            <p className="text-gray-600">
              {formattedDate}
            </p>
          </div>

          {/* STATUS */}
          <div>
            <p className="font-semibold">Verification Status</p>

            <span
              className={`font-medium ${
                verificationStatus === "Verified"
                  ? "text-green-600"
                  : verificationStatus === "Never Scanned"
                  ? "text-gray-500"
                  : "text-red-500"
              }`}
            >
              {verificationStatus}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}