import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

import TraineeInformationCard from "../../../components/assessordashboard/evaluation-summary/TraineeInformationCard";
import AIResultSummaryCard from "../../../components/assessordashboard/ai-analysis/AIResultSummaryCard";
import EEGInsightsCard from "../../../components/assessordashboard/ai-analysis/EEGInsightsCard";
import PerformancePatternsCard from "../../../components/assessordashboard/ai-analysis/PerformancePatternsCard";
import AIInterpretationCard from "../../../components/assessordashboard/ai-analysis/AIInterpretationCard";
import ProceedDecisionButton from "../../../components/assessordashboard/ai-analysis/ProceedDecisionButton";

import { mockAIAnalysis } from "../../../data/mockAIAnalysis";


export default function AIAnalysisInsights() {

  const navigate = useNavigate();

  const { state } = useLocation();


  /* ==========================================================================
     RECEIVE NAVIGATION DATA
  ========================================================================== */

  const selectedCourse =
    state?.selectedCourse ?? null;


  const rawTrainee =
    state?.selectedTrainee ?? {};



  /* ==========================================================================
     NORMALIZE TRAINEE DATA

     Different pages may use:
     - name
     - fullName
     - fullname
     - traineeId
     - id

     This creates one consistent object for all components.
  ========================================================================== */

  const selectedTrainee = {

    id:
      rawTrainee.id ?? null,


    fullName:
      rawTrainee.fullName ??
      rawTrainee.name ??
      rawTrainee.fullname ??
      "Unknown Trainee",


    traineeId:
      rawTrainee.traineeId ??
      rawTrainee.id ??
      "-",


  };



  /* ==========================================================================
     SAFETY CHECK

     Prevent page crash if navigation state is missing.
  ========================================================================== */

  if (!selectedCourse || !state?.selectedTrainee) {

    return (

      <div className="p-10 text-center">

        Missing evaluation data.

      </div>

    );

  }



  const evaluationSummary =
    state?.evaluationSummary ?? null;


  const evaluationId =
    state?.evaluationId ?? null;



  /* ==========================================================================
     MERGE TRAINEE DATA WITH AI RESPONSE

     FRONTEND:
     Uses mockAIAnalysis.

     BACKEND:
     Replace this object with API response.
  ========================================================================== */

  const aiAnalysis = {

    ...mockAIAnalysis,


    trainee: {

      ...mockAIAnalysis.trainee,


      name:
        selectedTrainee.fullName,


      id:
        selectedTrainee.traineeId,


      course:
        selectedCourse.qualificationName,

    },

  };



  /* ==========================================================================
     PROCEED TO FINALIZE EVALUATION
  ========================================================================== */

  const handleProceedToDecision = () => {

    navigate(
      "/assessor/evaluation/finalize",
      {

        state: {

          selectedCourse,

          selectedTrainee,

          evaluationSummary,

          evaluationId,

          aiAnalysis,

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

          },


          {

            label:
              "Trainees Evaluation",


            to:
              "/assessor/evaluation/trainees",

          },


          {
            label: "Evaluation Summary",
            to: "/assessor/evaluation/summary",
            state: {
              selectedCourse,
              selectedTrainee,
              evaluationSummary,
              evaluationId,
            },
          },


          "AI Analysis & Insights",

        ]}

      />



      <AssessorPageHeader

        title="AI Analysis & Insights"

        subtitle="Review AI-supported insights before the final decision."

      />



      <TraineeInformationCard

        trainee={
          aiAnalysis.trainee
        }

      />



      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">


        <AIResultSummaryCard

          result={
            aiAnalysis.aiResult
          }

        />



        <EEGInsightsCard

          eeg={
            aiAnalysis.eeg
          }

        />


      </div>




      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">


        <PerformancePatternsCard

          patterns={
            aiAnalysis.patterns
          }

        />



        <div className="space-y-6">


          <AIInterpretationCard

            interpretation={
              aiAnalysis.interpretation
            }

          />



          <div className="flex justify-center">


            <ProceedDecisionButton

              onClick={
                handleProceedToDecision
              }

            />


          </div>


        </div>


      </div>


    </div>

  );

}