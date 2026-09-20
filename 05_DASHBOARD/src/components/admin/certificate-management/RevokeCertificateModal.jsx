import {
  AlertTriangle,
  X,
} from "lucide-react";

export default function RevokeCertificateModal({
  open,
  certificate,
  onClose,
  onRevoke,
}) {
  if (!open || !certificate) {
    return null;
  }

  const certificateId =
    certificate?.certificateId ||
    certificate?.certificate_id ||
    certificate?.id ||
    "N/A";

  const traineeName =
    certificate?.traineeName ||
    certificate?.trainee_name ||
    "N/A";

  const traineeEmail =
    certificate?.email ||
    certificate?.traineeEmail ||
    certificate?.trainee_email ||
    null;

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
      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-xl
          bg-white
          shadow-2xl
        "
      >
        {/* ==================================
            MODAL HEADER
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
              Confirmation
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              transition
              hover:text-red-300
            "
            aria-label="Close confirmation dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================
            MODAL CONTENT
        =================================== */}

        <div
          className="
            px-6
            py-6
          "
        >
          <h3
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >
            Revoke Certificate?
          </h3>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-gray-600
            "
          >
            This certificate will be revoked and
            will no longer be considered valid.
          </p>

          {/* ==================================
              CERTIFICATE DETAILS
          =================================== */}

          <div
            className="
              mt-5
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

            {traineeEmail && (
              <p
                className="
                  mt-1
                  text-sm
                  text-gray-600
                "
              >
                {traineeEmail}
              </p>
            )}
          </div>

          {/* ==================================
              MODAL ACTIONS
          =================================== */}

          <div
            className="
              mt-6
              flex
              justify-end
              gap-3
              border-t
              border-gray-200
              pt-5
            "
          >
            {/* CANCEL */}

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
              Cancel
            </button>

            {/* REVOKE */}

            <button
              type="button"
              onClick={() => onRevoke?.(certificate)}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                bg-red-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-red-700
              "
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

