import {
  useEffect,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import EvaluationSummaryPanel from "../../../components/assessordashboard/flow/EvaluationSummaryPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";


export default function EvaluationSummary() {


  const navigate = useNavigate();

  const { state } = useLocation();



  /*
  ============================================================
  NAVIGATION STATE

  Received from:
  TraineesForEvaluation.jsx

  Contains:

  selectedCourse
  selectedTrainee
  evaluationId

  ============================================================
  */


  const selectedCourse =
    state?.selectedCourse ?? null;



  const rawTrainee =
    state?.selectedTrainee ?? null;



  /*
  ============================================================
  Normalize trainee data

  Supports:

  Frontend:
  {
    fullName,
    traineeId
  }


  Backend:
  {
    name,
    id
  }

  ============================================================
  */


  const selectedTrainee = {


    id:
      rawTrainee?.id ??
      null,


    fullName:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      rawTrainee?.fullname ??
      "Unknown Trainee",


    traineeId:
      rawTrainee?.traineeId ??
      rawTrainee?.id ??
      "-",


    status:
      rawTrainee?.status ??
      "Completed",

  };



  const evaluationId =
    state?.evaluationId ?? null;




  /*
  ============================================================
  ROUTE GUARD

  Prevent:

  - direct URL access
  - pending evaluation

  ============================================================
  */


  useEffect(() => {


    if (
      !rawTrainee ||
      selectedTrainee.status === "Pending"
    ) {


      navigate(
        "/assessor/evaluation/trainees",
        {
          replace: true,

          state: {
            selectedCourse,
          },

        }
      );


    }


  }, [
    rawTrainee,
    selectedTrainee.status,
    selectedCourse,
    navigate,
  ]);




  if (
    !rawTrainee ||
    selectedTrainee.status === "Pending"
  ) {

    return null;

  }




  /*
  ============================================================
  EVALUATION SUMMARY

  BACKEND REPLACE:

  GET /assessor/evaluation/{evaluationId}/summary

  ============================================================
  */


  const evaluationSummary = {


    trainee: {


      name:
        selectedTrainee.fullName,


      id:
        selectedTrainee.traineeId,


      course:
        selectedCourse?.qualificationName ??
        "Unknown Qualification",

    },


    writtenAssessment: {


      score: 45,

      total: 50,

      percentage: 90,

      status: "WRITTEN - COMPLETED",

    },



    overallResult: {


      competency:
        "COMPETENT",

    },



    aiInsights: [

      "High attention stability during assessment.",

      "Strong procedural decision-making.",

      "Minor hesitation observed during troubleshooting.",

    ],


  };





  const handleViewAIAnalysis = () => {


    navigate(
      "/assessor/evaluation/ai-analysis",
      {

        state: {

          selectedCourse,

          selectedTrainee,

          evaluationId,

          evaluationSummary,

        },

      }
    );


  };





  return (

    <div className="space-y-6">


      <AssessorBreadcrumbs

        items={[


          {
            label:
              selectedCourse.qualificationName,

            to:
              "/assessor/evaluation",

            state: {
              selectedCourse,
              selectedTrainee,
              evaluationId,
            },

          },



          {


            label:
              "Trainees Evaluation",


            to:
              "/assessor/evaluation/trainees",


            state: {

              selectedCourse,

              selectedTrainee,

              evaluationId,

            },


          },



          "Evaluation Summary",


        ]}

      />




      <AssessorPageHeader

        title="Evaluation Summary"

        subtitle="Review consolidated performance before AI analysis."

      />




      <EvaluationSummaryPanel

        evaluationSummary={
          evaluationSummary
        }


        onViewAIAnalysis={
          handleViewAIAnalysis
        }

      />


    </div>

  );

}