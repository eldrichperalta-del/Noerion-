export default function ViewAIAnalysisButton({
  onClick,
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // This button serves as the navigation trigger to the
  // "AI Analysis & Insights" page.
  //
  // Frontend:
  // Receives an onClick handler from the parent component.
  //
  // Backend:
  // Ensure the AI analysis data has been generated and is
  // available before navigating to the AI Analysis page.
  // ==========================================================

  return (
    <div className="flex h-full items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className="
          w-full
          rounded-lg
          bg-blue-900 
          hover:bg-blue-950
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          transition-all
          duration-200
          hover:shadow-md
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:ring-offset-2
        "
      >
        View AI Analysis
      </button>
    </div>
  );
}