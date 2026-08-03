function StepProgressBar({ currentStep = 1 }) {

  const steps = [
    "Step 1: Choose Assessment",
    "Step 2: Select Trainees",
    "Step 3: Assign Assessors",
    "Step 4: Schedule & Duration",
    "Step 5: Review & Confirm",
  ];


  return (
    <div className="
      mb-6
      flex
      w-full
      overflow-hidden
      rounded-lg
      border
      border-gray-300
      bg-white
      shadow-sm
    ">

      {steps.map((step, index) => {

        const stepNumber = index + 1;

        const isActive = currentStep === stepNumber;

        const isLast = index === steps.length - 1;


        return (

          <div

            key={step}

            className={`
              relative
              flex-1
              py-3
              text-center
              text-sm
              font-semibold
              transition-all
              duration-200

              ${
                isActive
                ?
                "bg-[#001F5B] text-white"
                :
                "bg-white text-gray-800"
              }

              ${!isLast ? "border-r border-gray-300" : ""}
            `}

          >


            <span className="relative z-40">
              {step}
            </span>




            {!isLast && (

              <>


                {/* Border Arrow */}
                <div

                  className="
                    absolute
                    right-[-30px]
                    top-[-1px]
                    z-20
                    h-0
                    w-0
                    border-b-[25px]
                    border-l-[30px]
                    border-t-[25px]
                    border-b-transparent
                    border-l-gray-300
                    border-t-transparent
                  "

                />



                {/* Fill Arrow */}
                <div

                  className={`
                    absolute
                    right-[-28px]
                    top-0
                    z-30
                    h-0
                    w-0
                    border-b-[24px]
                    border-l-[28px]
                    border-t-[24px]
                    border-b-transparent
                    border-t-transparent

                    ${
                      isActive
                      ?
                      "border-l-[#001F5B]"
                      :
                      "border-l-white"
                    }
                  `}

                />


              </>

            )}



          </div>

        );

      })}

    </div>
  );
}


export default StepProgressBar;
