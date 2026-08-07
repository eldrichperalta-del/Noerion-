import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Check,
  CheckCircle,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
} from "lucide-react";
import { useAssessments } from "../../../context/AssessmentContext";

const ASSESSMENT_STATUS = {
  COMPLETED: "Completed",
};

const getQuestionKey = (question, index) =>
  question?.id ?? `question-${index}`;

const getMatchingOptions = (pairs = []) =>
  pairs.map((pair, index) => ({
    letter: String.fromCharCode(65 + index),
    description: pair.right,
  }));

const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
};

export default function WrittenAssessment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { assessments, updateAssessmentStatus } = useAssessments();

  const assessment = state?.assessment || assessments[0];
  const questions = assessment?.questions || [];

  const [currentQuestion, setCurrentQuestion] = useState(
    state?.currentQuestionIndex || 0
  );
  const [answers, setAnswers] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    (assessment?.durationMinutes || 40) * 60
  );

  const current = questions[currentQuestion];
  const currentKey = getQuestionKey(current, currentQuestion);
  const selectedAnswer = answers[currentKey];
  const totalItems = assessment?.totalItems || questions.length;
  const progress =
    questions.length > 0
      ? ((currentQuestion + 1) / questions.length) * 100
      : 0;

  const remainingTime = useMemo(
    () => formatTime(remainingSeconds),
    [remainingSeconds]
  );

  useEffect(() => {
    if (showCompletion) return undefined;

    const timerId = setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(timerId);
          setShowCompletion(true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [showCompletion]);

  if (!assessment || questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">
          Written assessment questions are not available.
        </h2>

        <button
          onClick={() => navigate("/trainee/assessment")}
          className="rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const saveAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentKey]: value,
    }));
  };

  const saveMatchingAnswer = (pairIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [pairIndex]: value.toUpperCase(),
      },
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    setShowCompletion(true);
  };

  const handleCompletionDone = () => {
    // Update the shared assessment status
    updateAssessmentStatus(
      assessment.id,
      ASSESSMENT_STATUS.COMPLETED
    );

    // Continue to the overview page
    navigate("/trainee/assessment/overview", {
      state: {
        assessment: {
          ...assessment,
          status: ASSESSMENT_STATUS.COMPLETED,
          traineeAnswers: answers,
        },
      },
    });
  };

  const renderMultipleChoice = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {current.choices.map((choice) => {
        const isSelected = selectedAnswer === choice;

        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-20 items-center gap-4 rounded-xl border px-6 py-5 text-left !text-xl font-semibold leading-7 break-words md:!text-2xl transition ${isSelected
              ? "border-[#0B5D8A] bg-sky-50 shadow-[0_0_0_2px_rgba(14,116,144,0.15)]"
              : "border-gray-300 bg-white hover:border-[#0B5D8A]"
              }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 ${isSelected
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
        const isSelected = selectedAnswer === choice;

        return (
          <button
            key={choice}
            onClick={() => saveAnswer(choice)}
            className={`flex min-h-20 items-center gap-4 rounded-xl border px-6 py-5 text-left !text-xl font-bold uppercase leading-7 md:!text-2xl transition ${isSelected
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
    <div className="flex justify-center">
      <input
        value={selectedAnswer || ""}
        onChange={(event) => saveAnswer(event.target.value)}
        placeholder="Type answer..."
        className="w-full max-w-2xl rounded-xl border border-gray-300 px-6 py-6 text-center !text-xl font-bold uppercase leading-7 tracking-normal md:!text-2xl outline-none focus:border-[#0B5D8A] focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );

  const renderMatchingType = () => {
    const options = current.options || getMatchingOptions(current.pairs);

    return (
      <div className="overflow-hidden rounded-xl border border-gray-300">
        <div className="grid grid-cols-[1.05fr_1.3fr] bg-gray-100 !text-lg font-bold md:!text-xl">
          <div className="border-r border-gray-300 px-4 py-2">
            Column A (Item)
          </div>
          <div className="px-4 py-3">Column B (Description)</div>
        </div>

        {current.pairs.map((pair, index) => (
          <div
            key={`${pair.left}-${index}`}
            className="grid grid-cols-[1.05fr_1.3fr] border-t border-gray-300 bg-white !text-base leading-6 md:!text-lg"
          >
            <div className="flex min-w-0 items-center gap-2 border-r border-gray-300 px-3 py-2">
              <input
                value={selectedAnswer?.[index] || ""}
                onChange={(event) =>
                  saveMatchingAnswer(index, event.target.value.slice(0, 1))
                }
                maxLength={1}
                aria-label={`Answer for ${pair.left}`}
                className="h-9 w-16 rounded-lg border border-[#0B5D8A] text-center text-base font-bold uppercase outline-none focus:ring-4 focus:ring-sky-100"
              />
              <span className="min-w-0 break-words">
                {pair.itemNumber || index + 1}. {pair.left}
              </span>
            </div>

            <div className="break-words px-3 py-2">
              {options[index].letter}. {options[index].description}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestionBody = () => {
    switch (current.type) {
      case "Multiple Choice":
        return renderMultipleChoice();
      case "True / False":
        return renderTrueFalse();
      case "Matching Type":
        return renderMatchingType();
      case "Identification":
        return renderIdentification();
      default:
        return (
          <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            Unsupported question type: {current.type}
          </p>
        );
    }
  };

  const answerSaved =
    current.type === "Matching Type"
      ? Object.keys(selectedAnswer || {}).length > 0
      : Boolean(selectedAnswer);

  const questionProgressLabel = current.itemRange
    ? `Items ${current.itemRange} of ${totalItems}`
    : `Question ${current.id || currentQuestion + 1} of ${totalItems}`;

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden p-0">
      <section className="mb-3 shrink-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            {assessment.qualification}
          </h1>
          <p className="mt-1 max-w-3xl text-base font-medium text-slate-800">
            Unit of Competency: {assessment.unitOfCompetency}
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 font-semibold text-green-800 shadow-sm">
              <Check size={18} />
              Muse 2 Connected
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-4 py-2 font-semibold text-rose-800 shadow-sm">
              <Brain size={18} />
              Cognitive Monitoring Active
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-sky-50 px-5 py-3 text-right shadow-sm">
            <Clock3 className="text-[#0B5D8A]" />
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Remaining Time
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {remainingTime}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm">
            <FileText size={20} className="text-[#0B5D8A]" />
            {current.type}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.15)] md:p-5">

        {current.type === "Matching Type" ? (
          <>
            <h2 className="mb-5 shrink-0 !text-2xl font-semibold leading-8 text-slate-950 md:!text-3xl">
              {current.question}
            </h2>

            <div className="min-h-0 flex-1 overflow-y-auto pt-1 pr-1">
              {renderQuestionBody()}
            </div>
          </>
        ) : (
          <div className="mt-12 flex-1 flex flex-col">

            <h2 className="mb-10 shrink-0 !text-2xl font-semibold leading-8 text-slate-950 md:!text-3xl">
              {current.question}
            </h2>

            <div className="flex-1 overflow-y-auto pr-1">
              {renderQuestionBody()}
            </div>

          </div>
        )}

        <div className="mt-6 shrink-0 flex flex-wrap items-center justify-between gap-4">

          <div className="flex min-h-8 items-center gap-3 text-base text-slate-800">
            {answerSaved && (
              <>
                <Check className="text-green-600" size={28} />
                <span>Answer Saved</span>
              </>
            )}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-green-900/20 hover:bg-green-700"
            >
              <CheckCircle size={22} />
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B4F7A] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/25 hover:bg-[#083E61]"
            >
              Next Question
              <ChevronRight size={22} />
            </button>
          )}

        </div>

      </section>

      <div className="mt-3 shrink-0">
        <div className="mb-2 flex justify-between text-base font-medium text-slate-900">
          <span>
            {questionProgressLabel}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle size={34} />
            </div>

            <h2 className="text-2xl font-bold text-slate-950">
              Assessment Done
            </h2>
            <p className="mt-3 text-slate-600">
              Your written assessment has been submitted.
            </p>

            <button
              onClick={handleCompletionDone}
              className="mt-6 w-full rounded-xl bg-[#0B4F7A] px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/20 hover:bg-[#083E61]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
