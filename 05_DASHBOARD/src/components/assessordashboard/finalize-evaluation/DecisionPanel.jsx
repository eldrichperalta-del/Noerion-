import {
    ClipboardCheck,
    BadgeCheck,
    ShieldAlert,
} from "lucide-react";

import DecisionOptionButton from "./DecisionOptionButton";

export default function DecisionPanel({
    decision,
    setDecision,
    newScore,
    setNewScore,
    justification,
    setJustification,
    remarks,
    setRemarks,
    isFinalized,
    isSubmitting,
    onSubmit,
}) {

    const isSubmitEnabled =
        !isFinalized &&
        !isSubmitting &&
        (
            decision === "confirm" ||
            (
                decision === "override" &&
                newScore.trim() !== "" &&
                justification.trim() !== "" &&
                remarks.trim() !== ""
            )
        );


    const handleConfirm = () => {

        if (isFinalized || isSubmitting) {
            return;
        }

        setDecision("confirm");

        setNewScore("");
        setJustification("");
        setRemarks("");
    };


    const handleOverride = () => {

        if (isFinalized || isSubmitting) {
            return;
        }

        setDecision("override");
    };


    const handleSubmit = () => {

        if (!isSubmitEnabled) {
            return;
        }

        if (onSubmit) {
            onSubmit();
        }
    };


    return (

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300">

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


            <div className="p-5">

                <div className="grid grid-cols-2 gap-4">

                    <DecisionOptionButton
                        icon={BadgeCheck}
                        title="Confirm Final Result"
                        description="Accept the system recommendation."
                        active={decision === "confirm"}
                        onClick={handleConfirm}
                        disabled={isFinalized || isSubmitting}
                    />


                    <DecisionOptionButton
                        icon={ShieldAlert}
                        title="Override Result"
                        description="Override the recommended result and provide a justification."
                        active={decision === "override"}
                        onClick={handleOverride}
                        disabled={isFinalized || isSubmitting}
                    />

                </div>


                {decision === "override" && (

                    <div className="mt-5 space-y-4">

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
                                disabled={isFinalized || isSubmitting}
                                onChange={(e) =>
                                    setNewScore(e.target.value)
                                }
                                placeholder="Enter new system score..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />

                        </div>


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
                                disabled={isFinalized || isSubmitting}
                                onChange={(e) =>
                                    setJustification(e.target.value)
                                }
                                placeholder="Explain why you are overriding the system recommendation..."
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />

                        </div>


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
                                disabled={isFinalized || isSubmitting}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                                placeholder="Enter remarks..."
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />

                        </div>

                    </div>

                )}


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
                        {isSubmitting
                            ? "Finalizing..."
                            : isFinalized
                                ? "Evaluation Finalized"
                                : "Submit Final Decision"
                        }
                    </button>

                </div>

            </div>

        </div>

    );
}