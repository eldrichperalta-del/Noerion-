function AddAssessorStepper({
  currentStep = 1,
}) {
  const steps = [
    {
      number: 1,
      label: "Basic Information",
    },
    {
      number: 2,
      label: "Professional Information",
    },
    {
      number: 3,
      label: "Review & Confirm",
    },
  ];

  return (
    <div className="mx-auto mb-6 flex w-full max-w-[1200px] overflow-hidden rounded-md border border-gray-300 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
      {steps.map(
        (step, index) => {
          const isActive =
            currentStep ===
            step.number;

          const isCompleted =
            currentStep >
            step.number;

          return (
            <div
              key={
                step.number
              }
              className={`
                relative
                flex
                flex-1
                items-center
                justify-center
                gap-2
                px-4
                py-3
                text-center
                text-sm
                font-semibold
                transition

                ${
                  isActive
                    ? `
                      bg-[#15294b]
                      text-white
                    `
                    : isCompleted
                    ? `
                      bg-blue-50
                      text-[#15294b]
                    `
                    : `
                      bg-white
                      text-gray-500
                    `
                }

                ${
                  index <
                  steps.length - 1
                    ? `
                      border-r
                      border-gray-300
                    `
                    : ""
                }
              `}
            >
              {/* STEP NUMBER */}

              <span
                className={`
                  grid
                  h-6
                  w-6
                  place-items-center
                  rounded-full
                  text-xs
                  font-bold

                  ${
                    isActive
                      ? `
                        bg-white
                        text-[#15294b]
                      `
                      : isCompleted
                      ? `
                        bg-[#15294b]
                        text-white
                      `
                      : `
                        bg-gray-200
                        text-gray-600
                      `
                  }
                `}
              >
                {isCompleted
                  ? "✓"
                  : step.number}
              </span>

              {/* LABEL */}

              <span>
                Step{" "}
                {
                  step.number
                }
                :{" "}
                {
                  step.label
                }
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

export default AddAssessorStepper;