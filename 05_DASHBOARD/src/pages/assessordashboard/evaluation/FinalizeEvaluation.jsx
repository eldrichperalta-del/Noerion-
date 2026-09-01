import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import { supabase } from "../../../supabaseClient";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";
import FinalizeEvaluationPanel from "../../../components/assessordashboard/flow/FinalizeEvaluationPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";


export default function FinalizeEvaluation() {

  const { state } = useLocation();

  console.log("=== FINALIZE PAGE MOUNTED ===");
  console.log("Navigation state:", state);
  console.log("selectedCourse:", state?.selectedCourse);
  console.log("selectedTrainee:", state?.selectedTrainee);
  console.log("assessmentId:", state?.assessmentId);
  console.log("submissionId:", state?.submissionId);
  console.log("evaluationSummary:", state?.evaluationSummary);
  console.log("aiAnalysis:", state?.aiAnalysis);


  /* ============================================================
     NAVIGATION DATA
     ============================================================ */

  const selectedCourse =
    state?.selectedCourse ?? null;

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    selectedCourse?.courseName ??
    selectedCourse ??
    "Chosen Course";

  const rawTrainee =
    state?.selectedTrainee ?? null;

  const evaluationSummary =
    state?.evaluationSummary ?? null;

  const aiAnalysis =
    state?.aiAnalysis ?? null;

  const evaluationId =
    state?.evaluationId ?? null;

  const batchId =
    state?.batchId ??
    rawTrainee?.batchId ??
    rawTrainee?.batch_id ??
    null;

  const batchCode =
    state?.batchCode ??
    rawTrainee?.batchCode ??
    rawTrainee?.batch_code ??
    null;

  const assignmentId =
    state?.assignmentId ??
    rawTrainee?.assignmentId ??
    rawTrainee?.assignment_id ??
    null;

  const assessment =
    state?.assessment ??
    evaluationSummary?.assessment ??
    null;

  const assessmentId =
    state?.assessmentId ??
    assessment?.id ??
    evaluationSummary?.assessmentId ??
    rawTrainee?.assessmentId ??
    rawTrainee?.assessment_id ??
    null;


  /* ============================================================
     NORMALIZE TRAINEE
     ============================================================ */

  const selectedTrainee = {

    id:
      rawTrainee?.id ??
      rawTrainee?.trainee_id ??
      rawTrainee?.user_id ??
      null,

    fullName:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      rawTrainee?.fullname ??
      "Unknown Trainee",

    traineeId:
      rawTrainee?.traineeId ??
      rawTrainee?.trainee_id ??
      rawTrainee?.id ??
      "-",

    status:
      rawTrainee?.status ??
      "Completed",

  };


  /* ============================================================
     FINALIZE EVALUATION STATE
     ============================================================ */

  const [submissionId, setSubmissionId] =
    useState(
      state?.submissionId ??
      rawTrainee?.submissionId ??
      rawTrainee?.submission_id ??
      null
    );

  const [questionsData, setQuestionsData] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isFinalized, setIsFinalized] =
    useState(false);

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  // ============================================================
  // OVERRIDE RESULT STATE
  // ============================================================


  const [decision, setDecision] =
    useState("");

  const [newScore, setNewScore] =
    useState("");

  const [justification, setJustification] =
    useState("");

  const [remarks, setRemarks] =
    useState("");



  const [metrics, setMetrics] = useState({



    totalScore: 0,

    totalItems: 0,

    percentage: 0,

    result: "In Evaluation",



  });




  /* ============================================================
     LOAD ASSESSMENT DATA

     This is the database logic moved from
     WrittenAssessmentReview.jsx.
     ============================================================ */

  useEffect(() => {

    async function loadFinalizeEvaluationData() {

      // SAFETY CHECK:
      // Do not query Supabase unless the required navigation data exists.
      if (!rawTrainee || !selectedCourse || !assessmentId) {
        console.warn(
          "FinalizeEvaluation: Missing required navigation data.",
          {
            hasTrainee: Boolean(rawTrainee),
            hasCourse: Boolean(selectedCourse),
            assessmentId,
          }
        );

        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {

        // Use the submission ID passed through navigation if available.
        let currentSubId = submissionId;

        let dbTotalScore = null;
        let dbStatus = "in_progress";
        let dbResult = null;


        /* ======================================================
           1. FIND SUBMISSION
           ====================================================== */

        if (!currentSubId) {

          const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

          const candidateUuids = [

            rawTrainee?.user_id,

            rawTrainee?.userId,

            rawTrainee?.profile_id,

            rawTrainee?.id,

          ].filter(

            (value) =>
              value &&
              typeof value === "string" &&
              uuidRegex.test(value)

          );


          for (const uid of candidateUuids) {

            const {
              data: subData,
              error: subError,
            } = await supabase

              .from("assessment_submissions")

              .select(
                `
                  id,
                  status,
                  total_score,
                  overall_result,
                  passed
                `
              )

              .eq(
                "assessment_id",
                assessmentId
              )
              .eq(
                "trainee_id",
                uid
              )

              .maybeSingle();


            if (subError) {
              console.error(
                "Error finding submission:",
                subError
              );
            }


            if (subData) {

              currentSubId =
                subData.id;

              setSubmissionId(
                currentSubId
              );

              dbStatus =
                subData.status;

              dbResult =
                subData.overall_result;


              if (
                subData.total_score !== null &&
                subData.total_score !== undefined
              ) {

                dbTotalScore =
                  Number(
                    subData.total_score
                  );

              }

              break;
            }

          }


          /* ====================================================
             FALLBACK SUBMISSION
             ==================================================== */
          if (!currentSubId) {

            if (assessmentId) {

              const {
                data: fallbackSub,
                error: fallbackError,
              } = await supabase

                .from("assessment_submissions")

                .select(
                  `
                    id,
                    status,
                    total_score,
                    overall_result,
                    passed
                  `
                )

                .eq(
                  "assessment_id",
                  assessmentId
                )

                .order(
                  "created_at",
                  {
                    ascending: false,
                  }
                )

                .limit(1)

                .maybeSingle();


              if (fallbackError) {

                console.error(
                  "Error finding fallback submission:",
                  fallbackError
                );

              }


              if (fallbackSub) {

                currentSubId =
                  fallbackSub.id;

                setSubmissionId(
                  currentSubId
                );

                dbStatus =
                  fallbackSub.status;

                dbResult =
                  fallbackSub.overall_result;

                if (
                  fallbackSub.total_score !== null &&
                  fallbackSub.total_score !== undefined
                ) {

                  dbTotalScore =
                    Number(
                      fallbackSub.total_score
                    );

                }

              }

            }

          }

        }

        else {

          /* ====================================================
             EXISTING SUBMISSION
             ==================================================== */

          const {
            data: subData,
            error: subError,
          } = await supabase

            .from("assessment_submissions")

            .select(
              `
                status,
                total_score,
                overall_result,
                passed
              `
            )

            .eq(
              "id",
              currentSubId
            )

            .maybeSingle();


          if (subError) {

            console.error(
              "Error loading submission:",
              subError
            );

          }


          if (subData) {

            dbStatus =
              subData.status;

            dbResult =
              subData.overall_result;

            if (
              subData.total_score !== null &&
              subData.total_score !== undefined
            ) {

              dbTotalScore =
                Number(
                  subData.total_score
                );

            }

          }

        }


        /* ======================================================
           2. DETERMINE ASSESSMENT ID
           ====================================================== */



        if (!assessmentId) {

          console.warn(
            "No assessment ID available for Finalize Evaluation."
          );

          setQuestionsData([]);

          setIsLoading(false);

          return;

        }


        /* ======================================================
           3. FETCH QUESTIONS
           ====================================================== */

        const {
          data: questionsList,
          error: questionsError,
        } = await supabase

          .from("questions")

          .select(
            `
              id,
              item_number,
              question_text,
              question_type
            `
          )

          .eq(
            "assessment_id",
            assessmentId
          )

          .order(
            "item_number",
            {
              ascending: true,
            }
          );


        if (questionsError) {
          throw questionsError;
        }


        const questionIds =
          questionsList?.map(
            (question) =>
              question.id
          ) ?? [];


        /* ======================================================
           4. FETCH ANSWER KEYS + OPTIONS
           ====================================================== */

        let answerKeysMap = {};

        let optionsByQuestion = {};

        let optionsMap = {};


        if (questionIds.length > 0) {

          const [
            { data: keysData },
            { data: optionsData },
          ] = await Promise.all([

            supabase

              .from("answer_keys")

              .select(
                "question_id, correct_answer"
              )

              .in(
                "question_id",
                questionIds
              ),

            supabase

              .from("question_options")

              .select(
                `
                  id,
                  question_id,
                  option_letter,
                  option_text
                `
              )

              .in(
                "question_id",
                questionIds
              ),

          ]);


          if (keysData) {

            keysData.forEach(
              (key) => {

                answerKeysMap[
                  key.question_id
                ] =
                  key.correct_answer;

              }
            );

          }


          if (optionsData) {

            optionsData.forEach(
              (option) => {

                optionsMap[
                  option.id
                ] =
                  option;


                if (
                  !optionsByQuestion[
                  option.question_id
                  ]
                ) {

                  optionsByQuestion[
                    option.question_id
                  ] = [];

                }


                optionsByQuestion[
                  option.question_id
                ].push(option);

              }
            );

          }

        }


        /* ======================================================
           5. FETCH TRAINEE ANSWERS
           ====================================================== */

        let traineeAnswersMap = {};


        if (currentSubId) {

          const {
            data: traineeAnswers,
            error: answersError,
          } = await supabase

            .from("trainee_answers")

            .select(
              `
                question_id,
                text_answer,
                selected_option_id,
                is_correct,
                points_awarded
              `
            )

            .eq(
              "submission_id",
              currentSubId
            );


          if (answersError) {

            console.error(
              "Error loading trainee answers:",
              answersError
            );

          }


          if (traineeAnswers) {

            traineeAnswers.forEach(
              (answer) => {

                traineeAnswersMap[
                  answer.question_id
                ] =
                  answer;

              }
            );

          }

        }


        /* ======================================================
           6. BUILD QUESTION REVIEW DATA
           
           MOVED FROM:
           WrittenAssessmentReview.jsx
           ====================================================== */

        let calculatedScore = 0;


        const formattedQuestions =
          (questionsList || []).map(
            (question, index) => {

              const traineeAnswer =
                traineeAnswersMap[
                question.id
                ];


              const score =
                traineeAnswer

                  ? Number(
                    traineeAnswer.points_awarded ??
                    (
                      traineeAnswer.is_correct
                        ? 1
                        : 0
                    )
                  )

                  : 0;


              calculatedScore +=
                score;


              /* ==============================================
                 TRAINEE ANSWER
                 ============================================== */

              let rawTraineeAnswer =
                traineeAnswer?.text_answer;

              let isOptionText =
                false;


              if (
                !rawTraineeAnswer &&
                traineeAnswer?.selected_option_id &&
                optionsMap[
                traineeAnswer.selected_option_id
                ]
              ) {

                const option =
                  optionsMap[
                  traineeAnswer.selected_option_id
                  ];


                rawTraineeAnswer =
                  option.option_text ??
                  option.option_letter;


                if (option.option_text) {
                  isOptionText = true;
                }

              }


              let traineeAnswerString =
                rawTraineeAnswer &&
                  String(rawTraineeAnswer).trim() !== ""

                  ? String(
                    rawTraineeAnswer
                  ).trim()

                  : "No Answer";


              if (
                traineeAnswerString.toLowerCase() ===
                "true"
              ) {

                traineeAnswerString =
                  "TRUE";

              }


              if (
                traineeAnswerString.toLowerCase() ===
                "false"
              ) {

                traineeAnswerString =
                  "FALSE";

              }


              /* ==============================================
                 CORRECT ANSWER
                 ============================================== */

              const rawCorrectKey =
                answerKeysMap[
                question.id
                ] ??
                "N/A";


              let correctAnswerString =
                rawCorrectKey;


              const questionOptions =
                optionsByQuestion[
                question.id
                ] ??
                [];


              if (
                questionOptions.length > 0
              ) {

                const matchedOption =
                  questionOptions.find(
                    (option) =>

                      option.option_letter
                        ?.toLowerCase() ===
                      String(
                        rawCorrectKey
                      ).toLowerCase()

                      ||

                      option.id ===
                      rawCorrectKey
                  );


                if (matchedOption) {

                  if (
                    isOptionText ||

                    (
                      traineeAnswerString !==
                      "No Answer" &&

                      !/^[a-eA-E]$/.test(
                        traineeAnswerString
                      )
                    )
                  ) {

                    correctAnswerString =
                      matchedOption.option_text ??
                      matchedOption.option_letter;

                  }

                  else if (
                    /^[a-eA-E]$/.test(
                      traineeAnswerString
                    )
                  ) {

                    correctAnswerString =
                      matchedOption.option_letter
                        ?.toUpperCase() ??
                      matchedOption.option_text;

                  }

                  else {

                    correctAnswerString =
                      matchedOption.option_text ??
                      matchedOption.option_letter;

                  }

                }

              }


              if (
                typeof correctAnswerString ===
                "string"
              ) {

                if (
                  correctAnswerString.toLowerCase() ===
                  "true"
                ) {

                  correctAnswerString =
                    "TRUE";

                }


                if (
                  correctAnswerString.toLowerCase() ===
                  "false"
                ) {

                  correctAnswerString =
                    "FALSE";

                }

              }


              return {

                id:
                  question.id,

                itemNumber:
                  question.item_number ??
                  index + 1,

                question:
                  question.question_text,

                traineeAnswer:
                  traineeAnswerString,

                correctAnswer:
                  correctAnswerString,

                isCorrect:
                  Boolean(
                    traineeAnswer?.is_correct
                  ),

                score,

                points:
                  1,

              };

            }
          );


        setQuestionsData(
          formattedQuestions
        );


        /* ======================================================
           7. CALCULATE ASSESSMENT SUMMARY
           ====================================================== */

        const finalScore =
          dbTotalScore !== null

            ? dbTotalScore

            : calculatedScore;


        const totalItemsCount =
          formattedQuestions.length ||

          evaluationSummary?.writtenAssessment?.total ||

          0;


        const percentage =
          totalItemsCount > 0

            ? Math.round(
              (
                finalScore /
                totalItemsCount
              ) *
              100
            )

            : 0;


        /* ======================================================
           8. DETERMINE RESULT
           ====================================================== */

        let statusResult = "In Evaluation";

        if (
          dbStatus?.toLowerCase() === "evaluated"
        ) {
          statusResult =
            dbResult ??
            (
              percentage >= 75
                ? "Competent"
                : "Not Yet Competent"
            );

          setIsFinalized(true);
        }

        console.log("=== FINALIZE EVALUATION ===");
        console.log("Submission ID:", currentSubId);
        console.log("Assessment ID:", assessmentId);
        console.log("Trainee:", selectedTrainee);
        console.log("Questions:", formattedQuestions);
        console.log("Metrics:", {
          totalScore: finalScore,
          totalItems: totalItemsCount,
          percentage,
          result: statusResult,
        });

        setMetrics({

          totalScore:
            finalScore,

          totalItems:
            totalItemsCount,

          percentage,

          result:
            statusResult,

        });

      }

      catch (error) {

        console.error(
          "Error loading Finalize Evaluation data:",
          error
        );

      }

      finally {

        setIsLoading(false);

      }

    }


    loadFinalizeEvaluationData();

  }, [
    assessmentId,
    submissionId,
    rawTrainee?.id,
    evaluationSummary?.writtenAssessment?.total,
  ]);
  /* ============================================================
     FINAL SUBMISSION
     ============================================================ */


  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    const hasOverride = decision === "override";

    try {
      if (!submissionId) {
        throw new Error(
          "No assessment submission was found."
        );
      }

      // ==========================================================
      // DETERMINE ACTIVE SCORE
      // ==========================================================

      const activeScore = hasOverride
        ? Number(newScore)
        : Number(metrics.totalScore);

      if (
        hasOverride &&
        (
          Number.isNaN(activeScore) ||
          activeScore < 0
        )
      ) {
        throw new Error(
          "Please enter a valid new system score."
        );
      }

      // ==========================================================
      // CALCULATE FINAL PERCENTAGE
      // ==========================================================

      const activePercentage =
        metrics.totalItems > 0
          ? Math.round(
            (activeScore / metrics.totalItems) * 100
          )
          : 0;

      // ==========================================================
      // DETERMINE FINAL RESULT
      // ==========================================================

      const isPassed =
        activePercentage >= 75;

      const displayResult =
        isPassed
          ? "Competent"
          : "Not Yet Competent";

      // ==========================================================
      // SAVE FINAL EVALUATION
      // ==========================================================

      const updatePayload = {
        status: "evaluated",

        passed: isPassed,

        overall_result: displayResult,

        total_score: activeScore,

        // Remarks are required for both decisions.
        remarks:
          remarks.trim() || null,

        // Justification is only saved for Override Result.
        justification:
          hasOverride
            ? justification.trim()
            : null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error,
      } = await supabase
        .from("assessment_submissions")
        .update(updatePayload)
        .eq("id", submissionId);

      if (error) {
        throw error;
      }

      // ==========================================================
      // UPDATE UI METRICS
      // ==========================================================

      setMetrics((previous) => ({
        ...previous,

        totalScore: activeScore,

        percentage: activePercentage,

        result: displayResult,
      }));

      // ==========================================================
      // FINALIZE
      // ==========================================================

      setIsFinalized(true);

      setShowConfirmModal(false);

    } catch (error) {
      console.error(
        "Error finalizing evaluation:",
        error
      );

      alert(
        error?.message ||
        "Failed to finalize evaluation. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };



  /* ============================================================
     SAFETY CHECK
     ============================================================ */

  if (
    !selectedCourse ||
    !rawTrainee
  ) {

    return (

      <div className="p-10 text-center">

        Missing evaluation data.

      </div>

    );

  }


  return (

    <div className="space-y-6">


      {/* ======================================================
          BREADCRUMBS
          ====================================================== */}

      <AssessorBreadcrumbs

        items={[

          {
            label: courseLabel,

            to: "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          },


          {
            label: "Trainees for Evaluation",

            to: "/assessor/evaluation/trainees",

            state: {
              selectedCourse,

              selectedTrainee,

              batchId,

              assessmentId,

              batchCode,

              evaluationId,

              submissionId,
            },
          },


          {
            label: "Evaluation Summary",

            to: "/assessor/evaluation/summary",

            state: {
              selectedCourse,

              selectedTrainee,

              evaluationSummary,

              evaluationId,

              assessmentId,
              submissionId,

              batchId,
              batchCode,

              assignmentId,

              assessment:
                evaluationSummary?.assessment ??
                state?.assessment ??
                null,
            },
          },


          {
            label: "AI Analysis & Insights",

            to: "/assessor/evaluation/ai-analysis",

            state: {
              selectedCourse,

              selectedTrainee,

              evaluationSummary,

              evaluationId,

              assessmentId,
              submissionId,

              batchId,
              batchCode,

              assignmentId,

              aiAnalysis,
            },
          },


          "Finalize Evaluation",

        ]}

      />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <AssessorPageHeader

        title="Finalize Evaluation"

        subtitle="Review the assessment results and AI recommendation before submitting the final evaluation."

      />


      {/* ======================================================
          FINALIZED NOTICE
          ====================================================== */}

      {isFinalized && (

        <div
          className="
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            font-semibold
            text-green-700
          "
        >

          Evaluation has already been finalized.

          {" "}

          Result:

          {" "}

          {metrics.result}

        </div>

      )}


      {/* ======================================================
          FINALIZE EVALUATION PANEL

          AssessmentSummaryCard and QuestionReviewTable
          are now rendered from FinalizeEvaluationPanel.
          ====================================================== */}


      <FinalizeEvaluationPanel

        trainee={{

          name:
            selectedTrainee.fullName,

          id:
            selectedTrainee.traineeId,

          course:
            selectedCourse?.qualificationName ??
            selectedCourse,

        }}


        /* ============================================================
           ASSESSMENT SUMMARY
           ============================================================ */

        totalScore={
          metrics.totalScore
        }

        totalItems={
          metrics.totalItems
        }

        percentage={
          metrics.percentage
        }

        result={
          metrics.result
        }


        /* ============================================================
           QUESTION REVIEW
           ============================================================ */

        questions={
          questionsData
        }

        isLoading={
          isLoading
        }


        /* ============================================================
           AI / SYSTEM RECOMMENDATION
           ============================================================ */

        aiResult={
          aiAnalysis?.aiResult
        }


        /* ============================================================
           FINALIZATION
           ============================================================ */

        isFinalized={
          isFinalized
        }

        isSubmitting={
          isSubmitting
        }


        /* ============================================================
           DECISION STATE
           ============================================================ */

        decision={
          decision
        }

        setDecision={
          setDecision
        }

        newScore={
          newScore
        }

        setNewScore={
          setNewScore
        }

        justification={
          justification
        }

        setJustification={
          setJustification
        }

        remarks={
          remarks
        }

        setRemarks={
          setRemarks
        }


        /* ============================================================
           SUBMIT
           ============================================================ */

        onSubmit={() =>
          setShowConfirmModal(true)
        }

      />





      {/* ======================================================
          CONFIRMATION MODAL
          ====================================================== */}

      <ConfirmationModal

        open={
          showConfirmModal
        }

        title="Finalize Evaluation?"

        message={`
          This action will finalize the evaluation with a score of
          ${metrics.percentage}% (${metrics.result}).
          Please confirm that the assessment results and AI recommendation
          have been reviewed.
        `}

        confirmLabel="Finalize Evaluation"

        onCancel={() =>
          setShowConfirmModal(false)
        }

        onConfirm={
          handleConfirmSubmit
        }

      />

    </div>

  );

}