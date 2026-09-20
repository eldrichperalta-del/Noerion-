import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Check,
  CheckCircle,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  History,
  AlertTriangle,
  WifiOff,
  Activity,
} from "lucide-react";
import { supabase } from "../../../supabaseClient";

const TESTING_TIME_SECONDS = null;
const PASSING_PERCENTAGE = 0.50;

const toAssignmentIdOrNull = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim();
  return /^\d+$/.test(str) ? Number(str) : null;
};

const toUUIDOrNull = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str) ? str : null;
};

const getQuestionKey = (question, index) =>
  question?.id ?? `question-${index}`;

const normalizeQuestionType = (q) => {
  const rawSection = (q?.test_section || "").toLowerCase().trim();
  const rawType = (q?.question_type || q?.type || "").toLowerCase().trim();

  if (rawSection === "matching" || rawType.includes("match")) return "Matching Type";
  if (rawSection === "true_false" || rawType.includes("true") || rawType.includes("boolean")) return "True / False";
  if (rawSection === "identification" || rawType.includes("ident") || rawType.includes("short")) return "Identification";
  return "Multiple Choice";
};

const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

const evaluateAnswer = (userAnswer, answerKeyObj, questionObj) => {
  if (!answerKeyObj || answerKeyObj.correct_answer === undefined || answerKeyObj.correct_answer === null) {
    return { isCorrect: false, points: 0 };
  }

  const rawUserAns = String(userAnswer || "").trim().toLowerCase();
  const rawCorrectKey = String(answerKeyObj.correct_answer).trim().toLowerCase();

  if (!rawUserAns) return { isCorrect: false, points: 0 };

  const qType = normalizeQuestionType(questionObj);

  if (qType === "Identification") {
    // Normalize Identification answers so uppercase/lowercase
    // and extra spaces do not affect grading.
    //
    // "|" means alternative acceptable answers.
    // "/" is preserved as part of the actual answer.
    //
    // Examples:
    // DB: "CLEANING | DUSTING"
    // User: "cleaning" -> CORRECT
    // User: "DUSTING" -> CORRECT
    //
    // DB: "ANTIVIRUS SCAN / MALWARE SCAN"
    // User: "antivirus scan / malware scan" -> CORRECT

    const normalizeIdentificationAnswer = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const normalizedUserAnswer = normalizeIdentificationAnswer(userAnswer);

    const validAnswers = String(answerKeyObj.correct_answer)
      .split("|")
      .map(normalizeIdentificationAnswer)
      .filter(Boolean);

    const isCorrect = validAnswers.includes(normalizedUserAnswer);

    return { isCorrect, points: isCorrect ? 1 : 0 };
  }

  if (qType === "True / False") {
    const isUserTrue = rawUserAns === "true" || rawUserAns === "t";
    const isKeyTrue = rawCorrectKey === "true" || rawCorrectKey === "t";
    return { isCorrect: isUserTrue === isKeyTrue, points: isUserTrue === isKeyTrue ? 1 : 0 };
  }

  if (qType === "Multiple Choice") {
    if (rawUserAns === rawCorrectKey) return { isCorrect: true, points: 1 };

    if (questionObj?.rawOptions?.length > 0) {
      const userOpt = questionObj.rawOptions.find(
        (opt) =>
          String(opt.option_text || "").trim().toLowerCase() === rawUserAns ||
          String(opt.option_letter || "").trim().toLowerCase() === rawUserAns
      );

      if (userOpt) {
        const userLetter = String(userOpt.option_letter || "").trim().toLowerCase();
        const userText = String(userOpt.option_text || "").trim().toLowerCase();
        if (userLetter === rawCorrectKey || userText === rawCorrectKey) {
          return { isCorrect: true, points: 1 };
        }
      }
    }

    return { isCorrect: false, points: 0 };
  }

  return { isCorrect: rawUserAns === rawCorrectKey, points: rawUserAns === rawCorrectKey ? 1 : 0 };
};

export default function WrittenAssessment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [assessment, setAssessment] = useState(state?.assessment || null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract raw params and persist assignment ID locally to guarantee resolution
  // Extract raw params and persist assignment ID locally to guarantee resolution
  // assignments.id is BIGINT, while assessment/submission/baseline/trainee IDs are UUIDs.
  const rawAssignmentId = state?.assignmentId || state?.assessment?.id || localStorage.getItem("active_assignment_id");
  const normalizedAssignmentId = toAssignmentIdOrNull(rawAssignmentId);

  if (normalizedAssignmentId !== null) {
    localStorage.setItem("active_assignment_id", String(normalizedAssignmentId));
  } else if (toUUIDOrNull(rawAssignmentId)) {
    localStorage.setItem("active_assignment_id", toUUIDOrNull(rawAssignmentId));
  }

  const assessmentIdKey =
    normalizedAssignmentId !== null
      ? String(normalizedAssignmentId)
      : toUUIDOrNull(rawAssignmentId) || "active_assessment";

  const rawAssessmentIdRef = state?.assessmentId || state?.assessment?.assessment_id || localStorage.getItem("active_assignment_id_ref");
  const rawBaselineId = state?.baselineId || localStorage.getItem("active_baseline_id");
  const baselineId = toUUIDOrNull(rawBaselineId);

  const rawTraineeId = state?.traineeId || localStorage.getItem("trainee_id") || localStorage.getItem("user_id");
  const traineeId = toUUIDOrNull(rawTraineeId);

  const startedAt = state?.startedAt || null;

  const answersStorageKey = `trainee_answers_draft_${assessmentIdKey}`;
  const timerStorageKey = `assessment_end_time_${assessmentIdKey}`;
  const questionIndexStorageKey = `trainee_current_question_${assessmentIdKey}`;
  const completionKey = `assessment_completed_${assessmentIdKey}`;

  const [currentQuestion, setCurrentQuestion] = useState(() => {
    try {
      const savedIndex = localStorage.getItem(questionIndexStorageKey);
      return savedIndex !== null ? parseInt(savedIndex, 10) : state?.currentQuestionIndex || 0;
    } catch {
      return state?.currentQuestionIndex || 0;
    }
  });

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(answersStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [answerLogs, setAnswerLogs] = useState([]);
  const [traineeName, setTraineeName] = useState("Trainee");
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // =========================================================================
  // LIVE EEG & SIGNAL LOSS SAFETY STATE (SINGLE SESSION)
  // =========================================================================
  const MIDDLEWARE_WS_URL = "ws://127.0.0.1:8000/ws/eeg";
  const wsRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const eegReadingIdRef = useRef(null);

  const [deviceConnected, setDeviceConnected] = useState(false);
  const [signalQuality, setSignalQuality] = useState("good");
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  const badSignalCounterRef = useRef(0);
  const lastMessageTimeRef = useRef(null);
  const hasReceivedFirstMessageRef = useRef(false);
  const [isEegPaused, setIsEegPaused] = useState(false);
  const [eegWarningReason, setEegWarningReason] = useState("");

  // Start active assessment session
  const startEEGMonitoring = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: sessionStartedRef.current ? "RESUME_ACTIVE_ASSESSMENT" : "START_ACTIVE_ASSESSMENT",
          type: sessionStartedRef.current ? "RESUME_ACTIVE_ASSESSMENT" : "START_ACTIVE_ASSESSMENT",
          assignment_id: normalizedAssignmentId,
          assessment_id: toUUIDOrNull(rawAssessmentIdRef),
          submission_id: null,
          baseline_id: baselineId || null,
          trainee_id: traineeId || null,
        })
      );
      sessionStartedRef.current = true;
      setIsMonitoringActive(true);
    }
  }, [normalizedAssignmentId, rawAssignmentId, rawAssessmentIdRef, baselineId, traineeId]);

  // Soft pause stream on signal loss
  const pauseEEGMonitoring = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: "PAUSE_ACTIVE_ASSESSMENT",
          type: "PAUSE_ACTIVE_ASSESSMENT",
          assignment_id: normalizedAssignmentId,
          assessment_id: toUUIDOrNull(rawAssessmentIdRef),
          trainee_id: traineeId || null,
        })
      );
    }
    setIsMonitoringActive(false);
  }, [normalizedAssignmentId, rawAssignmentId, rawAssessmentIdRef, traineeId]);

  // Final teardown on full submission
  const stopEEGMonitoring = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: "STOP_ACTIVE_ASSESSMENT",
          type: "STOP_ACTIVE_ASSESSMENT",
          assignment_id: normalizedAssignmentId,
          assessment_id: toUUIDOrNull(rawAssessmentIdRef),
          trainee_id: traineeId || null,
        })
      );
    }
    setIsMonitoringActive(false);
  }, [normalizedAssignmentId, rawAssignmentId, rawAssessmentIdRef, traineeId]);

  // Update session parameters mid-stream if IDs resolve late
  useEffect(() => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      sessionStartedRef.current &&
      (normalizedAssignmentId !== null || toUUIDOrNull(rawAssignmentId))
    ) {
      wsRef.current.send(
        JSON.stringify({
          command: "UPDATE_SESSION_METADATA",
          type: "UPDATE_SESSION_METADATA",
          assignment_id: normalizedAssignmentId,
          assessment_id: toUUIDOrNull(rawAssessmentIdRef),
          trainee_id: traineeId,
        })
      );
    }
  }, [normalizedAssignmentId, rawAssignmentId, rawAssessmentIdRef, traineeId]);

  useEffect(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const ws = new WebSocket(MIDDLEWARE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setDeviceConnected(true);
      lastMessageTimeRef.current = Date.now();
      startEEGMonitoring();
    };

    ws.onmessage = (event) => {
      try {
        hasReceivedFirstMessageRef.current = true;
        lastMessageTimeRef.current = Date.now();

        const data = JSON.parse(event.data);
        const payload = data?.data || data;

        const incomingReadingId = toUUIDOrNull(payload?.reading_id);
        if (incomingReadingId) {
          eegReadingIdRef.current = incomingReadingId;
        }

        if (payload) {
          const connected = payload.device_connected ?? (payload.status === "ACTIVE" || payload.status === "CONNECTED");
          const rawQuality = payload.signal_quality || (connected ? "good" : "no signal");
          const quality = String(rawQuality).toLowerCase();

          setDeviceConnected(Boolean(connected));
          setSignalQuality(quality);

          if (!connected || !quality.includes("good")) {
            badSignalCounterRef.current += 1;
            if (badSignalCounterRef.current >= 4) {
              setIsEegPaused(true);
              setEegWarningReason(!connected ? "Headband disconnected." : `Signal Issue: ${payload.signal_quality}`);
              pauseEEGMonitoring();
            }
          } else {
            badSignalCounterRef.current = 0;
            setIsEegPaused((prev) => {
              if (prev) {
                setEegWarningReason("");
                startEEGMonitoring();
              }
              return false;
            });
          }
        }
      } catch (err) {
        console.error("Error parsing EEG frame:", err);
      }
    };

    ws.onerror = () => {
      setDeviceConnected(false);
      badSignalCounterRef.current += 1;
      if (badSignalCounterRef.current >= 3) {
        setIsEegPaused(true);
        setEegWarningReason("EEG connection error. Please adjust headband contact.");
        pauseEEGMonitoring();
      }
    };

    ws.onclose = () => {
      setDeviceConnected(false);
      setIsMonitoringActive(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [rawAssignmentId, rawAssessmentIdRef, assessmentIdKey, baselineId, traineeId, startEEGMonitoring, pauseEEGMonitoring]);

  // Watchdog Timer for Stream Silence
  useEffect(() => {
    if (loading || !isMonitoringActive) return;

    const watchdog = setInterval(() => {
      if (!hasReceivedFirstMessageRef.current) return;

      if (lastMessageTimeRef.current && Date.now() - lastMessageTimeRef.current > 4500) {
        setDeviceConnected(false);
        setIsEegPaused(true);
        setEegWarningReason("Signal stream interrupted. Please check headband fitting.");
        pauseEEGMonitoring();
      }
    }, 1500);

    return () => clearInterval(watchdog);
  }, [loading, isMonitoringActive, pauseEEGMonitoring]);

  const isSubmittingRef = useRef(false);
  const lastInteractionTimeRef = useRef(Date.now());
  const itemInteractionTimeRef = useRef({});
  const logTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    };
  }, []);

  const handleCompletionDone = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const submittedAt = new Date().toISOString();

    stopEEGMonitoring();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const assignmentId = toAssignmentIdOrNull(assessment?.id || state?.assignmentId || rawAssignmentId);
        const targetAssessmentId = toUUIDOrNull(
          assessment?.assessment_id || state?.assessmentId || rawAssessmentIdRef || questions[0]?.assessment_id
        );
        const validUserUuid = toUUIDOrNull(user.id);

        const questionIds = questions.map((q) => toUUIDOrNull(q.id)).filter(Boolean);
        let answerKeysMap = {};

        if (questionIds.length > 0) {
          const { data: keysData } = await supabase
            .from("answer_keys")
            .select("question_id, correct_answer, explanation")
            .in("question_id", questionIds);

          if (keysData) {
            answerKeysMap = keysData.reduce((acc, keyObj) => {
              acc[keyObj.question_id] = keyObj;
              return acc;
            }, {});
          }
        }

        let totalScore = 0;
        const totalPossibleQuestions = questions.length;

        const traineeAnswerRowsPrepared = questions.map((q, idx) => {
          const key = getQuestionKey(q, idx);
          const userAns = answers[q.id] !== undefined ? answers[q.id] : answers[key];
          const answerKeyObj = answerKeysMap[q.id];
          const evaluation = evaluateAnswer(userAns, answerKeyObj, q);

          if (evaluation.isCorrect) totalScore += evaluation.points;

          let selectedOptionId = null;
          if (q.rawOptions && q.rawOptions.length > 0) {
            const rawAnsStr = String(userAns || "").trim().toLowerCase();
            const matchedOpt = q.rawOptions.find(
              (opt) =>
                String(opt.option_text || "").trim().toLowerCase() === rawAnsStr ||
                String(opt.option_letter || "").trim().toLowerCase() === rawAnsStr
            );
            if (matchedOpt) selectedOptionId = toUUIDOrNull(matchedOpt.id);
          }

          return {
            question_id: toUUIDOrNull(q.id),
            selected_option_id: selectedOptionId,
            text_answer: typeof userAns === "object" ? JSON.stringify(userAns) : String(userAns || ""),
            is_correct: evaluation.isCorrect,
            points_awarded: evaluation.points,
            created_at: new Date().toISOString(),
          };
        });

        const passStatus = totalPossibleQuestions > 0 ? totalScore / totalPossibleQuestions >= PASSING_PERCENTAGE : false;

        const { data: subData, error: subErr } = await supabase
          .from("assessment_submissions")
          .insert({
            assignment_id: assignmentId,
            assessment_id: targetAssessmentId,
            trainee_id: validUserUuid,
            status: "submitted",
            total_score: totalScore,
            passed: passStatus,
            started_at: startedAt,
            submitted_at: submittedAt,
          })
          .select()
          .maybeSingle();

        if (subErr) throw subErr;

        const submissionId = toUUIDOrNull(subData?.id);

        if (submissionId) {
          if (traineeAnswerRowsPrepared.length > 0) {
            const finalAnswerRows = traineeAnswerRowsPrepared.map((row) => ({
              ...row,
              submission_id: submissionId,
            }));

            await supabase.from("trainee_answers").insert(finalAnswerRows);
          }

          await supabase.from("assessment_submissions").update({
            total_score: totalScore,
            passed: passStatus,
          }).eq("id", submissionId);

          if (answerLogs.length > 0) {
            const logRows = answerLogs.map((log) => ({
              submission_id: submissionId,
              trainee_id: validUserUuid,
              question_id: toUUIDOrNull(log.questionId),
              question_number: log.questionNumber ? parseInt(log.questionNumber, 10) : null,
              event_type: log.eventType || "ANSWER_SELECTION",
              sub_key: log.subKey || null,
              entered_answer: String(log.answer || ""),
              time_spent_seconds: parseFloat(log.timeSpentSeconds) || 0,
              event_timestamp: log.timestamp || new Date().toISOString(),
            }));

            await supabase.from("assessment_event_logs").insert(logRows);
          }

          // EXACT EEG READING LINKING FIX
          // The middleware creates one parent EEG reading and broadcasts its UUID.
          // Keep that UUID and update only that exact row after submission exists.
          const eegReadingId = eegReadingIdRef.current;

          // Temporary browser-session RLS diagnostic. This tells us which auth.uid()
          // the authenticated React/Supabase client is actually using.
          const {
            data: { user: debugUser },
          } = await supabase.auth.getUser();

          console.log("🔍 EEG RLS DEBUG:", {
            authUserId: debugUser?.id,
            eegReadingId,
            submissionId,
          });

          if (eegReadingId) {
            const { data: updatedEegRow, error: eegUpdateErr } = await supabase
              .from("trainee_eeg_readings")
              .update({
                submission_id: submissionId,
                assignment_id: assignmentId,
                status: "COMPLETED",
                updated_at: new Date().toISOString(),
              })
              .eq("id", eegReadingId)
              .select("id, trainee_id, assessment_id, assignment_id, submission_id, status")
              .maybeSingle();

            if (eegUpdateErr) {
              console.error("❌ Error linking EEG reading to submission:", eegUpdateErr);
            } else if (!updatedEegRow) {
              console.error("❌ EEG reading update affected 0 rows. Possible RLS/update-policy issue.", {
                eegReadingId,
                submissionId,
              });
            } else if (updatedEegRow.submission_id !== submissionId) {
              console.error("❌ EEG reading update returned an unexpected submission_id:", {
                eegReadingId,
                expectedSubmissionId: submissionId,
                actualSubmissionId: updatedEegRow.submission_id,
                row: updatedEegRow,
              });
            } else {
              console.log(
                "✅ EEG reading linked to submission:",
                eegReadingId,
                "→",
                submissionId
              );
              eegReadingIdRef.current = null;
            }
          } else {
            console.warn("⚠️ Could not link EEG reading to submission: reading_id was not received from middleware.", {
              eegReadingId,
              submissionId,
            });
          }

          if (assignmentId) {
            await supabase.from("assignments").update({
              status: "Completed",
              completed_at: new Date().toISOString(),
            }).eq("id", assignmentId);
          }
        }

        localStorage.setItem(completionKey, "true");
        localStorage.removeItem(timerStorageKey);
        localStorage.removeItem(answersStorageKey);
        localStorage.removeItem(questionIndexStorageKey);
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
    } finally {
      setIsSubmitting(false);
      navigate("/trainee/assessment/overview", {
        replace: true,
        state: {
          assessment: {
            ...assessment,
            status: "Completed",
            traineeAnswers: answers,
            answerLogs: answerLogs,
          },
        },
      });
    }
  }, [
    answers,
    answerLogs,
    assessment,
    answersStorageKey,
    timerStorageKey,
    questionIndexStorageKey,
    completionKey,
    questions,
    navigate,
    state,
    rawAssignmentId,
    rawAssessmentIdRef,
    stopEEGMonitoring,
    startedAt,
  ]);

  useEffect(() => {
    localStorage.setItem(questionIndexStorageKey, currentQuestion.toString());
  }, [currentQuestion, questionIndexStorageKey]);

  useEffect(() => {
    if (showCompletion || loading) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Assessment in progress. If you leave, your active session timer will continue!";
      return event.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showCompletion, loading]);

  useEffect(() => {
    async function loadAssessmentData() {
      if (localStorage.getItem(completionKey) === "true") {
        navigate("/trainee/assessment/overview", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user && toUUIDOrNull(user.id)) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && (profile.first_name || profile.last_name)) {
            setTraineeName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim());
          }
        }

        let formattedQuestions = [];
        let durationMinutes = 30;

        if (state?.assessment?.questions?.length > 0) {
          formattedQuestions = state.assessment.questions.map((q) => ({
            ...q,
            type: normalizeQuestionType(q),
          }));
          durationMinutes = state.assessment.durationMinutes || state.assessment.time_limit_minutes || 30;
        } else {
          const assignmentId = toAssignmentIdOrNull(state?.assignmentId || state?.assessment?.id || rawAssignmentId);
          const assessmentId = toUUIDOrNull(state?.assessmentId || state?.assessment?.assessment_id || rawAssessmentIdRef);

          if (assignmentId || assessmentId) {
            let assignmentData = null;
            if (assignmentId) {
              const { data: assignData } = await supabase
                .from("assignments")
                .select("*")
                .eq("id", assignmentId)
                .maybeSingle();
              assignmentData = assignData;
            }

            if (assignmentData?.status === "Completed") {
              localStorage.setItem(completionKey, "true");
              navigate("/trainee/assessment/overview", { replace: true });
              return;
            }

            const targetAssessmentId = assessmentId || toUUIDOrNull(assignmentData?.assessment_id);

            if (targetAssessmentId) {
              const { data: assessData } = await supabase
                .from("assessments")
                .select("title, time_limit_minutes")
                .eq("id", targetAssessmentId)
                .maybeSingle();

              if (assessData?.time_limit_minutes) durationMinutes = assessData.time_limit_minutes;

              const { data: questionsData } = await supabase
                .from("questions")
                .select("*")
                .eq("assessment_id", targetAssessmentId)
                .order("item_number", { ascending: true });

              if (questionsData?.length > 0) {
                const questionIds = questionsData.map((q) => toUUIDOrNull(q.id)).filter(Boolean);
                const { data: optionsData } = await supabase
                  .from("question_options")
                  .select("*")
                  .in("question_id", questionIds);

                const optionsMap = (optionsData || []).reduce((acc, opt) => {
                  if (!acc[opt.question_id]) acc[opt.question_id] = [];
                  acc[opt.question_id].push(opt);
                  return acc;
                }, {});

                formattedQuestions = questionsData.map((q) => {
                  const rawOpts = optionsMap[q.id] || [];
                  const sortedOpts = rawOpts.sort((a, b) => (a.option_letter || "").localeCompare(b.option_letter || ""));

                  return {
                    id: q.id,
                    assessment_id: q.assessment_id,
                    question: q.question_text,
                    type: normalizeQuestionType(q),
                    test_section: q.test_section,
                    choices: sortedOpts.map((opt) => opt.option_text),
                    rawOptions: sortedOpts,
                    itemNumber: q.item_number,
                    columnBMatch: q.column_b_match,
                  };
                });
              }
            }

            setAssessment((prev) => ({
              ...prev,
              id: assignmentId || assignmentData?.id,
              assessment_id: targetAssessmentId,
              title: assignmentData?.assessment_name || prev?.title || "Written Assessment",
              qualification: assignmentData?.qualification || prev?.qualification || "NC II",
              unitOfCompetency: assignmentData?.assessment_name || "Core Unit",
              questions: formattedQuestions,
            }));
          }
        }

        setQuestions(formattedQuestions);

        let endTime = localStorage.getItem(timerStorageKey);
        if (!endTime) {
          const durationSeconds = TESTING_TIME_SECONDS !== null ? TESTING_TIME_SECONDS : durationMinutes * 60;
          endTime = Date.now() + durationSeconds * 1000;
          localStorage.setItem(timerStorageKey, endTime.toString());
        }

        const remainingMs = parseInt(endTime, 10) - Date.now();
        setRemainingSeconds(Math.max(0, Math.floor(remainingMs / 1000)));
      } catch (err) {
        console.error("Error loading assessment data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAssessmentData();
  }, [state, timerStorageKey, completionKey, navigate, rawAssignmentId, rawAssessmentIdRef]);

  // Assessment Timer with Target Delay Shift
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const interval = setInterval(() => {
      if (isEegPaused) {
        const savedEndTime = localStorage.getItem(timerStorageKey);
        if (savedEndTime) {
          const shiftedEndTime = parseInt(savedEndTime, 10) + 1000;
          localStorage.setItem(timerStorageKey, shiftedEndTime.toString());
        }
        return;
      }

      const savedEndTime = localStorage.getItem(timerStorageKey);
      if (!savedEndTime) return;

      const secondsLeft = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        setRemainingSeconds(0);

        if (!isSubmittingRef.current) {
          stopEEGMonitoring();
          setShowCompletion(true);
          handleCompletionDone();
        }
      } else {
        setRemainingSeconds(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, questions.length, timerStorageKey, handleCompletionDone, stopEEGMonitoring, isEegPaused]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(answersStorageKey, JSON.stringify(answers));
    }
  }, [answers, answersStorageKey]);

  const current = questions[currentQuestion];
  const currentKey = getQuestionKey(current, currentQuestion);
  const selectedAnswer = answers[currentKey];
  const totalItems = assessment?.totalItems || questions.length;

  const matchingQuestions = useMemo(() => {
    return questions.filter((q) => normalizeQuestionType(q) === "Matching Type");
  }, [questions]);

  const isMatchingBlock = normalizeQuestionType(current) === "Matching Type";

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    if (isMatchingBlock && matchingQuestions.length > 0) {
      const lastMatchingItem = matchingQuestions[matchingQuestions.length - 1];
      const matchIndex = questions.findIndex((q) => q.id === lastMatchingItem.id);
      return (((matchIndex >= 0 ? matchIndex : currentQuestion) + 1) / questions.length) * 100;
    }
    return ((currentQuestion + 1) / questions.length) * 100;
  }, [questions, currentQuestion, isMatchingBlock, matchingQuestions]);

  const remainingTime = useMemo(() => formatTime(remainingSeconds), [remainingSeconds]);

  const logAnswerEvent = (itemNum, answerValue, questionId, subKey = null, customType = "ANSWER_SELECTION") => {
    const now = Date.now();
    const prevTime = itemInteractionTimeRef.current[questionId] || lastInteractionTimeRef.current;
    const timeSpentMs = now - prevTime;

    lastInteractionTimeRef.current = now;
    itemInteractionTimeRef.current[questionId] = now;

    const newLog = {
      eventType: customType,
      traineeName: traineeName,
      questionNumber: itemNum || currentQuestion + 1,
      questionId: toUUIDOrNull(questionId) || toUUIDOrNull(current?.id),
      subKey: subKey,
      answer: answerValue,
      timeSpentSeconds: (timeSpentMs / 1000).toFixed(2),
      timestamp: new Date().toISOString(),
    };

    setAnswerLogs((prevLogs) => [...prevLogs, newLog]);
  };

  const saveAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentKey]: value }));
    const activeType = normalizeQuestionType(current);

    if (activeType === "Identification") {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
      logTimeoutRef.current = setTimeout(() => {
        if (value && String(value).trim().length > 0) {
          logAnswerEvent(current?.itemNumber, String(value).trim(), current?.id);
        }
      }, 800);
    } else {
      logAnswerEvent(current?.itemNumber, value, current?.id);
    }
  };

  const handleMatchingInputChange = (questionId, itemNumber, value) => {
    const formattedVal = value.toUpperCase().trim();
    setAnswers((prev) => ({ ...prev, [questionId]: formattedVal }));

    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    logTimeoutRef.current = setTimeout(() => {
      if (formattedVal.length > 0) {
        logAnswerEvent(itemNumber, formattedVal, questionId, `Item-${itemNumber}`, "MATCHING_ANSWER_INPUT");
      }
    }, 800);
  };

  const handleNext = () => {
    if (isMatchingBlock && matchingQuestions.length > 0) {
      const lastMatchingItem = matchingQuestions[matchingQuestions.length - 1];
      const lastIndex = questions.findIndex((q) => q.id === lastMatchingItem.id);

      if (lastIndex !== -1 && lastIndex < questions.length - 1) {
        setCurrentQuestion(lastIndex + 1);
        lastInteractionTimeRef.current = Date.now();
        return;
      }
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      lastInteractionTimeRef.current = Date.now();
    }
  };

  const handleSubmit = () => {
    stopEEGMonitoring();
    setShowCompletion(true);
  };

  const answerSaved = useMemo(() => {
    const normType = normalizeQuestionType(current);
    if (normType === "Matching Type") {
      return matchingQuestions.every((q) => {
        const val = answers[q.id];
        return val && String(val).trim().length > 0;
      });
    }
    if (normType === "Identification") {
      return Boolean(selectedAnswer && String(selectedAnswer).trim().length > 0);
    }
    return Boolean(selectedAnswer);
  }, [current, selectedAnswer, answers, matchingQuestions]);

  const renderMultipleChoice = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {(current?.choices || []).map((choice) => {
        const isSelected = selectedAnswer === choice;
        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-[72px] items-center gap-4 rounded-xl border px-5 py-4 text-left text-lg font-semibold leading-relaxed transition ${
              isSelected
                ? "border-[#0B5D8A] bg-sky-50 shadow-xs ring-2 ring-[#0B5D8A]"
                : "border-slate-300 bg-white hover:border-[#0B5D8A] hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                isSelected ? "border-[#0B5D8A] bg-[#0B5D8A] text-white" : "border-slate-400"
              }`}
            >
              {isSelected && <Check size={16} />}
            </span>
            <span>{choice}</span>
          </button>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {["True", "False"].map((choice) => {
        const isSelected = String(selectedAnswer).toLowerCase() === choice.toLowerCase();
        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-[72px] items-center gap-4 rounded-xl border px-6 py-5 text-left text-xl font-bold uppercase transition ${
              isSelected
                ? "border-[#0B5D8A] bg-sky-50 ring-2 ring-[#0B5D8A]"
                : "border-slate-300 bg-white hover:border-[#0B5D8A]"
            }`}
          >
            {isSelected ? (
              <CheckCircle className="shrink-0 text-[#0B5D8A]" size={28} />
            ) : (
              <Circle className="shrink-0 text-slate-400" size={28} />
            )}
            {choice}
          </button>
        );
      })}
    </div>
  );

  const renderIdentification = () => (
    <div className="flex justify-center pt-4">
      <input
        type="text"
        value={selectedAnswer || ""}
        onChange={(event) => saveAnswer(event.target.value)}
        placeholder="Type your answer here..."
        className="w-full max-w-2xl rounded-xl border border-slate-300 px-6 py-4 text-center text-xl font-bold uppercase outline-none focus:border-[#0B5D8A] focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );

  const renderMatchingType = () => {
    const columnBOptions = matchingQuestions
      .map((q) => q.columnBMatch)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-base font-semibold text-[#0B5D8A]">
            Match each item in <strong>Column A</strong> with its corresponding answer in <strong>Column B</strong>. Type the letter in the input box provided.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 items-stretch md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 text-lg px-1">Column A (Items)</h3>
            <div className="flex flex-1 flex-col justify-between gap-3">
              {matchingQuestions.map((item) => {
                const currentVal = answers[item.id] || "";
                const hasValue = currentVal.trim().length > 0;

                return (
                  <div
                    key={item.id}
                    className={`flex min-h-[64px] flex-1 items-center gap-3 rounded-xl border p-3.5 transition ${
                      hasValue
                        ? "border-[#0B5D8A] bg-sky-50/60 shadow-xs"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="text"
                      maxLength={1}
                      value={currentVal}
                      onChange={(e) => handleMatchingInputChange(item.id, item.itemNumber, e.target.value)}
                      placeholder="?"
                      className="h-11 w-11 shrink-0 rounded-lg border-2 border-[#0B5D8A] text-center text-xl font-bold uppercase text-[#0B5D8A] outline-none focus:ring-4 focus:ring-sky-200"
                    />
                    <span className="text-base font-semibold text-slate-900 leading-snug">
                      {item.itemNumber}. {item.question}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 text-lg px-1">Column B (Options)</h3>
            <div className="flex flex-1 flex-col justify-between gap-3">
              {columnBOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex min-h-[64px] flex-1 items-center rounded-xl bg-slate-100 border border-slate-200 p-3.5 text-sm font-semibold text-slate-800 leading-relaxed"
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionBody = () => {
    const activeType = normalizeQuestionType(current);
    switch (activeType) {
      case "Multiple Choice": return renderMultipleChoice();
      case "True / False": return renderTrueFalse();
      case "Matching Type": return renderMatchingType();
      case "Identification": return renderIdentification();
      default: return renderMultipleChoice();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-slate-600">Loading assessment questions...</p>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Written assessment questions are not available.</h2>
        <button
          onClick={() => navigate("/trainee/assessment")}
          className="rounded-lg bg-[#002f86] px-6 py-2.5 text-white font-semibold hover:bg-[#001f59] transition"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const questionProgressLabel = isMatchingBlock
    ? `Questions ${matchingQuestions[0]?.itemNumber || 21} - ${
        matchingQuestions[matchingQuestions.length - 1]?.itemNumber || 25
      } of ${totalItems}`
    : `Question ${current?.itemNumber || currentQuestion + 1} of ${totalItems}`;

  const isLastSection =
    currentQuestion === questions.length - 1 ||
    (isMatchingBlock &&
      matchingQuestions.length > 0 &&
      questions.findIndex((q) => q.id === matchingQuestions[matchingQuestions.length - 1].id) === questions.length - 1);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-32">
      {/* NON-INTRUSIVE TOP BANNER */}
      {isEegPaused && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-300 px-5 py-3.5 text-amber-900 shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <Activity className="text-amber-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-sm">EEG Signal Low / Disconnected — Assessment Paused</p>
              <p className="text-xs text-amber-700">
                {eegWarningReason || "Please adjust your headband contact on your forehead."} Timer is auto-paused.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wide bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
            Auto-Resuming on Signal Recovery...
          </span>
        </div>
      )}

      <section className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{assessment?.qualification || "Written Assessment"}</h1>
          <p className="mt-1 max-w-3xl text-base font-medium text-slate-700">
            Unit of Competency: {assessment?.unitOfCompetency || "Core Unit"}
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold shadow-xs transition ${
                deviceConnected && !isEegPaused ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {deviceConnected && !isEegPaused ? <Check size={16} /> : <WifiOff size={16} />}
              {deviceConnected && !isEegPaused ? "EEG Connected" : "EEG Disconnected"}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold shadow-xs transition ${
                isMonitoringActive && deviceConnected && !isEegPaused
                  ? "bg-rose-100 text-rose-800 animate-pulse"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <Brain size={16} />
              {isMonitoringActive && deviceConnected && !isEegPaused
                ? "Cognitive Monitoring Active"
                : "Monitoring Paused"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-2.5 shadow-xs border transition ${
              remainingSeconds < 300
                ? "bg-rose-50 border-rose-300 animate-pulse"
                : "bg-white border-slate-200"
            }`}
          >
            <Clock3 className={remainingSeconds < 300 ? "text-rose-600" : "text-[#0B5D8A]"} size={22} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining Time</p>
              <p className={`text-2xl font-bold ${remainingSeconds < 300 ? "text-rose-600" : "text-slate-900"}`}>
                {remainingTime}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs">
            <FileText size={18} className="text-[#0B5D8A]" />
            {normalizeQuestionType(current)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-xs">
        {!isMatchingBlock && (
          <h2 className="mb-6 text-2xl md:text-3xl font-semibold leading-snug text-slate-950">
            {current?.question}
          </h2>
        )}

        {renderQuestionBody()}

        <div className="mt-6 flex items-center gap-2 text-emerald-700 font-medium min-h-[28px]">
          {answerSaved && (
            <>
              <Check size={20} />
              <span>Answer Saved</span>
            </>
          )}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700">
              <span>{questionProgressLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#0B5D8A] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            {isLastSection ? (
              <button
                onClick={handleSubmit}
                disabled={!answerSaved || isSubmitting}
                className={`inline-flex items-center gap-2 rounded-xl px-7 py-3 text-base font-semibold text-white transition ${
                  answerSaved && !isSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-md"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <CheckCircle size={20} />
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B4F7A] px-7 py-3 text-base font-semibold text-white shadow-md hover:bg-[#083E61] transition cursor-pointer"
              >
                Next Question
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            {remainingSeconds <= 0 ? (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle size={34} />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle size={34} />
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-900">
              {remainingSeconds <= 0 ? "Time Expired" : "Assessment Complete"}
            </h2>
            <p className="mt-2 text-slate-600">
              {remainingSeconds <= 0
                ? "Your time has run out! Auto-submitting answers..."
                : "Your answers are ready for submission."}
            </p>

            <div className="my-4 rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 border border-slate-200">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <History size={14} className="text-[#0B5D8A]" /> Logged Session Events
              </p>
              <p>
                Recorded events: <span className="font-bold text-slate-900">{answerLogs.length}</span>
              </p>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleCompletionDone}
              className="mt-2 w-full rounded-xl bg-[#0B4F7A] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#083E61] disabled:bg-slate-400 transition cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}