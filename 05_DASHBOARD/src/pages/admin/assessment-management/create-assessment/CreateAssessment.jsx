import { useState } from "react";

import StepProgressBar from "../../../../components/admin/create-assessment/StepProgressBar";
import WrittenAssessmentBuilder from "./written-assessment/WrittenAssessmentBuilder";
import SelectTrainees from "./SelectTrainees";
import AssignAssessor from "./AssignAssessor";
import ScheduleAssessment from "./ScheduleAssessment";
import ReviewConfirm from "./ReviewConfirm";


function CreateAssessment() {


  // Tracks current step of assessment wizard (1-5)
  const [currentStep, setCurrentStep] = useState(1);



  // Main assessment data storage
  const [assessmentData, setAssessmentData] = useState({

    // Written Assessment
    title: "",
    qualification: "",
    instructions: "",
    questions: [],


    // Trainees
    trainees: [],


    // Assessor
    assessor: {},


    // Schedule
    schedule: {
      date: "",
      startTime: "",
      endTime: "",
    },

  });



  // Reset everything after successful creation
  const resetAssessment = () => {

    setAssessmentData({

      title: "",
      qualification: "",
      instructions: "",
      questions: [],

      trainees: [],

      assessor: {},

      schedule: {
        date: "",
        startTime: "",
        endTime: "",
      },

    });


    setCurrentStep(1);

  };



  console.log(
    "CURRENT STEP:",
    currentStep
  );



  // Next step
  const nextStep = () => {


    console.log(
      "NEXT STEP CLICKED:",
      currentStep
    );


    if (currentStep < 5) {

      setCurrentStep(
        previous => previous + 1
      );

    }

  };



  // Previous step
  const prevStep = () => {


    if (currentStep > 1) {

      setCurrentStep(
        previous => previous - 1
      );

    }

  };



  return (

    <div className="min-h-screen p-0">


      {/* PAGE HEADER */}
      <div className="mb-8">


        <h1 className="
          text-3xl
          font-bold
          text-[#1E3A8A]
        ">
          Create Assessment
        </h1>


        <p className="
          mt-2
          text-gray-600
        ">
          Follow the steps to set up a new assessment.
        </p>


      </div>



      {/* PROGRESS BAR */}
      <div className="mb-8">

        <StepProgressBar
          currentStep={currentStep}
        />

      </div>




      {/* STEP 1: CREATE WRITTEN ASSESSMENT */}
      {
        currentStep === 1 && (

          <WrittenAssessmentBuilder

            assessmentData={assessmentData}

            setAssessmentData={setAssessmentData}

            onNext={nextStep}

          />

        )
      }




      {/* STEP 2: SELECT TRAINEES */}
      {
        currentStep === 2 && (

          <SelectTrainees

            assessmentData={assessmentData}

            setAssessmentData={setAssessmentData}

            onNext={nextStep}

            onBack={prevStep}

          />

        )
      }



      {/* STEP 3: ASSIGN ASSESSOR */}
      {
        currentStep === 3 && (

          <AssignAssessor

            assessmentData={assessmentData}

            setAssessmentData={setAssessmentData}

            onNext={nextStep}

            onBack={prevStep}

          />

        )
      }






      {/* STEP 4: SCHEDULE ASSESSMENT */}
      {
        currentStep === 4 && (

          <ScheduleAssessment

            assessmentData={assessmentData}

            setAssessmentData={setAssessmentData}

            onNext={nextStep}

            onBack={prevStep}

          />

        )
      }







      {/* STEP 5: REVIEW AND CONFIRM */}
      {
        currentStep === 5 && (

          <ReviewConfirm

            assessmentData={assessmentData}

            onNext={nextStep}

            onBack={prevStep}

            resetAssessment={resetAssessment}

          />

        )
      }





    </div>

  );

}


export default CreateAssessment;