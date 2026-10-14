import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "../../../supabaseClient.js";

import { 

  CheckCircle2, 

  AlertTriangle, 

  ChevronDown, 

  ChevronUp, 

  ShieldCheck, 

  ArrowRight,

  ArrowLeft,

  FileText,

  Flag,

  Sparkles,

  BarChart3,

  Brain,

  UserRound,

  GraduationCap,

  IdCard,

  Calendar

} from "lucide-react";



import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs";

import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader";



export default function AIAnalysisInsights() {

  const navigate = useNavigate();

  const { state } = useLocation();



  const [showEvidence, setShowEvidence] = useState(false);

  const [expandStrengths, setExpandStrengths] = useState(false);

  const [expandAreas, setExpandAreas] = useState(false);

  const [expandInsights, setExpandInsights] = useState(false);

  const [expandCognitive, setExpandCognitive] = useState(false);



  const [loading, setLoading] = useState(true);



  const selectedCourse = state?.selectedCourse ?? null;

  const rawTrainee = state?.selectedTrainee ?? null;

  const evaluationSummary = state?.evaluationSummary ?? null;



  const courseLabel =

    selectedCourse?.qualificationName ??

    selectedCourse?.name ??

    selectedCourse?.courseName ??

    "Computer Systems Servicing";



  const assessmentId = state?.assessmentId ?? rawTrainee?.assessmentId ?? null;

  const submissionId = state?.submissionId ?? rawTrainee?.submissionId ?? rawTrainee?.submission?.id ?? null;



  const traineeObj = {

    name: rawTrainee?.fullName ?? rawTrainee?.name ?? "Eldrich Justin",

    id: rawTrainee?.traineeId ?? rawTrainee?.id ?? "43292147-823d-4920-9c38-03029cfbe0bb",

    course: courseLabel,

  };



  const [dbInsights, setDbInsights] = useState(null);

  const [submissionData, setSubmissionData] = useState(null);

  const [eegReading, setEegReading] = useState(null);

  const [flaggedItems, setFlaggedItems] = useState([]);



  const parseList = (data) => {

    if (!data) return [];

    if (typeof data === "string") {

      try {

        const parsed = JSON.parse(data);

        return Array.isArray(parsed) ? parsed : [data];

      } catch {

        return [data];

      }

    }

    return Array.isArray(data) ? data : [];

  };



  useEffect(() => {

    async function fetchEvidenceData() {

      if (!submissionId) {

        setLoading(false);

        return;

      }

      setLoading(true);



      try {

        const { data: sub } = await supabase

          .from("assessment_submissions")

          .select("id, total_score, passed, overall_result, assessment_id")

          .eq("id", submissionId)

          .maybeSingle();



        if (sub) {

          setSubmissionData(sub);



          const actualAssessmentId = sub.assessment_id || assessmentId;

          if (actualAssessmentId) {

            const { data: qList } = await supabase

              .from("questions")

              .select("id, item_number, question_text, correct_answer, difficulty, cognitive_level")

              .eq("assessment_id", actualAssessmentId)

              .order("item_number", { ascending: true });



            const { data: answers } = await supabase

              .from("trainee_answers")

              .select("question_id, text_answer, is_correct, response_time_seconds, answer_changes_count")

              .eq("submission_id", submissionId);



            const { data: eegData } = await supabase

              .from("trainee_eeg_readings")

              .select("id, total_segments, status")

              .eq("submission_id", submissionId)

              .maybeSingle();



            if (eegData) setEegReading(eegData);



            const hasEeg = Boolean(eegData && (eegData.total_segments > 0 || eegData.status === "completed"));

            const ansMap = {};

            if (answers) answers.forEach((a) => (ansMap[a.question_id] = a));



            const flags = [];

            (qList || []).forEach((q) => {

              const ans = ansMap[q.id];

              if (!ans) return;



              const isIncorrect = !ans.is_correct;

              const highAnswerChanges = (ans.answer_changes_count || 0) > 1;

              const longResponseTime = (ans.response_time_seconds || 0) > 90;



              let flagReason = null;



              if (isIncorrect) {

                if (hasEeg) {

                  flagReason = "Incorrect response with temporally matched EEG context available for assessor verification.";

                } else {

                  flagReason = "Incorrect response item requiring domain competency review.";

                }

              } else if (highAnswerChanges || longResponseTime) {

                flagReason = `Correct response exhibiting unusual assessment behavior (${

                  highAnswerChanges ? `${ans.answer_changes_count} answer revisions` : ""

                }${highAnswerChanges && longResponseTime ? ", " : ""}${

                  longResponseTime ? `${ans.response_time_seconds}s response duration` : ""

                }). Pattern surfaced for assessor review; available evidence does not establish cause.`;

              }



              if (flagReason) {

                flags.push({

                  questionId: q.id,

                  itemNumber: q.item_number,

                  questionText: q.question_text,

                  correctAnswer: q.correct_answer || "Refer to answer key",

                  traineeAnswer: ans.text_answer || "No response submitted",

                  isCorrect: ans.is_correct,

                  difficulty: q.difficulty || "Standard",

                  cognitiveLevel: q.cognitive_level || "Core Domain Knowledge",

                  responseTime: ans.response_time_seconds ? `${ans.response_time_seconds}s` : "N/A",

                  answerChanges: ans.answer_changes_count ?? 0,

                  eegAvailable: hasEeg,

                  flagReason,

                });

              }

            });



            setFlaggedItems(flags);

          }

        }



        const { data: insights } = await supabase

          .from("ai_assessment_insights")

          .select(`

            overall_summary,

            cognitive_analysis,

            ai_cognitive_insights,

            strengths,

            areas_for_improvement,

            assessor_strengths,

            assessor_areas_for_improvement,
            grade_recommendation
          `)

          .eq("submission_id", submissionId)

          .maybeSingle();



        if (insights) setDbInsights(insights);



      } catch (err) {

        console.warn("Error loading evidence:", err);

      } finally {

        setLoading(false);

      }

    }



    fetchEvidenceData();

  }, [submissionId, assessmentId]);



  const handleProceedToDecision = () => {

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const scrollContainers = document.querySelectorAll("main, #main-content, .overflow-y-auto");

    scrollContainers.forEach((container) => {

      container.scrollTop = 0;

    });



    navigate("/assessor/evaluation/finalize", {

      state: {

        selectedCourse,

        selectedTrainee: rawTrainee,

        evaluationSummary,

        submissionId,

        assessmentId,

      },

    });

  };



  const handleBackToSummary = () => {

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const scrollContainers = document.querySelectorAll("main, #main-content, .overflow-y-auto");

    scrollContainers.forEach((container) => {

      container.scrollTop = 0;

    });



    navigate("/assessor/evaluation/summary", {

      state: {

        selectedCourse,

        selectedTrainee: rawTrainee,

        submissionId,

        assessmentId,

      },

    });

  };



  const assessorStrengths = parseList(dbInsights?.assessor_strengths ?? dbInsights?.strengths);

  const assessorAreas = parseList(dbInsights?.assessor_areas_for_improvement ?? dbInsights?.areas_for_improvement);

  const aiInsights = parseList(dbInsights?.ai_cognitive_insights);



  const suggestedResult =
    dbInsights?.grade_recommendation ??
    (submissionData?.passed === true
      ? "Competent"
      : submissionData?.passed === false
        ? "Not Yet Competent"
        : "Insufficient Evidence");



  return (

    <div className="w-full space-y-6">

      <AssessorBreadcrumbs

        items={[

          { label: courseLabel, to: "/assessor/evaluation" },

          { label: "Trainees Evaluation", to: "/assessor/evaluation/trainees" },

          { label: "Evaluation Summary", to: "/assessor/evaluation/summary" },

          "AI Analysis & Insights",

        ]}

      />



      <AssessorPageHeader

        title="AI Analysis & Insights"

        subtitle="Review AI-supported evidence and assessment findings before finalizing the evaluation."

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

              <p className="text-xs font-bold text-slate-900 mt-0.5">{traineeObj.name}</p>

            </div>

          </div>



          <div className="flex items-center gap-3.5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">

              <GraduationCap size={18} />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course / Qualification</p>

              <p className="text-xs font-bold text-slate-900 mt-0.5">{traineeObj.course}</p>

            </div>

          </div>



          <div className="flex items-center gap-3.5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">

              <IdCard size={18} />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trainee ID</p>

              <p className="font-mono text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[160px]">{traineeObj.id}</p>

            </div>

          </div>



          <div className="flex items-center gap-3.5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">

              <Calendar size={18} />

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessment Date</p>

              <p className="text-xs font-bold text-slate-800 mt-0.5">September 19, 2026</p>

            </div>

          </div>

        </div>

      </div>



      {loading ? (

        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-xs font-semibold text-slate-500 shadow-xs">

          Loading AI analysis and assessment evidence...

        </div>

      ) : (

        <div className="space-y-6">

          {/* ROW 1: AI-Supported Recommendation (Left) & Overall Assessment Analysis (Right) */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Left Card 1 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-4">

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">

                      <ShieldCheck size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI-Supported Recommendation</h3>

                  </div>

                  <span className={`rounded-lg border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${

                    submissionData?.passed 

                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 

                      : "bg-amber-50 text-amber-700 border-amber-200"

                  }`}>

                    {suggestedResult}

                  </span>

                </div>



                <div className="flex items-center gap-3.5 pt-1">

                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${

                    submissionData?.passed 

                      ? "bg-emerald-50 text-emerald-600" 

                      : "bg-amber-50 text-amber-600"

                  }`}>

                    <ShieldCheck size={22} />

                  </div>

                  <div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">

                      Suggested Result

                    </span>

                    <span className="text-2xl font-black text-slate-900 tracking-tight block">

                      {suggestedResult.toUpperCase()}

                    </span>

                  </div>

                </div>



                <p className="text-xs text-slate-600 leading-relaxed font-medium">

                  {dbInsights?.overall_summary ?? "AI analysis synthesized to support human assessor evaluation."}

                </p>

              </div>



              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">

                AI supports assessor review. The final assessment decision remains with the assessor.

              </p>

            </div>



            {/* Right Card 1 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3">

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">

                      <BarChart3 size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Overall Assessment Analysis</h3>

                  </div>

                  {dbInsights?.cognitive_analysis && (

                    <button

                      type="button"

                      onClick={() => setExpandCognitive(!expandCognitive)}

                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"

                    >

                      {expandCognitive ? "Collapse" : "View details"}

                    </button>

                  )}

                </div>



                {dbInsights?.cognitive_analysis ? (

                  <p className={`text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-medium transition-all ${

                    expandCognitive ? "max-h-60 overflow-y-auto" : "line-clamp-4"

                  }`}>

                    {dbInsights.cognitive_analysis}

                  </p>

                ) : (

                  <p className="text-xs text-slate-500 italic">No overall analysis text recorded.</p>

                )}

              </div>

            </div>

          </div>



          {/* ROW 2: Areas for Improvement (Left) & Assessment Strengths (Right) */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Left Card 2 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3">

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">

                      <AlertTriangle size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Areas for Improvement</h3>

                  </div>

                  {assessorAreas.length > 2 && (

                    <button

                      type="button"

                      onClick={() => setExpandAreas(!expandAreas)}

                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition"

                    >

                      {expandAreas ? "Collapse" : "View details"}

                    </button>

                  )}

                </div>



                {assessorAreas.length > 0 ? (

                  <ul className={`space-y-2.5 text-xs text-slate-600 font-medium ${expandAreas ? "max-h-60 overflow-y-auto pr-1" : ""}`}>

                    {(expandAreas ? assessorAreas : assessorAreas.slice(0, 2)).map((item, idx) => (

                      <li key={idx} className="flex items-start gap-2.5">

                        <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />

                        <span>{item}</span>

                      </li>

                    ))}

                  </ul>

                ) : (

                  <p className="text-xs text-slate-500 italic">No specific areas for improvement flagged.</p>

                )}

              </div>

            </div>



            {/* Right Card 2 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3">

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">

                      <CheckCircle2 size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assessment Strengths</h3>

                  </div>

                  {assessorStrengths.length > 2 && (

                    <button

                      type="button"

                      onClick={() => setExpandStrengths(!expandStrengths)}

                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition"

                    >

                      {expandStrengths ? "Collapse" : "View details"}

                    </button>

                  )}

                </div>



                {assessorStrengths.length > 0 ? (

                  <ul className={`space-y-2.5 text-xs text-slate-600 font-medium ${expandStrengths ? "max-h-60 overflow-y-auto pr-1" : ""}`}>

                    {(expandStrengths ? assessorStrengths : assessorStrengths.slice(0, 2)).map((item, idx) => (

                      <li key={idx} className="flex items-start gap-2.5">

                        <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />

                        <span>{item}</span>

                      </li>

                    ))}

                  </ul>

                ) : (

                  <p className="text-xs text-slate-500 italic">No specific strength items recorded.</p>

                )}

              </div>

            </div>

          </div>



          {/* ROW 3: AI Assessment Insights (Left) & Assessment Review Flags (Right) */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Left Card 3 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3">

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">

                      <Sparkles size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Assessment Insights</h3>

                  </div>

                  {aiInsights.length > 2 && (

                    <button

                      type="button"

                      onClick={() => setExpandInsights(!expandInsights)}

                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"

                    >

                      {expandInsights ? "Collapse" : "View details"}

                    </button>

                  )}

                </div>



                {aiInsights.length > 0 ? (

                  <ul className={`space-y-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-medium ${expandInsights ? "max-h-64 overflow-y-auto pr-1" : ""}`}>

                    {(expandInsights ? aiInsights : aiInsights.slice(0, 3)).map((insight, idx) => (

                      <li key={idx} className="flex items-start gap-2.5">

                        <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-600 shrink-0" />

                        <span>{insight}</span>

                      </li>

                    ))}

                  </ul>

                ) : (

                  <p className="text-xs text-slate-500 italic">No additional AI insights recorded.</p>

                )}

              </div>

            </div>



            {/* Right Card 3 */}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-4">

              <div className="space-y-4">

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                  <div className="flex items-center gap-2.5">

                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">

                      <Flag size={16} />

                    </div>

                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assessment Review Flags</h3>

                  </div>

                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs">

                    {flaggedItems.length} Items Flagged

                  </span>

                </div>



                <p className="text-xs text-slate-600 leading-relaxed font-medium">

                  These assessment items were flagged because the available assessment evidence may benefit from closer assessor inspection. EEG information is supplementary and does not determine correctness or establish a specific mental state.

                </p>



                {flaggedItems.length > 0 ? (

                  <div className="space-y-4 pt-1 max-h-[500px] overflow-y-auto pr-1">

                    {flaggedItems.map((flag) => (

                      <div key={flag.questionId} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 transition hover:border-slate-300">

                        <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 pb-2.5">

                          <div>

                            <span className="font-mono text-[10px] font-bold text-slate-400">Question #{flag.itemNumber}</span>

                            <h4 className="text-xs font-bold text-slate-900 mt-0.5">{flag.questionText}</h4>

                          </div>

                          <span className={`shrink-0 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${

                            flag.isCorrect 

                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 

                              : "bg-rose-50 text-rose-700 border-rose-200"

                          }`}>

                            {flag.isCorrect ? "Correct" : "Incorrect"}

                          </span>

                        </div>



                        <div className="grid grid-cols-1 gap-2 text-xs">

                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">

                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Trainee Answer</span>

                            <p className="font-bold text-slate-800">{flag.traineeAnswer}</p>

                          </div>



                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">

                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Authoritative Answer</span>

                            <p className="font-bold text-slate-800">{flag.correctAnswer}</p>

                          </div>

                        </div>



                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs space-y-1 shadow-xs">

                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assessment Context</span>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-semibold">

                            <div><span className="text-slate-400 font-normal">Difficulty:</span> {flag.difficulty}</div>

                            <div><span className="text-slate-400 font-normal">Cognitive:</span> {flag.cognitiveLevel}</div>

                            <div><span className="text-slate-400 font-normal">Duration:</span> {flag.responseTime}</div>

                            <div><span className="text-slate-400 font-normal">Revisions:</span> {flag.answerChanges}</div>

                          </div>

                        </div>



                        <div className="text-xs space-y-1 bg-amber-50/50 border border-amber-200/80 p-3 rounded-lg">

                          <div className="flex items-center gap-1.5 text-amber-800">

                            <Brain size={14} />

                            <span className="text-[10px] font-bold uppercase tracking-wider block">

                              EEG Context & Review Reason

                            </span>

                          </div>

                          <p className="text-amber-950 font-semibold leading-relaxed">{flag.flagReason}</p>

                          <p className="text-[11px] text-amber-700/80 italic mt-1 font-medium">

                            {flag.eegAvailable

                              ? "Question-level EEG information was temporally matched to this assessment interval as supplementary evidence."

                              : "EEG Evidence: Not available for this item. Item evaluated using response and behavior context only."}

                          </p>

                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <div className="p-4 rounded-xl bg-slate-50/50 text-center text-xs text-slate-500 border border-slate-200/60 space-y-1 my-auto">

                    <p className="font-bold text-slate-700">No formal assessment review flags were generated for this assessment.</p>

                    <p className="text-[11px] text-slate-400 font-medium">

                      AI findings may still identify areas for assessor follow-up; these are not classified as formal review flags unless the system's review criteria are met.

                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>



          {/* Evidence Used Context Container (Hover Effect Removed on Icon) */}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md space-y-3">

            <button

              type="button"

              onClick={() => setShowEvidence(!showEvidence)}

              className="w-full flex items-center justify-between text-left focus:outline-none"

            >

              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">

                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">

                  <FileText size={16} />

                </div>

                <span>Evidence Used in AI Analysis</span>

              </span>

              <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">

                <span>{showEvidence ? "Hide Context" : "View Context"}</span>

                {showEvidence ? <ChevronUp size={15} /> : <ChevronDown size={15} />}

              </div>

            </button>



            {showEvidence && (

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 leading-relaxed font-medium">

                <p><strong className="text-slate-800">Assessment Responses:</strong> Assessment answers, correctness, and item scores were evaluated as assessment evidence.</p>

                <p><strong className="text-slate-800">Assessment Behavior:</strong> Question completion timing and submission logs were considered where available.</p>

                {eegReading ? (

                  <p><strong className="text-slate-800">EEG Evidence:</strong> Question-level EEG information was temporally matched to assessment intervals and used as supplementary evidence.</p>

                ) : (

                  <p><strong className="text-slate-800">Missing EEG Data:</strong> Questions without usable EEG information were evaluated using the available assessment evidence and were not penalized solely because EEG data was unavailable.</p>

                )}

              </div>

            )}

          </div>



          {/* Bottom Navigation Action Buttons */}

          <div className="flex justify-between items-center pt-2">

            <button

              type="button"

              onClick={handleBackToSummary}

              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"

            >

              <ArrowLeft size={15} />

              <span>Back to Evaluation Summary</span>

            </button>



            <button

              type="button"

              onClick={handleProceedToDecision}

              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.99]"

            >

              <span>Continue to Final Evaluation</span>

              <ArrowRight size={15} />

            </button>

          </div>

        </div>

      )}

    </div>

  );

}