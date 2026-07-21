import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function FinalizeEvaluationButton({
  validated,
  overrideMode,
  isSubmitting = false,
  onBack,
  onFinalize,
}) {

  return (
    <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ready to Finalize?
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Please verify the answers, AI insights, and remarks before
            submitting the written assessment.
          </p>
        </div>

        {/* Right */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            type="button"
            disabled={(!validated && !overrideMode) || isSubmitting}
            onClick={onFinalize}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all ${
                validated || overrideMode
                ? "bg-[#002f86] hover:bg-[#001f63] shadow-lg"
                : "cursor-not-allowed bg-gray-300"
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Finalize Evaluation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}