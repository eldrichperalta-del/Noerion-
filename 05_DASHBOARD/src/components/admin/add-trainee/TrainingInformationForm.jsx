import React from "react";

function TrainingInformationForm({
    trainingData,
    onChange,
    onBack,
    onCancel,
    onNext,
    isStepTwoComplete,
}) {
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        onChange(name, value);
    };

    return (
        <div className="w-full max-w-[900px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* ============================================================
          HEADER
      ============================================================ */}

            <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#001F5B]">
                    Training Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Provide the trainee's training and qualification details.
                </p>
            </div>

            {/* ============================================================
          FORM
      ============================================================ */}

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                {/* ==========================================================
            TRAINING CENTER
        ========================================================== */}

                <div>
                    <label
                        htmlFor="trainingCenter"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Training Center / TVET Institution{" "}
                        <span className="text-red-500">*</span>
                    </label>

                    <input
                        id="trainingCenter"
                        name="trainingCenter"
                        type="text"
                        value={trainingData.trainingCenter}
                        onChange={handleInputChange}
                        placeholder="Enter training center / TVET institution"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {/* ==========================================================
            NC LEVEL
        ========================================================== */}

                <div>
                    <label
                        htmlFor="ncLevel"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        NC Level <span className="text-red-500">*</span>
                    </label>

                    <input
                        id="ncLevel"
                        name="ncLevel"
                        type="text"
                        value={trainingData.ncLevel}
                        onChange={handleInputChange}
                        placeholder="Enter NC level"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {/* ==========================================================
            QUALIFICATION COURSE
        ========================================================== */}

                <div>
                    <label
                        htmlFor="qualificationCourse"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Qualification Course{" "}
                        <span className="text-red-500">*</span>
                    </label>

                    <input
                        id="qualificationCourse"
                        name="qualificationCourse"
                        type="text"
                        value={trainingData.qualificationCourse}
                        onChange={handleInputChange}
                        placeholder="Enter qualification course"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {/* ==========================================================
            BATCH
        ========================================================== */}

                <div>
                    <label
                        htmlFor="batch"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Batch <span className="text-gray-400">(Optional)</span>
                    </label>

                    <input
                        id="batch"
                        name="batch"
                        type="text"
                        value={trainingData.batch}
                        onChange={handleInputChange}
                        placeholder="Enter batch"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            
            {/* ========================================================
                BUTTONS
                ======================================================== */}

            <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5">

                {/* BACK */}

                <button
                    type="button"
                    onClick={onBack}
                    className="
                    rounded-lg
                    border
                    border-gray-300
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-700
                    transition
                    hover:bg-gray-100
                    "
                >   
                    Back
                </button>

                {/* NEXT */}

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!isStepTwoComplete}
                    className={`
                    rounded-lg
                    px-6
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition

                    ${isStepTwoComplete
                        ? `
                            bg-[#15294b]
                            hover:bg-[#0f1f3b]
                            `
                        : `
                            cursor-not-allowed
                             bg-gray-400
            `
                        }
    `}
                >
                    Next
                </button>

            </div>
            

        </div>
    );
}

export default TrainingInformationForm;