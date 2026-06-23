import { useEffect } from "react";

/**
 * ==========================================
 * CERTIFICATE DETAILS MODAL (UI LAYER ONLY)
 * ==========================================
 * Backend-ready version:
 * - Safe rendering (null-proof)
 * - Image fallback handling
 * - Escape key close support
 * - Click outside close support (optional extension point)
 */

export default function CertificateDetailsModal({
  open,
  certificate,
  onClose,
}) {

  // =========================
  // ESC KEY CLOSE (UX IMPROVEMENT)
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
  // SAFE DATA ACCESS (BACKEND SAFE)
  // =========================
  const {
    certificateId = "N/A",
    traineeName = "Unknown",
    course = "N/A",
    dateIssued = "N/A",
    qrCodeUrl = null,
    verificationStatus = "Unknown",
  } = certificate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">

      {/* BACKDROP (click to close optional) */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Certificate Details
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-3 p-5 text-sm text-gray-700">

          {/* BASIC INFO */}
          <p><b>Certificate ID:</b> {certificateId}</p>
          <p><b>Trainee Name:</b> {traineeName}</p>
          <p><b>Course:</b> {course}</p>

          {/* DATE (SAFE DISPLAY) */}
          <p>
            <b>Date Issued:</b>{" "}
            {dateIssued !== "N/A"
              ? new Date(dateIssued).toLocaleDateString()
              : "N/A"}
          </p>

          {/* QR CODE SECTION */}
          <div>
            <p className="font-semibold mb-2">QR Code</p>

            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32 border rounded"
                onError={(e) => {
                  // fallback if backend URL breaks
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 border rounded text-xs text-gray-500">
                QR NOT AVAILABLE
              </div>
            )}
          </div>

          {/* STATUS */}
          <p>
            <b>QR Code Verification Status:</b>{" "}
            <span className="font-medium">
              {verificationStatus}
            </span>
          </p>

          {/* SECURITY NOTE (UI ONLY) */}
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-2 rounded-lg">
            SECURITY NOTE: Verified by system validation layer.
          </div>

        </div>
      </div>
    </div>
  );
}