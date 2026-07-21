

export default function ProceedDecisionButton({
    onClick,
}) {
    // ==========================================================
    // BACKEND HANDOFF:
    // This button proceeds to the Finalize Evaluation page.
    //
    // The backend may perform validation before allowing
    // navigation if required.
    // ==========================================================

    return (
        <div className="flex justify-center pt-2 pb-6">
            <button
                onClick={onClick}
                className="inline-flex items-center gap-3 rounded-lg bg-blue-900 hover:bg-blue-950 px-8 py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
                Proceed to Final Decision

              
            </button>
        </div>
    );
}