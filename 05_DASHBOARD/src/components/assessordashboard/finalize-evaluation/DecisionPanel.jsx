import { useState } from "react";
import {
    ClipboardCheck,
    BadgeCheck,
    ShieldAlert,
} from "lucide-react";

import DecisionOptionButton from "./DecisionOptionButton";

export default function DecisionPanel({ onSubmit }) {
    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Store the assessor's selected decision.
    //
    // Possible values:
    // - "confirm"
    // - "override"
    //
    // Persist this value together with the
    // final evaluation record.
    //
    // Example:
    // decision = "confirm"
    // decision = "override"
    // ==========================================================

    const [decision, setDecision] = useState("");

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Save the assessor's explanation only
    // when the decision is "override".
    //
    // This field is required before submission.
    //
    // Example:
    // "Observed sufficient competency during
    // practical demonstration despite AI
    // confidence being below threshold."
    // ==========================================================

    const [reason, setReason] = useState("");

    // ==========================================================
    // BACKEND HANDOFF:
    //
    // Submission validation.
    //
    // Enable the submit button only when:
    //
    // • Confirm Final Result is selected.
    //
    // OR
    //
    // • Override Result is selected AND
    //   an override reason has been entered.
    // ==========================================================

    const isSubmitEnabled =
        decision === "confirm" ||
        (decision === "override" && reason.trim() !== "");

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
                    Decision Options
                ================================================== */}

                <div className="grid grid-cols-2 gap-4">

                    <DecisionOptionButton
                        icon={BadgeCheck}
                        title="Confirm Final Result"
                        description="Accept the system recommendation."
                        active={decision === "confirm"}
                        onClick={() => setDecision("confirm")}
                    />

                    <DecisionOptionButton
                        icon={ShieldAlert}
                        title="Override Result"
                        description="Override the recommended result and provide a justification."
                        active={decision === "override"}
                        onClick={() => setDecision("override")}
                    />

                </div>

                {/* ==================================================
                    BACKEND HANDOFF:
                    Display this field only when
                    the assessor overrides the
                    AI/System recommendation.
                ================================================== */}

                {decision === "override" && (

                    <div className="mt-5">

                        <label
                            htmlFor="overrideReason"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Reason for Override (Required)*
                        </label>

                        <textarea
                            id="overrideReason"
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you are overriding the system recommendation..."
                            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />

                    </div>

                )}

                {/* ==================================================
                    Submit Button
                ================================================== */}

                <div className="mt-5">

                    {/* ==============================================
                        BACKEND HANDOFF:

                        Trigger API submission here.

                        Example payload:

                        {
                            traineeId,
                            assessorId,
                            decision,
                            overrideReason:
                                decision === "override"
                                    ? reason
                                    : null,
                            submittedAt: new Date(),
                            finalStatus:
                                decision === "confirm"
                                    ? "COMPETENT"
                                    : "OVERRIDDEN"
                        }

                    ============================================== */}

                    <button
                        type="button"
                        disabled={!isSubmitEnabled}
                        onClick={onSubmit}
                        className={`w-full rounded-lg py-3 text-sm font-semibold transition ${isSubmitEnabled
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