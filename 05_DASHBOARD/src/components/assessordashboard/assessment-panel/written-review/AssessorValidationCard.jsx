import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function AssessorValidationCard({
  validated,
  setValidated,
  overrideMode,
  setOverrideMode,
  remarks,
  setRemarks,
  systemScore = 32,
  onOverrideChange,
}) {
  const [overrideScore, setOverrideScore] = useState("");
  const [justification, setJustification] = useState("");

  // Keep parent in sync whenever override values change
  useEffect(() => {
    if (onOverrideChange) {
      onOverrideChange({
        score: overrideMode && overrideScore !== "" ? Number(overrideScore) : systemScore,
        justification: overrideMode ? justification : "",
      });
    }
  }, [overrideMode, overrideScore, justification, systemScore, onOverrideChange]);

  const handleConfirmSystemScore = () => {
    setValidated(!validated);
  };

  const handleToggleOverride = () => {
    const nextOverrideMode = !overrideMode;
    setOverrideMode(nextOverrideMode);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">

      {/* Current Score Row */}
      <div className="flex items-center justify-between gap-4">
        <label className="font-semibold text-gray-900 text-sm">
          Current System Total Score
        </label>
        <div className="w-24 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-bold text-gray-900 text-center">
          {systemScore}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleConfirmSystemScore}
          className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
            validated
              ? "bg-green-600 text-white"
              : "bg-[#0A67D8] text-white hover:bg-[#0057b8]"
          }`}
        >
          {validated ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Score Confirmed
            </span>
          ) : (
            "Confirm System Score"
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleOverride}
          className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
            overrideMode
              ? "bg-amber-600 text-white"
              : "bg-white text-[#0A67D8] border-2 border-[#0A67D8] hover:bg-blue-50"
          }`}
        >
          {overrideMode ? "Override Active" : "Override System Score"}
        </button>
      </div>

      {/* Conditional Override Section */}
      {overrideMode && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              New System Score
            </label>
            <input
              type="number"
              min="0"
              placeholder="Enter new score"
              value={overrideScore}
              onChange={(e) => setOverrideScore(e.target.value)}
              className="w-full rounded-lg border border-gray-400 px-4 py-2 text-sm text-gray-900 outline-none focus:border-[#0A67D8]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Justification
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Reason for changing score..."
              className="w-full resize-none rounded-lg border border-gray-400 px-4 py-2 text-sm text-gray-900 outline-none focus:border-[#0A67D8]"
            />
          </div>
        </div>
      )}

      {/* Remarks Section */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-1">
          Remarks
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter comments here..."
          className="w-full resize-none rounded-lg border border-gray-400 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0A67D8]"
        />
      </div>
    </div>
  );
}