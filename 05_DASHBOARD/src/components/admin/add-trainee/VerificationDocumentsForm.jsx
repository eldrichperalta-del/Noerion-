
import React from "react";
import { ImagePlus, Upload, UserRound, X } from "lucide-react";

function VerificationDocumentsForm({
  photoPreview,
  photoInputKey,
  onPhotoChange,
  onRemovePhoto,
  onBack,
  onCancel,
  onNext,
  isStepThreeComplete,
}) {
  return (
    <div className="w-full max-w-[860px] rounded-xl bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#15294b]">
          Step 3: Verification Documents
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Upload the required documents to complete the trainee registration.
        </p>
      </div>

      {/* Profile Photo */}
      <div>
        <div className="mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#15294b]">
            <UserRound size={17} />
            Profile Photo <span className="text-red-500">*</span>
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Upload a recent formal ID photo of the trainee.
          </p>
        </div>

        <div className="relative">
          <input
            key={photoInputKey}
            id="trainee-profile-photo"
            type="file"
            accept="image/jpeg,image/png"
            onChange={onPhotoChange}
            className="hidden"
          />

          <label
            htmlFor="trainee-profile-photo"
            className={`flex min-h-[190px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition ${photoPreview
                ? "border-blue-300 bg-blue-50/30"
                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
          >
            {photoPreview ? (
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Trainee profile preview"
                    className="h-32 w-32 rounded-lg border border-gray-200 object-cover shadow-sm"
                  />

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onRemovePhoto();
                    }}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600"
                    aria-label="Remove profile photo"
                  >
                    <X size={14} />
                  </button>
                </div>

                <p className="mt-3 text-xs font-medium text-[#15294b]">
                  Profile photo selected
                </p>

                <p className="mt-1 text-[11px] text-gray-500">
                  Click to replace the photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-[#15294b]">
                  <ImagePlus size={23} />
                </div>

                <p className="text-sm font-semibold text-[#15294b]">
                  Upload Recent 2×2 Formal ID Photo{" "}
                  <span className="text-red-500">*</span>
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  JPG or PNG
                </p>

                <p className="mt-1 text-[11px] text-gray-400">
                  Maximum file size: 5 MB
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-[#15294b] shadow-sm">
                  <Upload size={14} />
                  Choose Photo
                </span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Required Information Note */}
      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs leading-5 text-[#15294b]">
          <span className="font-semibold">Required:</span> A recent formal
          2×2 trainee profile photo in JPG or PNG format, with a maximum file
          size of 5 MB.
        </p>
      </div>

      
      {/* Actions */}
      <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">

        {/* BACK */}
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back
        </button>

        {/* COMPLETE REGISTRATION */}
        <button
          type="button"
          onClick={onNext}
          disabled={!isStepThreeComplete}
          className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition ${isStepThreeComplete
              ? "bg-[#15294b] hover:bg-[#0f203d]"
              : "cursor-not-allowed bg-gray-300"
            }`}
        >
          Complete Registration
        </button>

      </div>
      

    </div>
  );
}

export default VerificationDocumentsForm;

