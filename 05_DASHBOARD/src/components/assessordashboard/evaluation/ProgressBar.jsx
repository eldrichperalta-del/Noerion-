// ============================================================================
// ProgressBar Component
// ----------------------------------------------------------------------------
// Displays the evaluation completion progress for a course.
//
// Props:
// - value (Number)
//     Completion percentage (0 - 100)
//
// BACKEND HANDOFF:
// The backend should NOT store this percentage.
// Instead calculate:
//
// progressPercentage =
// (completedEvaluations / totalTrainees) * 100
//
// Then pass the computed value into this component.
// ============================================================================

export default function ProgressBar({ value }) {
  // Prevent invalid values
  const progress = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-green-500 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}