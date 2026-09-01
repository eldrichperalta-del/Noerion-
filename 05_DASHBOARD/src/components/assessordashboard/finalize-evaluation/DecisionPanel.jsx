import { useState } from "react";
import {
    ClipboardCheck,
    BadgeCheck,
    ShieldAlert,
} from "lucide-react";

import DecisionOptionButton from "./DecisionOptionButton";

export default function DecisionPanel({
    onSubmit,
}) {
    // ==========================================================
    // DECISION
    // ==========================================================

    const [decision, setDecision] = useState("");

    // ==========================================================
    // OVERRIDE FIELDS
    // ==========================================================

    const [newScore, setNewScore] = useState("");
    const [justification, setJustification] = useState("");
    const [remarks, setRemarks] = useState("");

    // ==========================================================
    // SUBMIT VALIDATION
    //
    // CONFIRM:
    //   No additional fields required.
    //
    // OVERRIDE:
    //   New System Score
    //   Justification
    //   Remarks
    //   are all required.
    // ==========================================================

    const isSubmitEnabled =
        decision === "confirm" ||
        (
            decision === "override" &&
            newScore.trim() !== "" &&
            justification.trim() !== "" &&
            remarks.trim() !== ""
        );

    // ==========================================================
    // DECISION HANDLERS
    // ==========================================================

    const handleConfirm = () => {
        setDecision("confirm");

        // Clear override fields when switching back to confirm.
        setNewScore("");
        setJustification("");
        setRemarks("");
    };

    const handleOverride = () => {
        setDecision("override");
    };

    // ==========================================================
    // SUBMIT
    //
    // Pass the complete decision data back to the parent.
    // ==========================================================

    const handleSubmit = () => {
        if (!isSubmitEnabled) {
            return;
        }

        if (onSubmit) {
            onSubmit({
                decision,
                newScore:
                    decision === "override"
                        ? Number(newScore)
                        : null,
                justification:
                    decision === "override"
                        ? justification.trim()
                        : null,
                remarks:
                    decision === "override"
                        ? remarks.trim()
                        : null,
            });
        }
    };

    return (

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300">

            {/* ======================================================
                HEADER
            ====================================================== */}

            <div className="px-6 py-4">

                <div className="flex items-center gap-3">

                    <ClipboardCheck
                        size={22}
                        className="text-[#2563EB]"
                    />

                    <h2 className="text-lg font-semibold text-gray-900">
                        Make Your Decision
                    </h2>

                </div>

            </div>


            {/* ======================================================
                BODY
            ====================================================== */}

            <div className="p-5">

                {/* ==================================================
                    DECISION OPTIONS
                ================================================== */}

                <div className="grid grid-cols-2 gap-4">

                    <DecisionOptionButton
                        icon={BadgeCheck}
                        title="Confirm Final Result"
                        description="Accept the system recommendation."
                        active={decision === "confirm"}
                        onClick={handleConfirm}
                    />


                    <DecisionOptionButton
                        icon={ShieldAlert}
                        title="Override Result"
                        description="Override the recommended result and provide a justification."
                        active={decision === "override"}
                        onClick={handleOverride}
                    />

                </div>


                {/* ==================================================
                    OVERRIDE SECTION

                    ONLY APPEARS AFTER:
                    Override Result is clicked.
                ================================================== */}

                {decision === "override" && (

                    <div className="mt-5 space-y-4">

                        {/* ==================================================
                            NEW SYSTEM SCORE
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="newSystemScore"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                New System Score (Required)*
                            </label>

                            <input
                                id="newSystemScore"
                                type="number"
                                min="0"
                                value={newScore}
                                onChange={(e) =>
                                    setNewScore(e.target.value)
                                }
                                placeholder="Enter new system score..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                        </div>


                        {/* ==================================================
                            JUSTIFICATION
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="overrideJustification"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Justification (Required)*
                            </label>

                            <textarea
                                id="overrideJustification"
                                rows={4}
                                value={justification}
                                onChange={(e) =>
                                    setJustification(e.target.value)
                                }
                                placeholder="Explain why you are overriding the system recommendation..."
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                        </div>


                        {/* ==================================================
                            REMARKS

                            IMPORTANT:
                            This is NOT displayed for Confirm Final Result.

                            It only appears when Override Result is active.
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="overrideRemarks"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Remarks (Required)*
                            </label>

                            <textarea
                                id="overrideRemarks"
                                rows={4}
                                value={remarks}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                                placeholder="Enter remarks..."
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />

                        </div>

                    </div>

                )}


                {/* ==================================================
                    SUBMIT BUTTON
                ================================================== */}

                <div className="mt-5">

                    <button
                        type="button"
                        disabled={!isSubmitEnabled}
                        onClick={handleSubmit}
                        className={`w-full rounded-lg py-3 text-sm font-semibold transition ${
                            isSubmitEnabled
                                ? "bg-blue-900 text-white hover:bg-blue-950"
                                : "cursor-not-allowed bg-gray-300 text-gray-500"
                        }`}
                    >
                        Submit Final Decision
                    </button>

                </div>

            </div>

        </div>

    );
}

