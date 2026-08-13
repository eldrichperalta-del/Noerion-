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
} from "lucide-react";
import { supabase } from "../../../supabaseClient";

// =========================================================================
// ⏱️ TEST MODE CONFIGURATION
// Set to a number in seconds (e.g., 10) to test auto-submission immediately.
// Set to null to use the real database time_limit_minutes.
// =========================================================================
const TESTING_TIME_SECONDS = null; // Change to e.g. 10 for rapid testing
const PASSING_PERCENTAGE = 0.75; // 75% Passing Rate Standard

/**
 * Helper to ensure valid UUID syntax for PostgreSQL columns.
 * Prevents '22P02: invalid input syntax for type uuid' errors.
 */
const toUUIDOrNull = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str) ? str : null;
};

const getQuestionKey = (question, index) =>
  question?.id ?? `question-${index}`;

/**
 * Normalize question type using test_section primary, fallback to question_type
 */
const normalizeQuestionType = (q) => {
  const rawSection = (q?.test_section || "").toLowerCase().trim();
  const rawType = (q?.question_type || q?.type || "").toLowerCase().trim();

  if (rawSection === "matching" || rawType.includes("match")) {
    return "Matching Type";
  }
  if (
    rawSection === "true_false" ||
    rawType.includes("true") ||
    rawType.includes("boolean")
  ) {
    return "True / False";
  }
  if (
    rawSection === "identification" ||
    rawType.includes("ident") ||
    rawType.includes("short")
  ) {
    return "Identification";
  }
  if (
    rawSection === "multiple_choice" ||
    rawSection === "situational" ||
    rawType.includes("choice")
  ) {
    return "Multiple Choice";
  }

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

/**
 * 🎯 Evaluates whether a trainee's answer is correct against answer keys
 * Handles full text, option letters, identification variations, true/false, and matching types.
 */
const evaluateAnswer = (userAnswer, answerKeyObj, questionObj) => {
  if (
    !answerKeyObj ||
    answerKeyObj.correct_answer === undefined ||
    answerKeyObj.correct_answer === null
  ) {
    return { isCorrect: false, points: 0 };
  }

  const rawUserAns = String(userAnswer || "").trim().toLowerCase();
  const rawCorrectKey = String(answerKeyObj.correct_answer).trim().toLowerCase();

  if (!rawUserAns) {
    return { isCorrect: false, points: 0 };
  }

  const qType = normalizeQuestionType(questionObj);

  // 1. Identification / Short Answer (Supports multiple options delimited by '|' or '/')
  if (qType === "Identification") {
    const validVariants = rawCorrectKey
      .replace(/\|/g, "/")
      .split("/")
      .map((v) => v.trim().toLowerCase());
    const isCorrect = validVariants.includes(rawUserAns);
    return { isCorrect, points: isCorrect ? 1 : 0 };
  }

  // 2. True / False (Handles True/False, T/F)
  if (qType === "True / False") {
    const isUserTrue = rawUserAns === "true" || rawUserAns === "t";
    const isKeyTrue = rawCorrectKey === "true" || rawCorrectKey === "t";
    const isCorrect = isUserTrue === isKeyTrue;
    return { isCorrect, points: isCorrect ? 1 : 0 };
  }

  // 3. Multiple Choice / Situational
  if (qType === "Multiple Choice") {
    // Direct match (letter === letter or text === text)
    if (rawUserAns === rawCorrectKey) {
      return { isCorrect: true, points: 1 };
    }

    // Lookup option letter or option text in rawOptions
    if (questionObj?.rawOptions?.length > 0) {
      const userOpt = questionObj.rawOptions.find(
        (opt) =>
          String(opt.option_text || "").trim().toLowerCase() === rawUserAns ||
          String(opt.option_letter || "").trim().toLowerCase() === rawUserAns
      );

      if (userOpt) {
        const userLetter = String(userOpt.option_letter || "").trim().toLowerCase();
        if (userLetter === rawCorrectKey) {
          return { isCorrect: true, points: 1 };
        }

        const userText = String(userOpt.option_text || "").trim().toLowerCase();
        if (userText === rawCorrectKey) {
          return { isCorrect: true, points: 1 };
        }
      }
    }

    return { isCorrect: false, points: 0 };
  }

  // 4. Matching Type & Other direct comparisons
  const isCorrect = rawUserAns === rawCorrectKey;
  return { isCorrect, points: isCorrect ? 1 : 0 };
};

export default function WrittenAssessment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [assessment, setAssessment] = useState(state?.assessment || null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Storage Keys for persistence across refreshes
  const rawAssignmentId =
    state?.assignmentId ||
    state?.assessment?.id ||
    localStorage.getItem("active_assignment_id");
  const assessmentIdKey = toUUIDOrNull(rawAssignmentId) || "active_assessment";

  const rawAssessmentIdRef =
    state?.assessmentId ||
    state?.assessment?.assessment_id ||
    localStorage.getItem("active_assignment_id_ref");

  const rawBaselineId =
    state?.baselineId || localStorage.getItem("active_baseline_id");
  const baselineId = toUUIDOrNull(rawBaselineId);

  const rawTraineeId =
    state?.traineeId ||
    localStorage.getItem("trainee_id") ||
    localStorage.getItem("user_id");
  const traineeId = toUUIDOrNull(rawTraineeId);

  const answersStorageKey = `trainee_answers_draft_${assessmentIdKey}`;
  const timerStorageKey = `assessment_end_time_${assessmentIdKey}`;
  const questionIndexStorageKey = `trainee_current_question_${assessmentIdKey}`;
  const completionKey = `assessment_completed_${assessmentIdKey}`;

  // Restore current question index from localStorage if page refreshed
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    try {
      const savedIndex = localStorage.getItem(questionIndexStorageKey);
      return savedIndex !== null
        ? parseInt(savedIndex, 10)
        : state?.currentQuestionIndex || 0;
    } catch {
      return state?.currentQuestionIndex || 0;
    }
  });

  // Initialize answers from localStorage draft if existing
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
  // 🧠 LIVE EEG WEBSOCKET MONITORING CONNECTION
  // =========================================================================
  const MIDDLEWARE_WS_URL = "ws://127.0.0.1:8000/ws/eeg";
  const wsRef = useRef(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [, setSignalQuality] = useState("No Signal");
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // Helper function to send EEG stop signal to middleware
  const stopEEGMonitoring = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          command: "STOP_ACTIVE_ASSESSMENT",
          type: "STOP_ACTIVE_ASSESSMENT",
          assignment_id: toUUIDOrNull(rawAssignmentId) || null,
          assessment_id: toUUIDOrNull(rawAssessmentIdRef) || null,
          submission_id: toUUIDOrNull(assessmentIdKey) || null,
          trainee_id: traineeId || null,
        })
      );
      setIsMonitoringActive(false);
    }
  }, [rawAssignmentId, rawAssessmentIdRef, assessmentIdKey, traineeId]);

  useEffect(() => {
    let ws;

    const connectActiveEEGStream = () => {
      ws = new WebSocket(MIDDLEWARE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsMonitoringActive(true);
        ws.send(
          JSON.stringify({
            command: "START_ACTIVE_ASSESSMENT",
            type: "START_ACTIVE_ASSESSMENT",
            assignment_id: toUUIDOrNull(rawAssignmentId) || null,
            assessment_id: toUUIDOrNull(rawAssessmentIdRef) || null,
            submission_id: toUUIDOrNull(assessmentIdKey) || null,
            baseline_id: baselineId || null,
            trainee_id: traineeId || null,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setDeviceConnected(!!data.device_connected);
          setSignalQuality(data.signal_quality || "No Signal");
        } catch (err) {
          console.error("Error parsing EEG frame:", err);
        }
      };

      ws.onerror = () => {
        setDeviceConnected(false);
        setIsMonitoringActive(false);
        setSignalQuality("No Signal");
      };

      ws.onclose = () => {
        setDeviceConnected(false);
        setIsMonitoringActive(false);
        setSignalQuality("No Signal");
      };
    };

    connectActiveEEGStream();

    return () => {
      stopEEGMonitoring();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [rawAssignmentId, rawAssessmentIdRef, assessmentIdKey, baselineId, traineeId, stopEEGMonitoring]);

  // Submission safety lock to avoid duplicate DB calls on timer zero
  const isSubmittingRef = useRef(false);

  // Time tracking refs & debounce refs
  const lastInteractionTimeRef = useRef(Date.now());
  const itemInteractionTimeRef = useRef({});
  const logTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // 📝 DB SUBMIT & AUTOMATED SCORING LOGIC
  // -----------------------------------------------------------------------
  const handleCompletionDone = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Stop EEG Active Monitoring Stream on submission immediately
    stopEEGMonitoring();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const assignmentId = toUUIDOrNull(assessment?.id || state?.assignmentId);

        // 🛡️ Ensure targetAssessmentId is sanitized UUID or null
        const targetAssessmentId = toUUIDOrNull(
          assessment?.assessment_id ||
            state?.assessmentId ||
            questions[0]?.assessment_id
        );

        const validUserUuid = toUUIDOrNull(user.id);

        // Fetch Answer Keys for evaluation
        const questionIds = questions.map((q) => toUUIDOrNull(q.id)).filter(Boolean);
        let answerKeysMap = {};

        if (questionIds.length > 0) {
          const { data: keysData, error: keysErr } = await supabase
            .from("answer_keys")
            .select("question_id, correct_answer, explanation")
            .in("question_id", questionIds);

          if (keysErr) console.error("Error fetching answer keys:", keysErr);

          if (keysData) {
            answerKeysMap = keysData.reduce((acc, keyObj) => {
              acc[keyObj.question_id] = keyObj;
              return acc;
            }, {});
          }
        }

        // Calculate Scores & Points for each answer
        let totalScore = 0;
        const totalPossibleQuestions = questions.length;

        const traineeAnswerRowsPrepared = questions.map((q, idx) => {
          const key = getQuestionKey(q, idx);
          const userAns =
            answers[q.id] !== undefined ? answers[q.id] : answers[key];

          const answerKeyObj = answerKeysMap[q.id];
          const evaluation = evaluateAnswer(userAns, answerKeyObj, q);

          if (evaluation.isCorrect) {
            totalScore += evaluation.points;
          }

          // Map userAns to obtain selected_option_id from rawOptions
          let selectedOptionId = null;
          if (q.rawOptions && q.rawOptions.length > 0) {
            const rawAnsStr = String(userAns || "").trim().toLowerCase();
            const matchedOpt = q.rawOptions.find(
              (opt) =>
                String(opt.option_text || "").trim().toLowerCase() === rawAnsStr ||
                String(opt.option_letter || "").trim().toLowerCase() === rawAnsStr
            );
            if (matchedOpt) {
              selectedOptionId = toUUIDOrNull(matchedOpt.id);
            }
          }

          return {
            question_id: toUUIDOrNull(q.id),
            selected_option_id: selectedOptionId,
            text_answer:
              typeof userAns === "object"
                ? JSON.stringify(userAns)
                : String(userAns || ""),
            is_correct: evaluation.isCorrect,
            points_awarded: evaluation.points,
            created_at: new Date().toISOString(),
          };
        });

        const passStatus =
          totalPossibleQuestions > 0
            ? totalScore / totalPossibleQuestions >= PASSING_PERCENTAGE
            : false;

        // 1. Create Submission Record with computed score and status
        const { data: subData, error: subErr } = await supabase
          .from("assessment_submissions")
          .insert({
            assignment_id: assignmentId,
            assessment_id: targetAssessmentId,
            trainee_id: validUserUuid,
            status: "submitted",
            total_score: totalScore,
            passed: passStatus,
            submitted_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (subErr) throw subErr;

        const submissionId = toUUIDOrNull(subData?.id);

        if (submissionId) {
          // 2. Insert Final Answers
          if (traineeAnswerRowsPrepared.length > 0) {
            const finalAnswerRows = traineeAnswerRowsPrepared.map((row) => ({
              ...row,
              submission_id: submissionId,
            }));

            const { error: ansErr } = await supabase
              .from("trainee_answers")
              .insert(finalAnswerRows);

            if (ansErr) console.error("Error inserting trainee_answers:", ansErr);
          }

          // 3. Fallback Update: Sync total_score after answers are written
          await supabase
            .from("assessment_submissions")
            .update({
              total_score: totalScore,
              passed: passStatus,
            })
            .eq("id", submissionId);

          // 4. Insert Event Logs (EEG time-series metrics)
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

            const { error: logErr } = await supabase
              .from("assessment_event_logs")
              .insert(logRows);

            if (logErr) console.error("Error inserting assessment_event_logs:", logErr);
          }

          // 5. Update Assignment status
          if (assignmentId) {
            await supabase
              .from("assignments")
              .update({
                status: "Completed",
                completed_at: new Date().toISOString(),
              })
              .eq("id", assignmentId);
          }
        }
      }

      // Mark completed in localStorage to block back button re-entry
      localStorage.setItem(completionKey, "true");

      // Clear local storage draft keys
      localStorage.removeItem(timerStorageKey);
      localStorage.removeItem(answersStorageKey);
      localStorage.removeItem(questionIndexStorageKey);

    } catch (err) {
      console.error("Error submitting assessment:", err);
    } finally {
      setIsSubmitting(false);

      // Redirection with replace: true prevents browser BACK button navigation
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
    stopEEGMonitoring,
  ]);

  // Save current active question index to localStorage on change
  useEffect(() => {
    localStorage.setItem(questionIndexStorageKey, currentQuestion.toString());
  }, [currentQuestion, questionIndexStorageKey]);

  // Prevent accidental refresh / closing tab during active exam
  useEffect(() => {
    if (showCompletion || loading) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Assessment in progress. If you leave, your active session timer will continue!";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showCompletion, loading]);

  // Load Assessment Data & Calculate Timer End Time
  useEffect(() => {
    async function loadAssessmentData() {
      // Guard 1: Immediate check if already completed locally
      if (localStorage.getItem(completionKey) === "true") {
        navigate("/trainee/assessment/overview", { replace: true });
        return;
      }

      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && toUUIDOrNull(user.id)) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && (profile.first_name || profile.last_name)) {
            setTraineeName(
              `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
            );
          }
        }

        let formattedQuestions = [];
        let durationMinutes = 30;

        // Case A: Passed state
        if (state?.assessment?.questions?.length > 0) {
          formattedQuestions = state.assessment.questions.map((q) => ({
            ...q,
            type: normalizeQuestionType(q),
          }));

          durationMinutes =
            state.assessment.durationMinutes ||
            state.assessment.time_limit_minutes ||
            30;
        } else {
          // Case B: Supabase fetch
          const assignmentId = toUUIDOrNull(
            state?.assignmentId || state?.assessment?.id
          );
          const assessmentId = toUUIDOrNull(
            state?.assessmentId ||
              state?.assessment?.assessment_id ||
              state?.assessment?.assessmentId
          );

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

            // Guard 2: Immediate check if DB status is already completed
            if (assignmentData?.status === "Completed") {
              localStorage.setItem(completionKey, "true");
              navigate("/trainee/assessment/overview", { replace: true });
              return;
            }

            const targetAssessmentId =
              assessmentId || toUUIDOrNull(assignmentData?.assessment_id);

            if (targetAssessmentId) {
              const { data: assessData } = await supabase
                .from("assessments")
                .select("title, time_limit_minutes")
                .eq("id", targetAssessmentId)
                .maybeSingle();

              if (assessData?.time_limit_minutes) {
                durationMinutes = assessData.time_limit_minutes;
              }

              const { data: questionsData } = await supabase
                .from("questions")
                .select("*")
                .eq("assessment_id", targetAssessmentId)
                .order("item_number", { ascending: true });

              if (questionsData?.length > 0) {
                const questionIds = questionsData
                  .map((q) => toUUIDOrNull(q.id))
                  .filter(Boolean);

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
                  const sortedOpts = rawOpts.sort((a, b) =>
                    (a.option_letter || "").localeCompare(
                      b.option_letter || ""
                    )
                  );

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
              title:
                assignmentData?.assessment_name ||
                prev?.title ||
                "Written Assessment",
              qualification:
                assignmentData?.qualification || prev?.qualification || "NC II",
              unitOfCompetency:
                assignmentData?.assessment_name || "Core Unit",
              questions: formattedQuestions,
            }));
          }
        }

        setQuestions(formattedQuestions);

        // Persistent Timer Setup
        let endTime = localStorage.getItem(timerStorageKey);
        if (!endTime) {
          const durationSeconds =
            TESTING_TIME_SECONDS !== null
              ? TESTING_TIME_SECONDS
              : durationMinutes * 60;

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
  }, [state, timerStorageKey, completionKey, navigate]);

  // Countdown Interval & Auto-Submit Redirect
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const interval = setInterval(() => {
      const savedEndTime = localStorage.getItem(timerStorageKey);
      if (!savedEndTime) return;

      const secondsLeft = Math.floor(
        (parseInt(savedEndTime, 10) - Date.now()) / 1000
      );

      if (secondsLeft <= 0) {
        clearInterval(interval);
        setRemainingSeconds(0);

        // TIME IS UP: Trigger auto submit and stop EEG immediately
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
  }, [loading, questions.length, timerStorageKey, handleCompletionDone, stopEEGMonitoring]);

  // Save draft answers to localStorage on modification
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
    return questions.filter(
      (q) => normalizeQuestionType(q) === "Matching Type"
    );
  }, [questions]);

  const isMatchingBlock = normalizeQuestionType(current) === "Matching Type";

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    if (isMatchingBlock && matchingQuestions.length > 0) {
      const lastMatchingItem = matchingQuestions[matchingQuestions.length - 1];
      const matchIndex = questions.findIndex(
        (q) => q.id === lastMatchingItem.id
      );
      return (
        (((matchIndex >= 0 ? matchIndex : currentQuestion) + 1) /
          questions.length) *
        100
      );
    }
    return ((currentQuestion + 1) / questions.length) * 100;
  }, [questions, currentQuestion, isMatchingBlock, matchingQuestions]);

  const remainingTime = useMemo(
    () => formatTime(remainingSeconds),
    [remainingSeconds]
  );

  // Log interaction timestamp for EEG correlation
  const logAnswerEvent = (
    itemNum,
    answerValue,
    questionId,
    subKey = null,
    customType = "ANSWER_SELECTION"
  ) => {
    const now = Date.now();
    const prevTime =
      itemInteractionTimeRef.current[questionId] ||
      lastInteractionTimeRef.current;
    const timeSpentMs = now - prevTime;

    lastInteractionTimeRef.current = now;
    itemInteractionTimeRef.current[questionId] = now;

    const timestamp = new Date();
    const newLog = {
      eventType: customType,
      traineeName: traineeName,
      questionNumber: itemNum || currentQuestion + 1,
      questionId: toUUIDOrNull(questionId) || toUUIDOrNull(current?.id),
      subKey: subKey,
      answer: answerValue,
      timeSpentSeconds: (timeSpentMs / 1000).toFixed(2),
      timestamp: timestamp.toISOString(),
    };

    setAnswerLogs((prevLogs) => [...prevLogs, newLog]);
  };

  const saveAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentKey]: value,
    }));

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

    setAnswers((prev) => ({
      ...prev,
      [questionId]: formattedVal,
    }));

    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);

    logTimeoutRef.current = setTimeout(() => {
      if (formattedVal.length > 0) {
        logAnswerEvent(
          itemNumber,
          formattedVal,
          questionId,
          `Item-${itemNumber}`,
          "MATCHING_ANSWER_INPUT"
        );
      }
    }, 800);
  };

  const handleNext = () => {
    if (isMatchingBlock && matchingQuestions.length > 0) {
      const lastMatchingItem = matchingQuestions[matchingQuestions.length - 1];
      const lastIndex = questions.findIndex(
        (q) => q.id === lastMatchingItem.id
      );

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
    stopEEGMonitoring(); // Immediately stop active EEG recording on manual submit
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
      return Boolean(
        selectedAnswer && String(selectedAnswer).trim().length > 0
      );
    }

    return Boolean(selectedAnswer);
  }, [current, selectedAnswer, answers, matchingQuestions]);

  const renderMultipleChoice = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {(current?.choices || []).map((choice) => {
        const isSelected = selectedAnswer === choice;

        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-20 items-center gap-4 rounded-xl border px-6 py-5 text-left !text-xl font-semibold leading-7 break-words md:!text-2xl transition ${
              isSelected
                ? "border-[#0B5D8A] bg-sky-50 shadow-[0_0_0_2px_rgba(14,116,144,0.15)]"
                : "border-gray-300 bg-white hover:border-[#0B5D8A]"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 ${
                isSelected
                  ? "border-[#0B5D8A] bg-[#0B5D8A] text-white"
                  : "border-gray-400"
              }`}
            >
              {isSelected && <Check size={18} />}
            </span>
            {choice}
          </button>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {["True", "False"].map((choice) => {
        const isSelected =
          String(selectedAnswer).toLowerCase() === choice.toLowerCase();

        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-20 items-center gap-4 rounded-xl border px-6 py-5 text-left !text-xl font-bold uppercase leading-7 md:!text-2xl transition ${
              isSelected
                ? "border-[#0B5D8A] bg-sky-50 shadow-[0_0_0_2px_rgba(14,116,144,0.15)]"
                : "border-gray-300 bg-white hover:border-[#0B5D8A]"
            }`}
          >
            {isSelected ? (
              <CheckCircle className="shrink-0 text-[#0B5D8A]" size={30} />
            ) : (
              <Circle className="shrink-0 text-gray-400" size={30} />
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
        className="w-full max-w-2xl rounded-xl border border-gray-300 px-6 py-5 text-center !text-xl font-bold uppercase leading-7 tracking-normal md:!text-2xl outline-none focus:border-[#0B5D8A] focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );

  const renderMatchingType = () => {
    const columnBOptions = matchingQuestions
      .map((q) => q.columnBMatch)
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-xs">
          <p className="text-base font-semibold text-[#0B5D8A]">
            Match each item in <strong>Column A</strong> with its corresponding
            answer in <strong>Column B</strong>. Type the letter in the input
            box provided.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-lg px-1">
              Column A (Items)
            </h3>
            {matchingQuestions.map((item) => {
              const currentVal = answers[item.id] || "";
              const hasValue = currentVal.trim().length > 0;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${
                    hasValue
                      ? "border-[#0B5D8A] bg-sky-50/50 shadow-xs"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                >
                  <input
                    type="text"
                    maxLength={1}
                    value={currentVal}
                    onChange={(e) =>
                      handleMatchingInputChange(
                        item.id,
                        item.itemNumber,
                        e.target.value
                      )
                    }
                    placeholder="?"
                    className="h-12 w-12 shrink-0 rounded-lg border-2 border-[#0B5D8A] text-center text-xl font-bold uppercase text-[#0B5D8A] outline-none focus:ring-4 focus:ring-sky-200 transition"
                  />
                  <span className="text-base font-semibold text-slate-900 leading-snug">
                    {item.itemNumber}. {item.question}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-lg px-1">
              Column B (Options)
            </h3>
            <div className="space-y-2.5">
              {columnBOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-800 leading-relaxed shadow-xs"
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
      case "Multiple Choice":
        return renderMultipleChoice();
      case "True / False":
        return renderTrueFalse();
      case "Matching Type":
        return renderMatchingType();
      case "Identification":
        return renderIdentification();
      default:
        return renderMultipleChoice();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-gray-600">
          Loading assessment questions...
        </p>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Written assessment questions are not available.
        </h2>
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
      questions.findIndex(
        (q) => q.id === matchingQuestions[matchingQuestions.length - 1].id
      ) === questions.length - 1);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden p-0">
      {/* Header Section */}
      <section className="mb-3 shrink-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            {assessment?.qualification || "Written Assessment"}
          </h1>
          <p className="mt-1 max-w-3xl text-base font-medium text-slate-800">
            Unit of Competency: {assessment?.unitOfCompetency || "Core Unit"}
          </p>

          {/* Real-time Dynamic Hardware Monitoring Badges */}
          <div className="mt-3 flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold shadow-xs transition ${
                deviceConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {deviceConnected ? <Check size={18} /> : <WifiOff size={18} />}
              {deviceConnected ? "Muse 2 Connected" : "Muse 2 Disconnected"}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold shadow-xs transition ${
                isMonitoringActive && deviceConnected
                  ? "bg-rose-100 text-rose-800 animate-pulse"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <Brain size={18} />
              {isMonitoringActive && deviceConnected
                ? "Cognitive Monitoring Active"
                : "Cognitive Monitoring Standby"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 text-right shadow-xs transition ${
              remainingSeconds < 300
                ? "bg-rose-50 border border-rose-200 animate-pulse"
                : "bg-sky-50"
            }`}
          >
            <Clock3
              className={
                remainingSeconds < 300 ? "text-rose-600" : "text-[#0B5D8A]"
              }
            />
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Remaining Time
              </p>
              <p
                className={`text-2xl font-bold ${
                  remainingSeconds < 300 ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {remainingTime}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-700 shadow-xs">
            <FileText size={20} className="text-[#0B5D8A]" />
            {normalizeQuestionType(current)}
          </div>
        </div>
      </section>

      {/* Main Question Body */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.15)] md:p-5">
        <div className="mt-2 flex-1 flex flex-col">
          {!isMatchingBlock && (
            <h2 className="mb-6 shrink-0 !text-2xl font-semibold leading-8 text-slate-950 md:!text-3xl">
              {current?.question}
            </h2>
          )}

          <div className="flex-1 overflow-y-auto pr-1">
            {renderQuestionBody()}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 shrink-0 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-h-8 items-center gap-3 text-base text-slate-800">
            {answerSaved && (
              <>
                <Check className="text-green-600" size={28} />
                <span className="font-medium text-green-700">Answer Saved</span>
              </>
            )}
          </div>

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={!answerSaved || isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition ${
                answerSaved && !isSubmitting
                  ? "bg-green-600 hover:bg-green-700 shadow-green-900/20 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
              }`}
            >
              <CheckCircle size={22} />
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B4F7A] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/25 hover:bg-[#083E61] transition cursor-pointer"
            >
              Next Question
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      </section>

      {/* Progress Bar */}
      <div className="mt-3 shrink-0">
        <div className="mb-2 flex justify-between text-base font-medium text-slate-900">
          <span>{questionProgressLabel}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            {remainingSeconds <= 0 ? (
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle size={34} />
              </div>
            ) : (
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle size={34} />
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-950">
              {remainingSeconds <= 0 ? "Time Expired" : "Assessment Complete"}
            </h2>
            <p className="mt-3 text-slate-600">
              {remainingSeconds <= 0
                ? "Your time has run out! Auto-submitting answers..."
                : "Your answers are ready for submission."}
            </p>

            <div className="my-4 rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 border border-slate-200">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <History size={14} className="text-[#0B5D8A]" /> EEG & Answer Event Logger
              </p>
              <p>
                Logged events recorded:{" "}
                <span className="font-bold text-slate-900">
                  {answerLogs.length}
                </span>
              </p>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleCompletionDone}
              className="mt-2 w-full rounded-xl bg-[#0B4F7A] px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/20 hover:bg-[#083E61] disabled:bg-gray-400 transition cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}