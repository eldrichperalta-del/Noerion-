import { useEffect, useState } from "react";

import QRCode from "qrcode";

/**
 * ==========================================
 * CERTIFICATE DETAILS MODAL
 * ==========================================
 *
 * Generates a QR code dynamically from the
 * certificate verification URL.
 *
 * UI remains unchanged.
 */

export default function CertificateDetailsModal({
  open,
  certificate,
  certificates = [],
  onClose,
  onPrevious,
  onNext,
}) {
  // =========================
  // QR CODE STATE
  // =========================

  const [
    generatedQrCode,
    setGeneratedQrCode,
  ] = useState(null);

  // =========================
  // VERIFICATION URL
  // =========================

  const certificateId =
    certificate?.certificateId;

  const verificationUrl =
    certificateId
      ? `${window.location.origin}/verify-certificate/${encodeURIComponent(
          certificateId
        )}`
      : "";

  // =========================
  // CURRENT CERTIFICATE INDEX
  // =========================

  const currentIndex =
    certificates.findIndex(
      (item) =>
        item.certificateId ===
        certificate?.certificateId
    );

  const totalCertificates =
    certificates.length;

  const hasPrevious =
    currentIndex > 0;

  const hasNext =
    currentIndex !== -1 &&
    currentIndex <
      totalCertificates - 1;

  // =========================
  // ESC KEY CLOSE
  // =========================

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleEsc
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, [
    open,
    onClose,
  ]);

  // =========================
  // GENERATE QR CODE
  // =========================

  useEffect(() => {
    if (
      !open ||
      !certificate ||
      !certificateId
    ) {
      setGeneratedQrCode(null);
      return;
    }

    const generateQrCode =
      async () => {
        try {
          const qrDataUrl =
            await QRCode.toDataURL(
              verificationUrl,
              {
                width: 300,
                margin: 2,
                errorCorrectionLevel: "H",
              }
            );

          setGeneratedQrCode(
            qrDataUrl
          );
        } catch (error) {
          console.error(
            "QR generation failed:",
            error
          );

          setGeneratedQrCode(null);
        }
      };

    generateQrCode();
  }, [
    open,
    certificate,
    certificateId,
    verificationUrl,
  ]);

  // =========================
  // SAFE GUARD
  // =========================

  if (
    !open ||
    !certificate
  ) {
    return null;
  }

  // =========================
  // SAFE DATA ACCESS
  // =========================

  const {
    traineeName = "Unknown",
    course = "N/A",
    dateIssued = "N/A",
    verificationStatus = "Unknown",
    status,
  } = certificate;

  // =========================
  // STATUS
  // =========================

  const displayStatus =
    status ||
    verificationStatus ||
    "Valid";

  // =========================
  // PREVIOUS
  // =========================

  const handlePrevious = () => {
    if (
      !hasPrevious ||
      !onPrevious
    ) {
      return;
    }

    onPrevious();
  };

  // =========================
  // NEXT
  // =========================

  const handleNext = () => {
    if (
      !hasNext ||
      !onNext
    ) {
      return;
    }

    onNext();
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* ========================= */}
      {/* BACKDROP */}
      {/* ========================= */}

      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* ========================= */}
      {/* MODAL */}
      {/* ========================= */}

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="flex items-center justify-between bg-[#15294b] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <svg
              className="h-7 w-7 text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            <h2 className="text-xl font-bold">
              Certificate Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-2xl leading-none text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* ========================= */}
        {/* BODY */}
        {/* ========================= */}

        <div className="flex gap-8 bg-[#f4f7fa] p-8">
          {/* ========================= */}
          {/* LEFT PANEL */}
          {/* ========================= */}

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#73829c]">
                Data Overview
              </h3>

              <svg
                className="h-5 w-5 text-[#97a3b6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            {/* CERTIFICATE ID */}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="block text-xs font-medium text-[#73829c]">
                Certificate ID
              </label>

              <div className="mt-1 text-base font-semibold text-[#15294b]">
                {certificateId || "N/A"}
              </div>
            </div>

            {/* TRAINEE */}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="block text-xs font-medium text-[#73829c]">
                Trainee
              </label>

              <div className="mt-1 text-base font-semibold text-[#15294b]">
                {traineeName}
              </div>
            </div>

            {/* COURSE */}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="block text-xs font-medium text-[#73829c]">
                Course
              </label>

              <div className="mt-1 text-base font-semibold text-[#15294b]">
                {course}
              </div>
            </div>

            {/* DATE ISSUED */}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="block text-xs font-medium text-[#73829c]">
                Date Issued
              </label>

              <div className="mt-1 text-base font-semibold text-[#15294b]">
                {dateIssued !== "N/A"
                  ? new Date(
                      dateIssued
                    ).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>

            {/* ========================= */}
            {/* VALIDITY */}
            {/* ========================= */}

            <div className="flex items-center justify-between pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#73829c]">
                Validity Confirmation
              </h3>

              <svg
                className="h-6 w-6 text-[#97a3b6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            {/* STATUS */}

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-[#35c17d]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    fill="#35c17d"
                    fillOpacity={0.2}
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="#35c17d"
                  />
                </svg>

                <span className="text-base font-medium text-[#15294b]">
                  Issuance Status:
                </span>
              </div>

              <div className="rounded-full bg-[#e9f8f1] px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-[#35c17d]">
                {displayStatus}
              </div>
            </div>
          </div>

          {/* ========================= */}
          {/* RIGHT PANEL */}
          {/* ========================= */}

          <div className="flex w-[380px] flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
            <div className="mb-8 flex w-full items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#73829c]">
                Verification
              </h3>

              <svg
                className="h-6 w-6 text-[#97a3b6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <p className="mb-1 text-center text-sm font-semibold text-[#15294b]">
              EXTERNAL LINK VERIFICATION
            </p>

            {/* QR CODE */}

            <div className="mt-4 rounded-2xl border-2 border-dashed border-[#dce3ea] bg-[#f9fafb] p-4">
              {generatedQrCode ? (
                <img
                  src={generatedQrCode}
                  alt="Certificate verification QR Code"
                  className="block h-56 w-56 rounded-lg"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded border border-gray-300 bg-gray-100 text-xs text-gray-500">
                  Generating QR...
                </div>
              )}
            </div>

            {/* ========================= */}
            {/* CLICKABLE URL */}
            {/* ========================= */}

            {verificationUrl && (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 break-all text-center text-sm font-semibold text-[#15294b] underline decoration-[#15294b] underline-offset-4 hover:text-blue-600"
                title="Open certificate verification page"
              >
                {verificationUrl}
              </a>
            )}

            {/* DESCRIPTION */}

            <p className="mt-6 text-center text-xs leading-relaxed text-[#73829c]">
              This QR code provides a direct link to the
              central authority&apos;s secure digital record
              for this single certificate instance. Any
              tampering will be flagged during the check.
            </p>
          </div>
        </div>

        {/* ========================= */}
        {/* FOOTER */}
        {/* ========================= */}

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-8 py-5">
          <div className="text-xs font-medium text-[#97a3b6]">
            {currentIndex >= 0
              ? `Showing ${currentIndex + 1}-${totalCertificates} of ${totalCertificates}`
              : `Showing 0 of ${totalCertificates}`}
          </div>

          <div className="flex gap-2">
            {/* PREVIOUS */}

            <button
              type="button"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${
                hasPrevious
                  ? "border-black text-black hover:bg-gray-100"
                  : "cursor-not-allowed border-gray-200 text-gray-300"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>

              Prev
            </button>

            {/* CURRENT PAGE */}

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-xs font-bold text-[#15294b]"
            >
              {currentIndex >= 0
                ? currentIndex + 1
                : 1}
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${
                hasNext
                  ? "border-black text-black hover:bg-gray-100"
                  : "cursor-not-allowed border-gray-200 text-gray-300"
              }`}
            >
              Next

              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}