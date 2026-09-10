import {
  Briefcase,
  Building2,
  FileText,
  IdCard,
  ImagePlus,
  Upload,
  UserRound,
  X,
} from "lucide-react";

function ProfessionalInformationForm({
  professionalData,
  onChange,
  photoPreview,
  photoInputKey,
  onPhotoChange,
  onRemovePhoto,
  accreditationFile,
  governmentIdFile,
  onAccreditationChange,
  onGovernmentIdChange,
  onBack,
  onCancel,
  onNext,
  isStepTwoComplete,
}) {
  return (
    <div className="w-full max-w-[820px] rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#15294b]">
          Step 2: Professional Information
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Enter the assessor's professional information and upload
          the required verification documents.
        </p>
      </div>

      {/* ======================================================
          TESDA ASSESSOR ID
      ====================================================== */}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          TESDA Assessor ID Number *
        </label>

        <div className="relative">
          <IdCard
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            name="assessorId"
            value={
              professionalData.assessorId
            }
            onChange={
              onChange
            }
            placeholder="Enter TESDA Assessor ID Number"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-3
              pl-10
              pr-4
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ======================================================
          ASSESSMENT CENTER
      ====================================================== */}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Assessment Center / Training Institution *
        </label>

        <div className="relative">
          <Building2
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            name="assessmentCenter"
            value={
              professionalData.assessmentCenter
            }
            onChange={
              onChange
            }
            placeholder="Enter assessment center"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-3
              pl-10
              pr-4
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ======================================================
          SPECIALIZATION
      ====================================================== */}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Qualification / Specialization *
        </label>

        <div className="relative">
          <Briefcase
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            name="specialization"
            value={
              professionalData.specialization
            }
            onChange={
              onChange
            }
            placeholder="Enter qualification or specialization"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-3
              pl-10
              pr-4
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ======================================================
          YEARS OF EXPERIENCE
      ====================================================== */}

      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Years of Experience

          <span className="ml-1 text-xs font-normal text-gray-400">
            (Optional)
          </span>
        </label>

        <div className="relative">
          <Briefcase
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="number"
            min="0"
            name="experience"
            value={
              professionalData.experience
            }
            onChange={
              onChange
            }
            placeholder="Enter years of experience"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              py-3
              pl-10
              pr-4
              outline-none
              transition
              focus:border-[#15294b]
              focus:ring-2
              focus:ring-[#15294b]/20
            "
          />
        </div>
      </div>

      {/* ======================================================
          PROFILE PHOTO
      ====================================================== */}

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-[#15294b]">
          Profile Photo
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Upload a recent formal ID photo of the assessor.
        </p>

        <label className="relative mt-4 flex min-h-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#15294b]/30 bg-blue-50/40 p-5 text-center transition hover:border-[#15294b]/60 hover:bg-blue-50">

          <input
            key={
              photoInputKey
            }
            type="file"
            accept="image/jpeg,image/png"
            onChange={
              onPhotoChange
            }
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          {photoPreview ? (
            <>
              <img
                src={
                  photoPreview
                }
                alt="Selected profile"
                className="h-32 w-32 rounded-xl border-2 border-[#15294b] object-cover shadow-md"
              />

              <button
                type="button"
                onClick={(
                  event
                ) => {
                  event.preventDefault();

                  event.stopPropagation();

                  onRemovePhoto();
                }}
                className="
                  absolute
                  right-4
                  top-4
                  grid
                  h-9
                  w-9
                  place-items-center
                  rounded-full
                  bg-red-600
                  text-white
                  shadow-lg
                  transition
                  hover:bg-red-700
                "
                aria-label="Remove selected profile photo"
              >
                <X
                  size={18}
                />
              </button>
            </>
          ) : (
            <div>
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#15294b] text-white">
                <ImagePlus
                  size={22}
                />
              </div>

              <span className="block text-sm font-bold text-[#15294b]">
                Upload Recent 2×2 Formal ID Photo *
              </span>

              <span className="mt-1 block text-xs text-gray-500">
                Accepted formats: JPG, PNG
              </span>

              <span className="mt-1 block text-xs text-gray-400">
                Maximum file size: 5 MB
              </span>
            </div>
          )}
        </label>
      </div>

      {/* ======================================================
          SUPPORTING DOCUMENTS
      ====================================================== */}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-bold text-[#15294b]">
          Supporting Documents
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Upload the assessor's verification documents.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          {/* ==================================================
              ACCREDITATION
          ================================================== */}

          <DocumentUpload
            label="TESDA Assessor Accreditation Certificate"
            required={true}
            file={
              accreditationFile
            }
            onChange={
              onAccreditationChange
            }
          />

          {/* ==================================================
              GOVERNMENT ID
          ================================================== */}

          <DocumentUpload
            label="Government-issued ID"
            required={false}
            file={
              governmentIdFile
            }
            onChange={
              onGovernmentIdChange
            }
          />

        </div>
      </div>

      {/* ======================================================
          BUTTONS
      ====================================================== */}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-200 pt-5">

        {/* LEFT BUTTONS */}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={
              onBack
            }
            className="
              rounded-lg
              border
              border-gray-300
              px-5
              py-2.5
              text-sm
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-100
            "
          >
            Back
          </button>

          <button
            type="button"
            onClick={
              onCancel
            }
            className="
              rounded-lg
              border
              border-red-200
              px-5
              py-2.5
              text-sm
              font-semibold
              text-red-600
              transition
              hover:bg-red-50
            "
          >
            Cancel
          </button>
        </div>

        {/* NEXT */}

        <button
          type="button"
          onClick={
            onNext
          }
          disabled={
            !isStepTwoComplete
          }
          className={`
            rounded-lg
            px-6
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition

            ${
              isStepTwoComplete
                ? `
                  bg-[#15294b]
                  hover:bg-[#0f1f3b]
                `
                : `
                  cursor-not-allowed
                  bg-gray-400
                `
            }
          `}
        >
          Next
        </button>
      </div>

    </div>
  );
}

// ============================================================
// DOCUMENT UPLOAD COMPONENT
// ============================================================

function DocumentUpload({
  label,
  required,
  file,
  onChange,
}) {
  return (
    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-[#15294b]/50 hover:bg-blue-50">

      {/* LABEL */}

      <span className="block text-sm font-semibold text-[#15294b]">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      {/* INFORMATION */}

      <span className="mt-2 block text-xs text-gray-500">
        PDF, JPG, or PNG
      </span>

      <span className="block text-xs text-gray-400">
        Maximum file size: 10 MB
      </span>

      {/* FILE */}

      <div className="mt-4 flex items-center gap-2 text-sm text-[#15294b]">
        <Upload
          size={17}
        />

        <span className="max-w-[220px] truncate font-medium">
          {file
            ? file.name
            : "Choose File"}
        </span>
      </div>

      {/* INPUT */}

      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={
          onChange
        }
        className="hidden"
      />

      {/* FILE SELECTED */}

      {file && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
          <FileText
            size={15}
          />

          Document selected
        </div>
      )}

    </label>
  );
}

export default ProfessionalInformationForm;