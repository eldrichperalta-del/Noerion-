import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import { supabase } from "../../../supabaseClient";
import { notifyTraineeResult } from "../../../services/notificationService";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";
import FinalizeEvaluationPanel from "../../../components/assessordashboard/flow/FinalizeEvaluationPanel";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";


export default function FinalizeEvaluation() {

  const { state } = useLocation();


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
     STATE
     ============================================================ */

  const [
    submissionId,
    setSubmissionId,
  ] = useState(
    state?.submissionId ??
    rawTrainee?.submissionId ??
    rawTrainee?.submission_id ??
    null
  );

  const [
    questionsData,
    setQuestionsData,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isFinalized,
    setIsFinalized,
  ] = useState(false);

  const [
    showConfirmModal,
    setShowConfirmModal,
  ] = useState(false);


  /* ============================================================
     OVERRIDE RESULT STATE
     ============================================================ */

  const [
    decision,
    setDecision,
  ] = useState("");

  const [
    newScore,
    setNewScore,
  ] = useState("");

  const [
    justification,
    setJustification,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");


  /* ============================================================
     CERTIFICATE STATE
     ============================================================ */

  const [
    certificate,
    setCertificate,
  ] = useState(null);


  /* ============================================================
     METRICS
     ============================================================ */

  const [
    metrics,
    setMetrics,
  ] = useState({

    totalScore: 0,

    totalItems: 0,

    percentage: 0,

    result: "In Evaluation",

  });


  /* ============================================================
     LOAD ASSESSMENT DATA
     ============================================================ */

  useEffect(() => {

    async function loadFinalizeEvaluationData() {

      if (
        !rawTrainee ||
        !selectedCourse ||
        !assessmentId
      ) {

        console.warn(
          "FinalizeEvaluation: Missing required navigation data."
        );

        setIsLoading(false);

        return;

      }


      setIsLoading(true);


      try {

        let currentSubId =
          submissionId;

        let dbTotalScore =
          null;

        let dbStatus =
          "in_progress";

        let dbResult =
          null;

        let dbOverrideScore =
          null;

        let dbOverrideResult =
          null;

        let dbOverrideApplied =
          false;

        let dbRemarks =
          "";

        let dbJustification =
          "";


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


          for (
            const uid of candidateUuids
          ) {

            const {
              data: subData,
              error: subError,
            } = await supabase

              .from(
                "assessment_submissions"
              )

              .select(`
                id,
                status,
                total_score,
                overall_result,
                passed,
                override_score,
                override_result,
                override_applied,
                remarks,
                justification
              `)

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

              dbOverrideScore =
                subData.override_score;

              dbOverrideResult =
                subData.override_result;

              dbOverrideApplied =
                Boolean(
                  subData.override_applied
                );

              dbRemarks =
                subData.remarks ?? "";

              dbJustification =
                subData.justification ?? "";


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

            const {
              data: fallbackSub,
              error: fallbackError,
            } = await supabase

              .from(
                "assessment_submissions"
              )

              .select(`
                id,
                status,
                total_score,
                overall_result,
                passed,
                override_score,
                override_result,
                override_applied,
                remarks,
                justification
              `)

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

              dbOverrideScore =
                fallbackSub.override_score;

              dbOverrideResult =
                fallbackSub.override_result;

              dbOverrideApplied =
                Boolean(
                  fallbackSub.override_applied
                );

              dbRemarks =
                fallbackSub.remarks ?? "";

              dbJustification =
                fallbackSub.justification ?? "";


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

        else {

          /* ====================================================
             EXISTING SUBMISSION
             ==================================================== */

          const {
            data: subData,
            error: subError,
          } = await supabase

            .from(
              "assessment_submissions"
            )

            .select(`
              status,
              total_score,
              overall_result,
              passed,
              override_score,
              override_result,
              override_applied,
              remarks,
              justification
            `)

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

            dbOverrideScore =
              subData.override_score;

            dbOverrideResult =
              subData.override_result;

            dbOverrideApplied =
              Boolean(
                subData.override_applied
              );

            dbRemarks =
              subData.remarks ?? "";

            dbJustification =
              subData.justification ?? "";


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
           RESTORE SAVED OVERRIDE DATA
           ====================================================== */

        if (
          dbOverrideApplied
        ) {

          setDecision(
            "override"
          );

          setNewScore(
            dbOverrideScore !== null &&
              dbOverrideScore !== undefined
              ? String(
                dbOverrideScore
              )
              : ""
          );

          setJustification(
            dbJustification
          );

        }


        setRemarks(
          dbRemarks
        );


        /* ======================================================
           2. FETCH QUESTIONS
           ====================================================== */

        const {
          data: questionsList,
          error: questionsError,
        } = await supabase

          .from(
            "questions"
          )

          .select(`
            id,
            item_number,
            question_text,
            question_type
          `)

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
           3. FETCH ANSWER KEYS + OPTIONS
           ====================================================== */

        const answerKeysMap = {};

        const optionsByQuestion = {};

        const optionsMap = {};


        if (
          questionIds.length > 0
        ) {

          const [
            {
              data: keysData,
              error: keysError,
            },
            {
              data: optionsData,
              error: optionsError,
            },
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
              .select(`
                id,
                question_id,
                option_letter,
                option_text
              `)
              .in(
                "question_id",
                questionIds
              ),

          ]);


          if (keysError) {

            throw keysError;

          }


          if (optionsError) {

            throw optionsError;

          }


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
                ].push(
                  option
                );

              }
            );

          }

        }


        /* ======================================================
           4. FETCH TRAINEE ANSWERS
           ====================================================== */

        const traineeAnswersMap = {};


        if (currentSubId) {

          const {
            data: traineeAnswers,
            error: answersError,
          } = await supabase

            .from(
              "trainee_answers"
            )

            .select(`
              question_id,
              text_answer,
              selected_option_id,
              is_correct,
              points_awarded
            `)

            .eq(
              "submission_id",
              currentSubId
            );


          if (answersError) {

            throw answersError;

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
           5. BUILD QUESTION REVIEW DATA
           ====================================================== */

        let calculatedScore =
          0;


        const formattedQuestions =
          (questionsList || []).map(
            (
              question,
              index
            ) => {

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


                isOptionText =
                  Boolean(
                    option.option_text
                  );

              }


              let traineeAnswerString =
                rawTraineeAnswer &&
                  String(
                    rawTraineeAnswer
                  ).trim() !== ""

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


                if (
                  matchedOption
                ) {

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
           6. CALCULATE ASSESSMENT SUMMARY
           ====================================================== */

        const originalScore =
          dbTotalScore !== null
            ? dbTotalScore
            : calculatedScore;


        const totalItemsCount =
          formattedQuestions.length ||
          evaluationSummary
            ?.writtenAssessment
            ?.total ||
          0;


        const activeStoredScore =
          dbOverrideApplied &&
            dbOverrideScore !== null &&
            dbOverrideScore !== undefined
            ? Number(
              dbOverrideScore
            )
            : originalScore;


        const percentage =
          totalItemsCount > 0

            ? Math.round(
              (
                activeStoredScore /
                totalItemsCount
              ) *
              100
            )

            : 0;


        /* ======================================================
           7. DETERMINE CURRENT RESULT
           ====================================================== */

        let statusResult =
          "In Evaluation";


        if (
          dbStatus?.toLowerCase() ===
          "evaluated" ||
          dbStatus?.toLowerCase() ===
          "finalized"
        ) {

          statusResult =
            dbOverrideApplied &&
              dbOverrideResult
              ? dbOverrideResult
              : (
                dbResult ??
                (
                  percentage >= 75
                    ? "Competent"
                    : "Not Yet Competent"
                )
              );


          setIsFinalized(
            true
          );

        }


        setMetrics({

          totalScore:
            activeStoredScore,

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

        setIsLoading(
          false
        );

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
     CREATE CERTIFICATE
     ============================================================ */

  const createCertificate =
    async (
      finalResult
    ) => {

      if (
        finalResult !== "Competent"
      ) {

        return null;

      }


      if (
        !selectedTrainee.id
      ) {

        throw new Error(
          "Cannot create certificate: trainee ID is missing."
        );

      }


      if (
        !assessmentId
      ) {

        throw new Error(
          "Cannot create certificate: assessment ID is missing."
        );

      }


      if (
        !courseLabel ||
        courseLabel === "Chosen Course"
      ) {

        throw new Error(
          "Cannot create certificate: qualification is missing."
        );

      }


      console.log(
        "Creating certificate:",
        {
          trainee_id:
            selectedTrainee.id,

          assessment_id:
            assessmentId,

          qualification:
            courseLabel,

          result:
            finalResult,
        }
      );


      const {
        data,
        error,
      } = await supabase
        .functions
        .invoke(
          "create-certificate",
          {
            body: {

              trainee_id:
                selectedTrainee.id,

              assessment_id:
                assessmentId,

              qualification:
                courseLabel,

              result:
                finalResult,

            },
          }
        );


      if (
        error
      ) {

        console.error(
          "Certificate function error:",
          error
        );

        throw new Error(
          "The evaluation was saved, but certificate creation failed."
        );

      }


      if (
        !data?.success
      ) {

        console.error(
          "Certificate creation failed:",
          data
        );

        throw new Error(
          data?.error ??
          "Certificate creation failed."
        );

      }


      console.log(
        "Certificate created or retrieved:",
        data.certificate
      );


      setCertificate(
        data.certificate
      );


      return data.certificate;

    };


  /* ============================================================
  TEMPORARY NOTIFICATION TEST
  ============================================================ */

  const handleTestNotification =
    async () => {

      console.log(
        "========== TEST NOTIFICATION START =========="
      );

      try {

        /* --------------------------------------------------------
           CHECK CURRENT BROWSER SESSION
           -------------------------------------------------------- */

        const {
          data: {
            user,
          },
          error: authError,
        } = await supabase.auth.getUser();


        console.log(
          "TEST AUTH USER:",
          user
        );

        console.log(
          "TEST AUTH USER ID:",
          user?.id
        );

        console.log(
          "TEST AUTH ERROR:",
          authError
        );


        if (!user) {

          alert(
            "No authenticated user was found in the browser."
          );

          return;

        }


        /* --------------------------------------------------------
           CHECK CALLER PROFILE
           -------------------------------------------------------- */

        const {
          data: callerProfile,
          error: profileError,
        } = await supabase

          .from("profiles")

          .select(
            "id, role, email"
          )

          .eq(
            "id",
            user.id
          )

          .maybeSingle();


        console.log(
          "TEST CALLER PROFILE:",
          callerProfile
        );

        console.log(
          "TEST PROFILE ERROR:",
          profileError
        );


        /* --------------------------------------------------------
           TEST NOTIFICATION INSERT
           -------------------------------------------------------- */

        console.log(
          "TEST TRAINEE ID:",
          selectedTrainee.id
        );


        const result =
          await notifyTraineeResult({

            traineeId:
              selectedTrainee.id,

            submissionId:
              submissionId,

            assessmentTitle:
              "TEST - Notification",

            result:
              "Competent",

          });


        console.log(
          "========== TEST NOTIFICATION RESULT ==========",
          result
        );


        if (
          result?.success
        ) {

          alert(
            "Notification test succeeded!"
          );

        }

        else {

          alert(
            `Notification test failed: ${result?.error?.message ??
            result?.reason ??
            "Unknown error"
            }`
          );

        }

      }

      catch (error) {

        console.error(
          "========== TEST NOTIFICATION ERROR ==========",
          error
        );


        alert(
          error?.message ??
          "Notification test failed."
        );

      }

    };


  /* ============================================================
     FINAL SUBMISSION
     ============================================================ */

  const handleConfirmSubmit =
    async () => {

      setIsSubmitting(
        true
      );


      const hasOverride =
        decision === "override";


      try {

        if (
          !submissionId
        ) {

          throw new Error(
            "No assessment submission was found."
          );

        }


        /* ======================================================
           DETERMINE ACTIVE SCORE
           ====================================================== */

        const activeScore =
          hasOverride

            ? Number(
              newScore
            )

            : Number(
              metrics.totalScore
            );


        if (
          Number.isNaN(
            activeScore
          ) ||
          activeScore < 0
        ) {

          throw new Error(
            "Please enter a valid system score."
          );

        }


        if (
          metrics.totalItems > 0 &&
          activeScore >
          metrics.totalItems
        ) {

          throw new Error(
            `The score cannot exceed ${metrics.totalItems}.`
          );

        }


        /* ======================================================
           VALIDATE OVERRIDE

           Justification is required ONLY when overriding.
           Remarks are OPTIONAL.
           ====================================================== */

        if (
          hasOverride &&
          !justification.trim()
        ) {

          throw new Error(
            "Please provide a justification for overriding the result."
          );

        }


        /* ======================================================
           CALCULATE FINAL PERCENTAGE
           ====================================================== */

        const activePercentage =
          metrics.totalItems > 0

            ? Math.round(
              (
                activeScore /
                metrics.totalItems
              ) *
              100
            )

            : 0;


        /* ======================================================
           DETERMINE FINAL RESULT
           ====================================================== */

        const isPassed =
          activePercentage >= 75;


        const displayResult =
          isPassed
            ? "Competent"
            : "Not Yet Competent";


        const now =
          new Date().toISOString();


        /* ======================================================
           SAVE FINAL EVALUATION

           IMPORTANT:
           - status becomes "evaluated"
           - overall_result becomes the actual final result
           - total_score remains the original system score
             unless an override is being used
           - remarks are optional
           - submitted_at is intentionally NOT changed
             because it represents the trainee's submission time
           ====================================================== */

        const updatePayload = {

          status:
            "evaluated",

          /*
           * IMPORTANT:
           * Do NOT update submitted_at here.
           *
           * submitted_at represents the time when the
           * TRAINEE submitted the assessment.
           *
           * The assessor evaluating the assessment later
           * must not change that timestamp, otherwise the
           * assessment duration/time-taken becomes incorrect.
           */

          passed:
            isPassed,

          overall_result:
            displayResult,

          total_score:
            hasOverride
              ? activeScore
              : Number(
                metrics.totalScore
              ),

          override_score:
            hasOverride
              ? activeScore
              : null,

          override_result:
            hasOverride
              ? displayResult
              : null,

          override_applied:
            hasOverride,

          remarks:
            remarks?.trim() || null,

          justification:
            hasOverride
              ? justification.trim()
              : null,

          updated_at:
            now,

        };


        console.log(
          "Finalizing assessment submission:",
          {
            submissionId,
            updatePayload,
          }
        );


        /* ======================================================
           UPDATE DATABASE
           ====================================================== */

        const {
          data: updatedSubmission,
          error: updateError,
        } = await supabase

          .from(
            "assessment_submissions"
          )

          .update(
            updatePayload
          )

          .eq(
            "id",
            submissionId
          )

          .select()
          .single();


        if (
          updateError
        ) {

          console.error(
            "Database update error:",
            updateError
          );

          throw updateError;

        }


        if (
          !updatedSubmission
        ) {

          throw new Error(
            "The evaluation could not be updated. No database record was returned."
          );

        }


        console.log(
          "Assessment submission successfully updated:",
          updatedSubmission
        );


        /* ======================================================
           CREATE CERTIFICATE

           The Edge Function should handle duplicates.
           ====================================================== */

        let createdCertificate =
          null;


        if (
          displayResult ===
          "Competent"
        ) {

          createdCertificate =
            await createCertificate(
              displayResult
            );

        }


        /* ======================================================
           NOTIFY TRAINEE OF FINAL RESULT

           Notification failure must NOT rollback
           the successfully finalized evaluation.
           ====================================================== */

        try {

          console.log(
            "FINALIZE: ABOUT TO NOTIFY TRAINEE",
            {
              traineeId:
                selectedTrainee.id,

              submissionId:
                submissionId,

              assessmentTitle:
                assessment?.title ??
                evaluationSummary?.assessment?.title ??
                "Assessment",

              result:
                displayResult,
            }
          );


          const notificationResult =
            await notifyTraineeResult({

              traineeId:
                selectedTrainee.id,

              submissionId:
                submissionId,

              assessmentTitle:
                assessment?.title ??
                evaluationSummary?.assessment?.title ??
                "Assessment",

              result:
                displayResult,

            });


          console.log(
            "Trainee result notification:",
            notificationResult
          );

        } catch (notificationError) {

          console.error(
            "Evaluation finalized successfully, but trainee result notification failed:",
            notificationError
          );

        }


        /* ======================================================
           UPDATE UI
           ====================================================== */

        setMetrics(
          (previous) => ({

            ...previous,

            totalScore:
              activeScore,

            percentage:
              activePercentage,

            result:
              displayResult,

          })
        );


        setIsFinalized(
          true
        );


        setShowConfirmModal(
          false
        );


        console.log(
          "Evaluation finalized successfully."
        );


        if (
          createdCertificate
        ) {

          console.log(
            "Certificate ID:",
            createdCertificate.certificate_id
          );

        }

      }

      catch (error) {

        console.error(
          "Error finalizing evaluation:",
          error
        );


        alert(
          error?.message ??
          "Failed to finalize evaluation. Please try again."
        );

      }

      finally {

        setIsSubmitting(
          false
        );

      }

    };


  /* ============================================================
     PREVIEW RESULT FOR CONFIRMATION MODAL
     ============================================================ */

  const previewScore =
    decision === "override" &&
      newScore !== ""

      ? Number(
        newScore
      )

      : metrics.totalScore;


  const previewPercentage =
    metrics.totalItems > 0

      ? Math.round(
        (
          previewScore /
          metrics.totalItems
        ) *
        100
      )

      : 0;


  const previewResult =
    previewPercentage >= 75
      ? "Competent"
      : "Not Yet Competent";


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


      <AssessorBreadcrumbs

        items={[

          {
            label:
              courseLabel,

            to:
              "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          },


          {
            label:
              "Trainees for Evaluation",

            to:
              "/assessor/evaluation/trainees",

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
            label:
              "Evaluation Summary",

            to:
              "/assessor/evaluation/summary",

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
            label:
              "AI Analysis & Insights",

            to:
              "/assessor/evaluation/ai-analysis",

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


          {
            label:
              "Finalize Evaluation",

          },

        ]}

      />


      <AssessorPageHeader

        title="Finalize Evaluation"

        subtitle="Review the assessment results and AI recommendation before submitting the final evaluation."

      />


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

          Evaluation has been finalized.

          {" "}

          Result:

          {" "}

          {metrics.result}

        </div>

      )}


      {certificate && (

        <div
          className="
            rounded-xl
            border
            border-blue-200
            bg-blue-50
            px-4
            py-3
            text-sm
            font-semibold
            text-blue-700
          "
        >

          Certificate successfully generated.

          {" "}

          Certificate ID:

          {" "}

          {certificate.certificate_id}

        </div>

      )}


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

        questions={
          questionsData
        }

        isLoading={
          isLoading
        }

        aiResult={
          aiAnalysis?.aiResult
        }

        isFinalized={
          isFinalized
        }

        isSubmitting={
          isSubmitting
        }

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

        onSubmit={() => {

          if (
            isSubmitting ||
            isFinalized
          ) {

            return;

          }


          setShowConfirmModal(
            true
          );

        }}

      />


      <ConfirmationModal

        open={
          showConfirmModal
        }

        title={
          "Finalize Evaluation?"
        }

        message={`
          This action will finalize the evaluation with a score of
          ${previewPercentage}% (${previewResult}).

          ${previewResult === "Competent"
            ? "A certificate will be automatically generated for the trainee."
            : "No certificate will be generated because the trainee is Not Yet Competent."
          }

          Please confirm that the assessment results and AI recommendation
          have been reviewed.
        `}

        confirmLabel={
          isSubmitting
            ? "Finalizing..."
            : "Finalize Evaluation"
        }

        onCancel={() => {

          if (
            !isSubmitting
          ) {

            setShowConfirmModal(
              false
            );

          }

        }}

        onConfirm={
          handleConfirmSubmit
        }

      />

    </div>

  );
}