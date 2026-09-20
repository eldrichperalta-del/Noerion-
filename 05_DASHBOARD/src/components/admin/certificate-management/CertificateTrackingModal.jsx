
import {
  useEffect,
} from "react";

import {
  AlertTriangle,
  X,
} from "lucide-react";

/**
 * ==========================================
 * CERTIFICATE TRACKING MODAL
 * ==========================================
 * Shows verification tracking history/status.
 *
 * Backend-safe:
 * - Handles null certificate data
 * - Handles missing verification date
 * - Handles revoked certificates
 * - Keeps existing ESC/backdrop close behavior
 */

export default function CertificateTrackingModal({
  open,
  certificate,
  onClose,
}) {
  // =========================
  // ESC KEY SUPPORT
  // =========================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEsc = (e) => {
      if (e.key === "Escape") {
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
  }, [open, onClose]);

  // =========================
  // SAFE GUARD
  // =========================

  if (!open || !certificate) {
    return null;
  }

  // =========================
  // SAFE DATA EXTRACTION
  // =========================

  const certificateId =
    certificate?.certificateId ||
    certificate?.certificate_id ||
    certificate?.id ||
    "N/A";

  const traineeName =
    certificate?.traineeName ||
    certificate?.trainee_name ||
    "N/A";

  const qualification =
    certificate?.qualification ||
    "N/A";

  const lastVerificationDate =
    certificate?.lastVerificationDate ||
    null;

  const rawVerificationStatus =
    certificate?.verificationStatus ||
    certificate?.status ||
    "Unknown";

  const verificationStatus =
    String(
      rawVerificationStatus
    ).trim();

  const normalizedStatus =
    verificationStatus.toLowerCase();

  const isRevoked =
    normalizedStatus === "revoked";

  const isVerified =
    normalizedStatus === "verified" ||
    normalizedStatus === "valid";

  // =========================
  // FORMATTED DATE
  // =========================

  const formattedDate =
    lastVerificationDate
      ? new Date(
          lastVerificationDate
        ).toLocaleString()
      : "Never Scanned";

  // =========================
  // STATUS UI
  // =========================

  const statusLabel =
    isRevoked
      ? "Revoked"
      : isVerified
        ? "Verified"
        : verificationStatus ||
          "Unknown";

  const statusClasses =
    isRevoked
      ? "border-red-200 bg-red-50 text-red-700"
      : isVerified
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-gray-200 bg-gray-50 text-gray-600";

  const statusDot =
    isRevoked
      ? "bg-red-500"
      : isVerified
        ? "bg-green-500"
        : "bg-gray-400";

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
    >
      {/* ==================================
          BACKDROP
      =================================== */}

      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ==================================
          MODAL
      =================================== */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-md
          overflow-hidden
          rounded-xl
          bg-white
          shadow-2xl
        "
      >
        {/* ==================================
            HEADER
        =================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            bg-[#15294b]
            px-6
            py-4
            text-white
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <AlertTriangle
              size={20}
              className="text-white"
            />

            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Tracking Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              transition
              hover:text-red-300
            "
            aria-label="Close tracking details"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================
            BODY
        =================================== */}

        <div
          className="
            px-6
            py-6
          "
        >
          {/* ==================================
              CERTIFICATE INFORMATION
          =================================== */}

          <div
            className="
              rounded-lg
              border
              border-gray-200
              bg-gray-50
              p-4
            "
          >
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wider
                text-gray-500
              "
            >
              Certificate
            </p>

            <p
              className="
                mt-1
                font-semibold
                text-gray-900
              "
            >
              {certificateId}
            </p>

            <p
              className="
                mt-3
                text-xs
                font-medium
                uppercase
                tracking-wider
                text-gray-500
              "
            >
              Trainee
            </p>

            <p
              className="
                mt-1
                font-semibold
                text-gray-900
              "
            >
              {traineeName}
            </p>

            <p
              className="
                mt-3
                text-xs
                font-medium
                uppercase
                tracking-wider
                text-gray-500
              "
            >
              Qualification
            </p>

            <p
              className="
                mt-1
                text-sm
                text-gray-700
              "
            >
              {qualification}
            </p>
          </div>

          {/* ==================================
              TRACKING INFORMATION
          =================================== */}

          <div
            className="
              mt-5
              space-y-4
            "
          >
            {/* LAST VERIFICATION CHECK */}

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-900
                "
              >
                Last Verification Check
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-600
                "
              >
                {formattedDate}
              </p>
            </div>

            {/* VERIFICATION STATUS */}

            <div>
              <p
                className="
                  mb-2
                  text-sm
                  font-semibold
                  text-gray-900
                "
              >
                Verification Status
              </p>

              <div
                className={`
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-3
                  py-1.5
                  text-sm
                  font-semibold
                  ${statusClasses}
                `}
              >
                <span
                  className={`
                    h-2
                    w-2
                    rounded-full
                    ${statusDot}
                  `}
                />

                {statusLabel}
              </div>
            </div>
          </div>

          {/* ==================================
              REVOKED WARNING
          =================================== */}

          {isRevoked && (
            <div
              className="
                mt-5
                rounded-lg
                border
                border-red-200
                bg-red-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <AlertTriangle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-red-600
                  "
                />

                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-red-800
                    "
                  >
                    Certificate Permanently Invalidated
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      leading-5
                      text-red-700
                    "
                  >
                    This certificate has been revoked
                    and is no longer considered valid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================
              CLOSE ACTION
          =================================== */}

          <div
            className="
              mt-6
              flex
              justify-end
              border-t
              border-gray-200
              pt-5
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-100
              "
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

