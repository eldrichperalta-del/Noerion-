import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient.js";
import { 
  UserRound, 
  IdCard, 
  GraduationCap, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft, 
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Award
} from "lucide-react";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";

export default function EvaluationSummary() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const selectedCourse = state?.selectedCourse ?? null;
  const rawTrainee = state?.selectedTrainee ?? null;

  const courseLabel =
    selectedCourse?.qualificationName ??
    selectedCourse?.name ??
    selectedCourse?.courseName ??
    "Course / Qualification";

  const batchId = state?.batchId ?? rawTrainee?.batchId ?? null;
  const batchCode = state?.batchCode ?? rawTrainee?.batchCode ?? null;
  const assessmentId = state?.assessmentId ?? rawTrainee?.assessmentId ?? null;
  const submissionId = state?.submissionId ?? rawTrainee?.submissionId ?? rawTrainee?.submission?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [hasAiInsights, setHasAiInsights] = useState(false);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  const selectedTrainee = {
    fullName: rawTrainee?.fullName ?? rawTrainee?.name ?? "Eldrich Justin",
    traineeId: rawTrainee?.traineeId ?? rawTrainee?.id ?? "43292147-823d-4920-9c38-03029cfbe0bb",
    course: courseLabel,
  };

  useEffect(() => {
    async function loadData() {
      if (!submissionId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: subData } = await supabase
        .from("assessment_submissions")
        .select("id, total_score, passed, overall_result, status, submitted_at, created_at, started_at, assessment_id")
        .eq("id", submissionId)
        .maybeSingle();

      if (subData) {
        setSubmission(subData);

        const actualAssessmentId = subData.assessment_id || assessmentId;
        if (actualAssessmentId) {
          const { count } = await supabase
            .from("questions")
            .select("id", { count: "exact", head: true })
            .eq("assessment_id", actualAssessmentId);
          setTotalQuestionsCount(count || 0);
        }

        const { data: aiData } = await supabase
          .from("ai_assessment_insights")
          .select("id")
          .eq("submission_id", submissionId)
          .maybeSingle();

        setHasAiInsights(Boolean(aiData));
      }
      setLoading(false);
    }

    loadData();
  }, [submissionId, assessmentId]);

  const score = submission?.total_score ?? 36;
  const totalItems = totalQuestionsCount > 0 ? totalQuestionsCount : 40;
  const incorrectCount = totalItems > 0 ? totalItems - score : 4;
  const percentage = totalItems > 0 ? Math.round((score / totalItems) * 100) : 90;
  
  const isFinalized = submission?.status === "evaluated";
  const systemResult = submission?.overall_result || (submission?.passed ? "Competent" : "Not Yet Competent");

  const calculateDuration = () => {
    if (!submission?.started_at || (!submission?.submitted_at && !submission?.created_at)) {
      return "N/A";
    }
    const start = new Date(submission.started_at).getTime();
    const end = new Date(submission.submitted_at || submission.created_at).getTime();
    const diffInSeconds = Math.max(0, Math.floor((end - start) / 1000));
    
    const hrs = Math.floor(diffInSeconds / 3600);
    const mins = Math.floor((diffInSeconds % 3600) / 60);
    const secs = diffInSeconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const elapsedTime = calculateDuration();

  const assessmentDate = submission?.submitted_at || submission?.created_at
    ? new Date(submission.submitted_at || submission.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "September 19, 2026";

  const handleBackToTrainees = () => {
    navigate("/assessor/evaluation/trainees", {
      state: { selectedCourse, batchId, batchCode },
    });
  };

  const handleViewAIAnalysis = () => {
    navigate("/assessor/evaluation/ai-analysis", {
      state: {
        selectedCourse,
        selectedTrainee: rawTrainee,
        batchId,
        batchCode,
        assessmentId,
        submissionId,
      },
    });
  };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <AssessorPageHeader
          title="Evaluation Summary"
          subtitle="Review the trainee's assessment outcome before opening detailed evidence."
        />
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-xs font-semibold text-slate-500 shadow-xs">
          Loading evaluation summary from database...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <AssessorBreadcrumbs
        items={[
          { label: courseLabel, to: "/assessor/evaluation" },
          { label: "Trainees Evaluation", to: "/assessor/evaluation/trainees" },
          "Evaluation Summary",
        ]}
      />

      <AssessorPageHeader
        title="Evaluation Summary"
        subtitle="Review the trainee's assessment outcome before opening detailed evidence."
      />

      {/* Trainee Metadata Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trainee Name</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedTrainee.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course / Qualification</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedTrainee.course}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <IdCard size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trainee ID</p>
              <p className="font-mono text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[160px]">{selectedTrainee.traineeId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessment Date</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{assessmentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Written Assessment Container (Without redundant score text in description) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Written Assessment</h3>
            </div>
            <span className={`rounded-lg border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
              submission?.passed 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {submission?.passed ? "PASSED" : "FAILED"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-1">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={submission?.passed ? "text-emerald-500 transition-all duration-700" : "text-rose-500 transition-all duration-700"}
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{percentage}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Score</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium text-center sm:text-left max-w-sm">
              Written assessment responses recorded and processed for competency evaluation, demonstrating strong theoretical knowledge and core concept mastery across the qualification requirements.
            </p>
          </div>
        </div>

        {/* Assessment Decision Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isFinalized ? "Final Assessment Decision" : "Assessment Result"}
              </h3>
            </div>
            <span className={`rounded-lg border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
              isFinalized 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {isFinalized ? "Finalized" : "Pending Decision"}
            </span>
          </div>

          <div className="text-center space-y-3 my-auto py-4">
            <div className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
              <Award size={30} className={submission?.passed ? "text-emerald-600" : "text-amber-600"} />
              <span className={`text-3xl font-black tracking-wide uppercase ${
                submission?.passed ? "text-emerald-700" : "text-amber-700"
              }`}>
                {systemResult}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
              {isFinalized
                ? "Official assessor evaluation decision submitted."
                : "System-supported assessment result pending assessor confirmation."}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Performance Breakdown Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart3 size={16} />
          </div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Assessment Performance Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30 space-y-1 transition hover:shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700">
              <CheckCircle2 size={15} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Correct</span>
            </div>
            <span className="text-3xl font-black text-emerald-950 block">{score}</span>
            <span className="text-[11px] text-emerald-700/80 font-semibold block">of {totalItems} items</span>
          </div>

          <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30 space-y-1 transition hover:shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-rose-700">
              <XCircle size={15} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Incorrect</span>
            </div>
            <span className="text-3xl font-black text-rose-950 block">{incorrectCount}</span>
            <span className="text-[11px] text-rose-700/80 font-semibold block">of {totalItems} items</span>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/30 space-y-1 transition hover:shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-indigo-700">
              <Clock size={15} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Time Taken</span>
            </div>
            <span className="text-2xl font-black text-indigo-950 block tracking-tight">{elapsedTime}</span>
            <span className="text-[11px] text-indigo-700/80 font-semibold block">Total active duration</span>
          </div>
        </div>
      </div>

      {/* AI-Supported Analysis Status Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI-Supported Analysis</h3>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs">
            {hasAiInsights ? "Analysis Ready" : "Pending Processing"}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          AI-supported analysis is available for review, including assessment strengths, areas for improvement, assessment review flags, and evidence-based insights.
        </p>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBackToTrainees}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
          >
            <ArrowLeft size={15} />
            <span>Back to Trainees List</span>
          </button>

          <button
            type="button"
            onClick={handleViewAIAnalysis}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.99]"
          >
            <span>View AI Analysis & Insights</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}