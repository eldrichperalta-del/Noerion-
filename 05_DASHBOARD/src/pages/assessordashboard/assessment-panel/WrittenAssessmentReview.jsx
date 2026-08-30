import { useState, useEffect } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

import TraineeInfoCard from "../../../components/assessordashboard/assessment-panel/written-review/TraineeInfoCard";
import AssessmentSummaryCard from "../../../components/assessordashboard/assessment-panel/written-review/AssessmentSummaryCard";
import QuestionReviewTable from "../../../components/assessordashboard/assessment-panel/written-review/QuestionReviewTable";
import AssessorValidationCard from "../../../components/assessordashboard/assessment-panel/written-review/AssessorValidationCard";
import AICognitiveInsightsCard from "../../../components/assessordashboard/assessment-panel/written-review/AICognitiveInsightsCard";

export default function WrittenAssessmentReview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Context Data passed from AssessmentOverview.jsx
  const trainee = state?.trainee;
  const assessment = state?.assessment;
  const selectedCourse = state?.selectedCourse || assessment?.courseName;
  const batchCode = state?.batchCode || trainee?.batchCode;

  // Local Component State
  const [questionsData, setQuestionsData] = useState([]);
  const [submissionId, setSubmissionId] = useState(trainee?.submissionId || trainee?.submission_id || null);
  const [isLoading, setIsLoading] = useState(true);

  const [validated, setValidated] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [newScore, setNewScore] = useState("");
  const [justification, setJustification] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);

  // Dynamic Metrics State
  const [metrics, setMetrics] = useState({
    totalScore: 0,
    totalItems: 0,
    percentage: 0,
    result: "In Evaluation",
  });

  // Guard: Redirect back if opened directly without payload context
  if (!trainee || !assessment) {
    return <Navigate to="/assessor/assessment-panel" replace />;
  }

  // Determine button validity state
  const isRemarksEmpty = !remarks || remarks.trim() === "";
  const isOverrideInvalid = overrideMode && (!newScore || String(newScore).trim() === "" || !justification || justification.trim() === "");
  const isFormInvalid = isRemarksEmpty || isOverrideInvalid || isSubmitting;

  useEffect(() => {
    async function loadAssessmentReview() {
      setIsLoading(true);
      try {
        let currentSubId = submissionId;
        let dbTotalScore = null;
        let dbStatus = "in_progress";
        let dbResult = null;
        let dbRemarks = "";
        let dbJustification = "";

        // 1. Fetch Submission Record if ID is missing
        if (!currentSubId) {
          const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          const candidateUuids = [
            trainee?.user_id,
            trainee?.userId,
            trainee?.profile_id,
            trainee?.id,
          ].filter((val) => val && typeof val === "string" && uuidRegex.test(val));

          for (const uid of candidateUuids) {
            const { data: subData } = await supabase
              .from("assessment_submissions")
              .select("id, status, total_score, overall_result, passed, remarks, justification")
              .eq("assessment_id", assessment.id)
              .eq("trainee_id", uid)
              .maybeSingle();

            if (subData) {
              currentSubId = subData.id;
              setSubmissionId(currentSubId);
              dbStatus = subData.status;
              dbResult = subData.overall_result;
              dbRemarks = subData.remarks || "";
              dbJustification = subData.justification || "";
              if (subData.total_score !== null && subData.total_score !== undefined) {
                dbTotalScore = Number(subData.total_score);
              }
              break;
            }
          }

          if (!currentSubId) {
            const { data: fallbackSub } = await supabase
              .from("assessment_submissions")
              .select("id, status, total_score, overall_result, passed, remarks, justification")
              .eq("assessment_id", assessment.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (fallbackSub) {
              currentSubId = fallbackSub.id;
              setSubmissionId(currentSubId);
              dbStatus = fallbackSub.status;
              dbResult = fallbackSub.overall_result;
              dbRemarks = fallbackSub.remarks || "";
              dbJustification = fallbackSub.justification || "";
              if (fallbackSub.total_score !== null && fallbackSub.total_score !== undefined) {
                dbTotalScore = Number(fallbackSub.total_score);
              }
            }
          }
        } else {
          const { data: subData } = await supabase
            .from("assessment_submissions")
            .select("status, total_score, overall_result, remarks, justification")
            .eq("id", currentSubId)
            .maybeSingle();

          if (subData) {
            dbStatus = subData.status;
            dbResult = subData.overall_result;
            dbRemarks = subData.remarks || "";
            dbJustification = subData.justification || "";
            if (subData.total_score !== null && subData.total_score !== undefined) {
              dbTotalScore = Number(subData.total_score);
            }
          }
        }

        if (dbRemarks) setRemarks(dbRemarks);
        if (dbJustification) setJustification(dbJustification);

        // 2. Fetch Questions
        const { data: questionsList, error: qError } = await supabase
          .from("questions")
          .select("id, item_number, question_text, question_type")
          .eq("assessment_id", assessment.id)
          .order("item_number", { ascending: true });

        if (qError) throw qError;

        const questionIds = questionsList?.map((q) => q.id) || [];

        // 3. Fetch Answer Keys & Question Options
        let answerKeysMap = {};
        let optionsByQuestion = {};
        let optionsMap = {};

        if (questionIds.length > 0) {
          const [{ data: keysData }, { data: optData }] = await Promise.all([
            supabase.from("answer_keys").select("question_id, correct_answer").in("question_id", questionIds),
            supabase.from("question_options").select("id, question_id, option_letter, option_text").in("question_id", questionIds),
          ]);

          if (keysData) {
            keysData.forEach((k) => {
              answerKeysMap[k.question_id] = k.correct_answer;
            });
          }

          if (optData) {
            optData.forEach((o) => {
              optionsMap[o.id] = o;
              if (!optionsByQuestion[o.question_id]) {
                optionsByQuestion[o.question_id] = [];
              }
              optionsByQuestion[o.question_id].push(o);
            });
          }
        }

        // 4. Fetch Trainee Answers
        let traineeAnswersMap = {};
        if (currentSubId) {
          const { data: tAnswers } = await supabase
            .from("trainee_answers")
            .select("question_id, text_answer, selected_option_id, is_correct, points_awarded")
            .eq("submission_id", currentSubId);

          if (tAnswers) {
            tAnswers.forEach((ta) => {
              traineeAnswersMap[ta.question_id] = ta;
            });
          }
        }

        // 5. Build Formatted Questions Array and Calculate Score
        let calculatedScore = 0;
        const formattedQuestions = (questionsList || []).map((q, idx) => {
          const tAns = traineeAnswersMap[q.id];
          const score = tAns ? Number(tAns.points_awarded ?? (tAns.is_correct ? 1 : 0)) : 0;
          calculatedScore += score;

          let rawTraineeAns = tAns?.text_answer;
          let isOptionText = false;

          if (!rawTraineeAns && tAns?.selected_option_id && optionsMap[tAns.selected_option_id]) {
            const opt = optionsMap[tAns.selected_option_id];
            rawTraineeAns = opt.option_text || opt.option_letter;
            if (opt.option_text) isOptionText = true;
          }

          let traineeAnsStr = rawTraineeAns && String(rawTraineeAns).trim() !== "" ? String(rawTraineeAns).trim() : "No Answer";
          if (traineeAnsStr.toLowerCase() === "true") traineeAnsStr = "TRUE";
          if (traineeAnsStr.toLowerCase() === "false") traineeAnsStr = "FALSE";

          let rawCorrectKey = answerKeysMap[q.id] || "N/A";
          let correctAnsStr = rawCorrectKey;

          const qOptions = optionsByQuestion[q.id] || [];
          if (qOptions.length > 0) {
            const matchedOpt = qOptions.find(
              (o) => o.option_letter?.toLowerCase() === String(rawCorrectKey).toLowerCase() || o.id === rawCorrectKey
            );

            if (matchedOpt) {
              if (isOptionText || (traineeAnsStr !== "No Answer" && !/^[a-eA-E]$/.test(traineeAnsStr))) {
                correctAnsStr = matchedOpt.option_text || matchedOpt.option_letter;
              } else if (/^[a-eA-E]$/.test(traineeAnsStr)) {
                correctAnsStr = matchedOpt.option_letter?.toUpperCase() || matchedOpt.option_text;
              } else {
                correctAnsStr = matchedOpt.option_text || matchedOpt.option_letter;
              }
            }
          }

          if (correctAnsStr.toLowerCase() === "true") correctAnsStr = "TRUE";
          if (correctAnsStr.toLowerCase() === "false") correctAnsStr = "FALSE";

          return {
            id: q.id,
            itemNumber: q.item_number || idx + 1,
            question: q.question_text,
            traineeAnswer: traineeAnsStr,
            correctAnswer: correctAnsStr,
            isCorrect: Boolean(tAns?.is_correct),
            score: score,
            points: 1,
          };
        });

        setQuestionsData(formattedQuestions);

        // Dynamic Calculations
        const finalScore = dbTotalScore !== null ? dbTotalScore : calculatedScore;
        const totalItemsCount = formattedQuestions.length || assessment?.total_items || assessment?.totalItems || 0;
        const percentage = totalItemsCount > 0 ? Math.round((finalScore / totalItemsCount) * 100) : 0;

        // Determine Final Status Label
        let statusResult = "In Evaluation";
        if (dbStatus?.toLowerCase() === "evaluated") {
          statusResult = percentage >= 75 ? "Passed" : "Failed";
          setIsFinalized(true);
        } else if (dbResult && dbResult !== "In Evaluation") {
          statusResult = dbResult === "Competent" ? "Passed" : dbResult === "Not Yet Competent" ? "Failed" : dbResult;
        }

        setMetrics({
          totalScore: finalScore,
          totalItems: totalItemsCount,
          percentage: percentage,
          result: statusResult,
        });
      } catch (err) {
        console.error("Error loading assessment review data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessmentReview();
  }, [assessment?.id, trainee]);

  // Callback to receive updated score & justification from AssessorValidationCard
  const handleOverrideChange = (overrideData) => {
    if (overrideData) {
      setNewScore(overrideData.score);
      setJustification(overrideData.justification);
    }
  };

  const handleFinalize = () => {
    if (isFormInvalid) return;
    setShowConfirmModal(true);
  };

  const handleConfirmFinalize = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const hasOverride = overrideMode && newScore !== "" && newScore !== null;
      const activeScore = hasOverride ? Number(newScore) : metrics.totalScore;

      const passThreshold = 75;
      const activePercentage = metrics.totalItems > 0 ? Math.round((activeScore / metrics.totalItems) * 100) : 0;
      const isPassed = activePercentage >= passThreshold;
      const displayResult = isPassed ? "Passed" : "Failed";

      if (submissionId) {
        const updatePayload = {
          status: "evaluated",
          passed: isPassed,
          overall_result: displayResult,
          total_score: activeScore,
          remarks: remarks.trim(),
          justification: hasOverride ? justification.trim() : null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("assessment_submissions")
          .update(updatePayload)
          .eq("id", submissionId);

        if (error) throw error;
      }

      setMetrics((prev) => ({
        ...prev,
        totalScore: activeScore,
        percentage: activePercentage,
        result: displayResult,
      }));

      setIsFinalized(true);
    } catch (err) {
      console.error("Error finalizing evaluation:", err);
      alert("Failed to finalize evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          { label: "Assessment Panel", to: "/assessor/assessment-panel" },
          {
            label: `${selectedCourse} ${batchCode ? `(${batchCode})` : ""}`,
            to: "/assessor/assessment-panel/selected-trainees",
            state: { selectedCourse, batchId: state?.batchId, assessmentId: assessment?.id, batchCode },
          },
          {
            label: trainee.fullName,
            to: "/assessor/assessment-panel/assessment-overview",
            state: { trainee, assessment, selectedCourse, batchId: state?.batchId, batchCode },
          },
          { label: "Written Assessment Review" },
        ]}
      />

      <AssessorPageHeader
        title="Written Assessment Review"
        subtitle="Review the trainee's submitted answers before finalizing the evaluation."
      />

      {isFinalized && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            metrics.result === "Passed" || metrics.result === "Competent"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          Written assessment has been finalized successfully. Result: {metrics.result}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TraineeInfoCard trainee={trainee} assessment={assessment} />

        <AssessmentSummaryCard
          totalScore={metrics.totalScore}
          totalItems={metrics.totalItems}
          percentage={metrics.percentage}
          result={metrics.result}
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-sm">
          Loading submission data and questions...
        </div>
      ) : (
        <QuestionReviewTable questions={questionsData} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssessorValidationCard
            validated={validated}
            setValidated={setValidated}
            overrideMode={overrideMode}
            setOverrideMode={setOverrideMode}
            remarks={remarks}
            setRemarks={setRemarks}
            systemScore={metrics.totalScore}
            onOverrideChange={handleOverrideChange}
          />
        </div>

        <div>
          <AICognitiveInsightsCard
            submissionId={submissionId}
            traineeId={trainee?.id || trainee?.trainee_id || trainee?.user_id}
            assessment={assessment}
            validated={validated}
            overrideMode={overrideMode}
            isSubmitting={isSubmitting}
            isDisabled={isFormInvalid}
            onFinalize={handleFinalize}
          />
        </div>
      </div>

      <ConfirmationModal
        open={showConfirmModal}
        title="Finalize Evaluation?"
        message={`This action will finalize the review with a score of ${
          overrideMode && newScore !== ""
            ? Math.round((Number(newScore) / metrics.totalItems) * 100)
            : metrics.percentage
        }% (${
          (overrideMode && newScore !== ""
            ? Math.round((Number(newScore) / metrics.totalItems) * 100)
            : metrics.percentage) >= 75
            ? "Passed"
            : "Failed"
        }). Please confirm that all answers, remarks, and AI insights have been reviewed.`}
        confirmLabel="Finalize Evaluation"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmFinalize}
      />
    </div>
  );
}