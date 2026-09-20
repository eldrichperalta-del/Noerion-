import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient.js";
import { notifyTraineeResult } from "../../../services/notificationService.js";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Clock, 
  ArrowLeft,
  BarChart3,
  XCircle,
  Sparkles,
  UserRound,
  GraduationCap,
  IdCard,
  Calendar
} from "lucide-react";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";
import ConfirmationModal from "../../../components/assessordashboard/flow/ConfirmationModal";

export default function FinalizeEvaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Instant scroll-to-top BEFORE browser paint
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const scrollContainers = document.querySelectorAll(
      "main, #main-content, .overflow-y-auto"
    );

    scrollContainers.forEach((container) => {
      container.scrollTop = 0;
    });
  }, []);

  const selectedCourse = state?.selectedCourse ?? null;
  const rawTrainee = state?.selectedTrainee ?? null;
  const evaluationSummary = state?.evaluationSummary ?? null;

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    "Computer Systems Servicing";

  const assessmentId =
    state?.assessmentId ??
    rawTrainee?.assessmentId ??
    null;

  const submissionId =
    state?.submissionId ??
    rawTrainee?.submissionId ??
    rawTrainee?.submission?.id ??
    null;

  const [questions, setQuestions] = useState([]);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [decisionMode, setDecisionMode] = useState("confirm");
  const [overrideResult, setOverrideResult] = useState("Not Yet Competent");
  const [justification, setJustification] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submissionRecord, setSubmissionRecord] = useState(null);

  const traineeObj = {
    name:
      rawTrainee?.fullName ??
      rawTrainee?.name ??
      "Eldrich Justin",

    id:
      rawTrainee?.traineeId ??
      rawTrainee?.id ??
      "43292147-823d-4920-9c38-03029cfbe0bb",

    course: courseLabel,
  };

  /*
   * ============================================================
   * LOAD SUBMISSION + QUESTIONS + ANSWERS
   * ============================================================
   */
  useEffect(() => {
    async function loadData() {
      if (!submissionId) return;

      try {
        /*
         * Load the exact submission.
         *
         * The three summary cards are connected to these fields:
         *
         * status
         * overall_result
         * total_score
         * passed
         * submitted_at
         * updated_at
         */
        const { data: sub, error: subError } = await supabase
          .from("assessment_submissions")
          .select(`
            id,
            assessment_id,
            status,
            overall_result,
            total_score,
            passed,
            submitted_at,
            updated_at,
            justification,
            remarks
          `)
          .eq("id", submissionId)
          .maybeSingle();

        if (subError) {
          console.error(
            "Error loading assessment submission:",
            subError
          );
        }

        if (sub) {
          setSubmissionRecord(sub);

          if (sub.remarks) {
            setRemarks(sub.remarks);
          }

          if (sub.justification) {
            setJustification(sub.justification);
          }
        }

        /*
         * Always prefer the assessment_id stored inside
         * assessment_submissions.
         *
         * This makes sure the questions belong to the exact
         * submission being viewed.
         */
        const actualAssessmentId =
          sub?.assessment_id ??
          assessmentId;

        if (!actualAssessmentId) {
          setQuestions([]);
          return;
        }

        /*
         * Load questions belonging to this assessment.
         */
        const { data: qList, error: qError } = await supabase
          .from("questions")
          .select(
            "id, item_number, question_text"
          )
          .eq("assessment_id", actualAssessmentId)
          .order("item_number", {
            ascending: true,
          });

        if (qError) {
          console.error(
            "Error loading questions:",
            qError
          );
        }

        /*
         * Load answers belonging to this exact submission.
         */
        const { data: answers, error: answerError } =
          await supabase
            .from("trainee_answers")
            .select(
              "question_id, text_answer, is_correct"
            )
            .eq("submission_id", submissionId);

        if (answerError) {
          console.error(
            "Error loading trainee answers:",
            answerError
          );
        }

        /*
         * Convert answers into a lookup object.
         */
        const ansMap = {};

        if (answers) {
          answers.forEach((a) => {
            ansMap[a.question_id] = a;
          });
        }

        /*
         * Combine questions + trainee answers.
         */
        const formatted = (qList || []).map(
          (q, idx) => ({
            id: q.id,

            itemNumber:
              q.item_number ??
              idx + 1,

            question:
              q.question_text,

            traineeAnswer:
              ansMap[q.id]?.text_answer ??
              "No Answer Provided",

            isCorrect:
              Boolean(
                ansMap[q.id]?.is_correct
              ),
          })
        );

        setQuestions(formatted);
      } catch (err) {
        console.error(
          "Error loading final evaluation data:",
          err
        );
      }
    }

    loadData();
  }, [assessmentId, submissionId]);

  /*
   * ============================================================
   * DATABASE-DRIVEN SUMMARY VALUES
   * ============================================================
   */

  /*
   * SCORE
   *
   * Uses assessment_submissions.total_score.
   *
   * PostgreSQL numeric values can arrive as strings,
   * so convert to Number().
   */
  const score = Number(
    submissionRecord?.total_score ??
    evaluationSummary?.writtenAssessment?.score ??
    0
  );

  /*
   * TOTAL QUESTIONS
   *
   * Comes directly from the questions table.
   *
   * Example:
   * 40 questions -> total = 40
   */
  const total =
    questions.length > 0
      ? questions.length
      : 0;

  /*
   * SCORE PERCENTAGE
   *
   * Example:
   * 38 / 40 * 100 = 95
   */
  const percentage =
    total > 0
      ? Math.round(
          (score / total) * 100
        )
      : 0;

  /*
   * ============================================================
   * OFFICIAL RESULT
   * ============================================================
   */
  const officialResult =
    submissionRecord?.passed === true
      ? "Competent"
      : submissionRecord?.passed === false
        ? "Not Competent"
        : "Pending";

  /*
   * ============================================================
   * DECISION STATUS
   * ============================================================
   */
  const normalizedOverallResult =
    String(
      submissionRecord?.overall_result ?? ""
    )
      .trim()
      .toLowerCase();

  /*
 * ============================================================
 * FINALIZATION STATE
 * ============================================================
 */
const isFinalized =
  submissionRecord?.status === "evaluated";

/*
 * ============================================================
 * DECISION STATUS
 * ============================================================
 */
const decisionStatus =
  isFinalized
    ? "FINALIZED"
    : "PENDING";

/*
 * ============================================================
 * FINALIZED DATE
 * ============================================================
 */
const finalizedDate =
  isFinalized &&
  submissionRecord?.updated_at
    ? new Date(
        submissionRecord.updated_at
      ).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    : null;

  /*
   * Incorrect answers.
   */
  const incorrectItems =
    questions.filter(
      (q) => !q.isCorrect
    );

  /*
   * ============================================================
   * FINALIZE SUBMISSION
   * ============================================================
   */
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    const hasOverride = decisionMode === "override";

// If assessor confirms, use the existing DB recommendation.
// Only an explicit override is allowed to change the result.
const finalResult = hasOverride
  ? overrideResult
  : (submissionRecord?.passed ? "Competent" : "Not Yet Competent");

const isPassed = hasOverride
  ? finalResult === "Competent"
  : Boolean(submissionRecord?.passed);

const now = new Date().toISOString();

    try {
      const updatePayload = {
        status: "evaluated",

        /*
         * Official pass/fail value.
         */
        passed: isPassed,

        /*
         * Official assessor result.
         */
        overall_result: finalResult,

        /*
         * Override information.
         */
        override_result:
          hasOverride
            ? finalResult
            : null,

        override_applied:
          hasOverride,

        justification:
          hasOverride
            ? justification.trim()
            : null,

        remarks:
          remarks.trim() || null,

        /*
         * This is the timestamp used by the
         * "Finalized on ..." card.
         */
        updated_at: now,
      };

      const { error: updateError } =
        await supabase
          .from("assessment_submissions")
          .update(updatePayload)
          .eq("id", submissionId);

      if (updateError) {
        throw updateError;
      }

      /*
       * Create certificate only when the final
       * official result is Competent.
       */
      if (
        isPassed &&
        rawTrainee?.id
      ) {
        await supabase.functions.invoke(
          "create-certificate",
          {
            body: {
              trainee_id:
                rawTrainee.id,

              assessment_id:
                assessmentId,

              qualification:
                courseLabel,

              result:
                finalResult,
            },
          }
        );
      }

      /*
       * Notify trainee.
       */
      if (rawTrainee?.id) {
        await notifyTraineeResult({
          traineeId:
            rawTrainee.id,

          submissionId,

          assessmentTitle:
            courseLabel,

          result:
            finalResult,
        });
      }

      /*
       * Update local UI immediately so the page
       * has the same values as the database.
       */
      setSubmissionRecord(
        (prev) => ({
          ...prev,

          status:
            "evaluated",

          overall_result:
            finalResult,

          passed:
            isPassed,

          override_result:
            hasOverride
              ? finalResult
              : null,

          override_applied:
            hasOverride,

          justification:
            hasOverride
              ? justification.trim()
              : null,

          remarks:
            remarks.trim() || null,

          updated_at:
            now,
        })
      );

      setShowConfirmModal(false);

      navigate(
        "/assessor/evaluation"
      );
    } catch (err) {
      console.error(
        "Submission failed:",
        err
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * ============================================================
   * BACK TO AI ANALYSIS
   * ============================================================
   */
  const handleBackToAIAnalysis = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    const scrollContainers =
      document.querySelectorAll(
        "main, #main-content, .overflow-y-auto"
      );

    scrollContainers.forEach(
      (container) => {
        container.scrollTop = 0;
      }
    );

    navigate(
      "/assessor/evaluation/ai-analysis",
      {
        state: {
          selectedCourse,
          selectedTrainee:
            rawTrainee,
          submissionId,
          assessmentId,
        },
      }
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <AssessorBreadcrumbs
        items={[
          {
            label: courseLabel,
            to: "/assessor/evaluation",
          },
          {
            label:
              "Trainees Evaluation",
            to:
              "/assessor/evaluation/trainees",
          },
          {
            label: "AI Analysis",
            to:
              "/assessor/evaluation/ai-analysis",
          },
          "Finalize Evaluation",
        ]}
      />

      {/* 2. Page Header */}
      <AssessorPageHeader
        title="Finalize Evaluation"
        subtitle="Review key findings and submit the official competency decision."
      />

      {/* 3. Trainee Metadata Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <UserRound size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Trainee Name
              </p>

              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {traineeObj.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <GraduationCap size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Course / Qualification
              </p>

              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {traineeObj.course}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <IdCard size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Trainee ID
              </p>

              <p className="font-mono text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[160px]">
                {traineeObj.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <Calendar size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assessment Date
              </p>

              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {submissionRecord?.submitted_at
                  ? new Date(
                      submissionRecord.submitted_at
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "Not available"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Three Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* Container 1: Decision Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 pb-3 w-full">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </div>

            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Decision Status
            </span>
          </div>

          <div className="space-y-1.5 my-auto py-1 flex flex-col items-center">

            {/* PENDING or FINALIZED */}
            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {decisionStatus}
            </p>

            {/* Official result comes from `passed` */}
            <p className="text-xs font-bold text-slate-600">
              Official Result: {officialResult}
            </p>

            {/* Only show this when FINALIZED */}
            {isFinalized &&
              finalizedDate && (
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 w-full">
                  Finalized on {finalizedDate}
                </p>
              )}

          </div>
        </div>

        {/* Container 2: AI Recommendation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 pb-3 w-full">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles size={16} />
            </div>

            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              AI Recommendation
            </span>
          </div>

          <div className="space-y-1.5 my-auto py-1 flex flex-col items-center">

            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {officialResult}
            </p>

            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              Recommended based on evidence
            </p>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 w-full">
              AI supports assessor review
            </p>

          </div>
        </div>

        {/* Container 3: Assessment Score */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 pb-3 w-full">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 size={16} />
            </div>

            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Assessment Score
            </span>
          </div>

          <div className="space-y-1.5 my-auto py-1 flex flex-col items-center">

            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {submissionRecord?.passed === true
                ? "PASSED"
                : submissionRecord?.passed === false
                  ? "FAILED"
                  : "PENDING"}
              {" · "}
              {percentage}%
            </p>

            <p className="text-xs font-bold text-slate-600">
              {score} of {total} items correct
            </p>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 w-full">
              Written evaluation score
            </p>

          </div>
        </div>
      </div>

      {/* 5. Incorrect Responses List Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <XCircle size={16} />
            </div>

            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Incorrect Responses
            </h3>
          </div>

          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs">
            {incorrectItems.length} of {total} Incorrect
          </span>
        </div>

        {incorrectItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {incorrectItems.map(
              (item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-400 font-bold w-8">
                    #{item.itemNumber}
                  </span>

                  <span className="font-medium text-slate-800 flex-1 pr-4">
                    {item.question}
                  </span>

                  <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider shadow-xs">
                    Incorrect
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 font-semibold py-2">
            All questions answered correctly.
          </p>
        )}

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() =>
              setShowAllResponses(
                !showAllResponses
              )
            }
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 focus:outline-none transition"
          >
            <FileText size={15} />

            <span>
              {showAllResponses
                ? "Hide All Responses"
                : "View All Responses"}
            </span>

            {showAllResponses ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          {showAllResponses && (
            <div className="mt-3 divide-y divide-slate-100 rounded-xl bg-slate-50/70 border border-slate-200/60 p-4 max-h-72 overflow-y-auto text-xs font-medium">
              {questions.map(
                (q) => (
                  <div
                    key={q.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <span className="font-mono text-slate-400 font-bold w-8">
                      #{q.itemNumber}
                    </span>

                    <span className="text-slate-700 flex-1 truncate pr-4">
                      {q.question}
                    </span>

                    <span
                      className={`font-extrabold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider border shadow-xs ${
                        q.isCorrect
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}
                    >
                      {q.isCorrect
                        ? "Correct"
                        : "Incorrect"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Assessor Decision Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (
            decisionMode === "override" &&
            !justification.trim()
          ) {
            alert(
              "Please provide a mandatory justification for overriding the recommended result."
            );

            return;
          }

          setShowConfirmModal(true);
        }}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md space-y-5"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck size={16} />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Assessor Decision
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isFinalized
                ? "This evaluation has been finalized and recorded."
                : "Confirm the system recommendation or override with specific justification."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isFinalized}
            onClick={() =>
              setDecisionMode("confirm")
            }
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              decisionMode === "confirm"
                ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                Confirm Result
              </span>

              {decisionMode ===
                "confirm" && (
                <CheckCircle2
                  size={18}
                  className="text-emerald-600"
                />
              )}
            </div>

            <p className="text-base font-black text-slate-900 mt-1">
              Competent
            </p>

            <p className="text-xs text-slate-500 font-medium mt-1">
              Confirm system recommendation and finalize assessment.
            </p>
          </button>

          <button
            type="button"
            disabled={isFinalized}
            onClick={() =>
              setDecisionMode("override")
            }
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              decisionMode === "override"
                ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                Override Result
              </span>

              {decisionMode ===
                "override" && (
                <AlertCircle
                  size={18}
                  className="text-amber-600"
                />
              )}
            </div>

            <p className="text-base font-black text-slate-900 mt-1">
              Override Decision
            </p>

            <p className="text-xs text-slate-500 font-medium mt-1">
              Specify alternative result and provide justification.
            </p>
          </button>
        </div>

        {decisionMode ===
          "override" && (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Select Final Result
              </label>

              <select
                disabled={isFinalized}
                value={overrideResult}
                onChange={(e) =>
                  setOverrideResult(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Not Yet Competent">
                  Not Yet Competent
                </option>

                <option value="Competent">
                  Competent
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Override Justification{" "}
                <span className="text-rose-500">
                  *
                </span>
              </label>

              <textarea
                required
                disabled={isFinalized}
                rows={3}
                value={justification}
                onChange={(e) =>
                  setJustification(
                    e.target.value
                  )
                }
                placeholder="Explain why the final result differs from the system recommendation..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Assessor Remarks{" "}
            <span className="text-slate-400 font-normal">
              (Optional)
            </span>
          </label>

          <textarea
            rows={2}
            disabled={isFinalized}
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
            placeholder="Add optional notes..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={
              handleBackToAIAnalysis
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
          >
            <ArrowLeft size={15} />

            <span>
              Back to AI Analysis
            </span>
          </button>

          {isFinalized ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-8 py-2.5 text-xs font-bold text-slate-400 border border-slate-200 cursor-not-allowed select-none"
            >
              <CheckCircle2
                size={15}
                className="text-slate-400"
              />

              <span>
                Evaluated
              </span>
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-8 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.99]"
            >
              Submit Final Decision
            </button>
          )}
        </div>
      </form>

      <ConfirmationModal
        open={showConfirmModal}
        title="Finalize Evaluation?"
        message={`This action will finalize the evaluation with an official result of "${
  decisionMode === "override"
    ? overrideResult
    : (submissionRecord?.passed ? "Competent" : "Not Yet Competent")
}".`}
        confirmLabel={
          isSubmitting
            ? "Finalizing..."
            : "Finalize Evaluation"
        }
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