function CreateAssessmentActions({ onBack, onNext, disabledNext }) {
  return (
    <div className="flex justify-end gap-3 mt-6">

      <button
        onClick={onBack}
        className="px-4 py-2 border rounded"
      >
        Back
      </button>

      <button
        onClick={onNext}
        disabled={disabledNext}
        className={`px-4 py-2 text-white rounded ${
          disabledNext ? "bg-gray-400" : "bg-blue-600"
        }`}
      >
        Next
      </button>

    </div>
  );
}

export default CreateAssessmentActions;