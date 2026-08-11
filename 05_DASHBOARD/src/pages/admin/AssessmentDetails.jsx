import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MoreVertical, Plus, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const TYPES = ["Multiple Choice", "True / False", "Identification", "Matching Type"];

function QuestionModal({ initial, onClose, onSave }) {
  const editing = Boolean(initial);
  const [type, setType] = useState(initial?.type || "");
  const [text, setText] = useState(initial?.question || "");
  const [answer, setAnswer] = useState(initial?.answer || "");
  const [choices, setChoices] = useState(initial?.choices?.length ? initial.choices : ["", "", "", ""]);
  const [selectedChoice, setSelectedChoice] = useState(() => Math.max((initial?.choices || []).indexOf(initial?.answer), -1));
  const [pairs, setPairs] = useState(initial?.pairs?.length ? initial.pairs.map(({ left, right }) => ({ left, right })) : [{ left: "", right: "" }]);

  const updateChoice = (index, value) => setChoices((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const updatePair = (index, key, value) => setPairs((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));

  const submit = (event) => {
    event.preventDefault();
    const resolvedAnswer = type === "Multiple Choice" ? choices[selectedChoice] : answer;
    if (!type || !text.trim() || (!resolvedAnswer && type !== "Matching Type")) return;

    const question = {
      ...initial,
      id: initial?.id,
      type,
      question: text.trim(),
      answer: resolvedAnswer,
      choices: type === "Multiple Choice" ? choices.filter(Boolean) : type === "True / False" ? ["True", "False"] : [],
    };

    if (type === "Matching Type") {
      question.pairs = pairs;
      question.options = pairs.filter((pair) => pair.right.trim()).map((pair, index) => ({ letter: String.fromCharCode(65 + index), description: pair.right }));
    }
    onSave(question);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-bold">{editing ? "Edit Question" : "Add Question"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500"><X /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {!editing && (
            <>
              <p className="text-sm font-semibold">Question Type</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {TYPES.map((item) => (
                  <button key={item} type="button" onClick={() => { setType(item); setAnswer(""); setSelectedChoice(-1); }} className={`rounded-xl border p-3 font-semibold ${type === item ? "bg-[#002f86] text-white" : "text-gray-900"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          {type && (
            <>
              <label className="mt-5 block font-semibold">Question
                <textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-3 font-normal" required />
              </label>

              {type === "Multiple Choice" && (
                <fieldset className="mt-4"><legend className="font-semibold">Choices</legend>
                  {choices.map((choice, index) => (
                    <label key={index} className="mt-3 flex items-center gap-3">
                      <input type="radio" name="answer" checked={selectedChoice === index} onChange={() => setSelectedChoice(index)} />
                      <input value={choice} onChange={(event) => updateChoice(index, event.target.value)} placeholder={`Choice ${index + 1}`} className="w-full rounded-lg border p-3" required />
                    </label>
                  ))}
                </fieldset>
              )}

              {type === "True / False" && (
                <fieldset className="mt-4"><legend className="font-semibold">Choices</legend>
                  {["True", "False"].map((choice) => (
                    <label key={choice} className="mt-3 flex items-center gap-3">
                      <input type="radio" name="answer" checked={answer === choice} onChange={() => setAnswer(choice)} />
                      <span className="w-full rounded-lg border bg-gray-50 p-3">{choice}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              {type === "Identification" && (
                <label className="mt-4 block font-semibold">Correct Answer
                  <input value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" required />
                </label>
              )}

              {type === "Matching Type" && (
                <fieldset className="mt-4"><legend className="font-semibold">Matching Pairs</legend>
                  {pairs.map((pair, index) => (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2" key={index}>
                      <input value={pair.left} onChange={(event) => updatePair(index, "left", event.target.value)} placeholder={`Item ${index + 1}`} className="rounded-lg border p-3" required />
                      <input value={pair.right} onChange={(event) => updatePair(index, "right", event.target.value)} placeholder={`Match ${index + 1}`} className="rounded-lg border p-3" required />
                    </div>
                  ))}
                  <button type="button" onClick={() => setPairs((items) => [...items, { left: "", right: "" }])} className="mt-3 rounded border border-[#002f86] px-3 py-2 text-[#002f86]">+ Add Pair</button>
                </fieldset>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <button type="button" onClick={onClose}>Cancel</button>
          <button disabled={!type} className="rounded-lg bg-[#002f86] px-4 py-2 font-semibold text-white">Save Question</button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  const isDark = normalized === "active";
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Draft";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isDark ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
      {label}
    </span>
  );
}

export default function AssessmentDetails() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(null);
  const [status, setStatus] = useState("Draft");

  const loadAssessment = async () => {
    setLoading(true);
    try {
      // 1. Fetch main assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select(`*, courses ( title, code )`)
        .eq("id", id)
        .single();

      if (assessmentError) throw assessmentError;

      setAssessment(assessmentData);
      setStatus(assessmentData.status || "Draft");

      // 2. Fetch primary questions safely
      const { data: qData, error: qError } = await supabase
        .from("questions")
        .select("*")
        .eq("assessment_id", id)
        .order("item_number", { ascending: true });

      if (qError) throw qError;

      const rawQuestions = qData || [];
      const questionIds = rawQuestions.map((q) => q.id);

      // 3. Fetch choices/options and answers separately to prevent joint/null errors
      let optionsMap = {};
      let answersMap = {};

      if (questionIds.length > 0) {
        const { data: optData } = await supabase
          .from("question_options")
          .select("*")
          .in("question_id", questionIds);

        (optData || []).forEach((opt) => {
          if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
          optionsMap[opt.question_id].push(opt);
        });

        const { data: ansData } = await supabase
          .from("answer_keys")
          .select("*")
          .in("question_id", questionIds);

        (ansData || []).forEach((ans) => {
          answersMap[ans.question_id] = ans.correct_answer;
        });
      }

      // 4. Map questions with options
      const formattedQuestions = rawQuestions.map((q) => {
        const type = q.test_section || "Multiple Choice";
        const qOptions = optionsMap[q.id] || [];
        const choices = qOptions
          .sort((a, b) => (a.option_letter || "").localeCompare(b.option_letter || ""))
          .map((o) => o.option_text);

        return {
          id: q.id,
          type,
          question: q.question_text,
          answer: answersMap[q.id] || "",
          choices,
          itemNumber: q.item_number,
        };
      });

      setQuestions(formattedQuestions);

      // Default all accordion groups to expanded
      const initialOpenState = {};
      formattedQuestions.forEach((q) => {
        initialOpenState[q.type] = true;
      });
      setOpen(initialOpenState);

    } catch (err) {
      console.error("Error loading assessment:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAssessment();
  }, [id]);

  const groups = useMemo(
    () => Object.entries(questions.reduce((result, question) => ({ ...result, [question.type]: [...(result[question.type] || []), question] }), {})),
    [questions]
  );

  const saveQuestion = async (qData) => {
    try {
      let questionId = qData.id;

      if (questionId) {
        await supabase
          .from("questions")
          .update({ question_text: qData.question, test_section: qData.type })
          .eq("id", questionId);
      } else {
        const nextItemNumber = questions.length + 1;
        const { data: newQ, error: newQErr } = await supabase
          .from("questions")
          .insert({
            assessment_id: id,
            item_number: nextItemNumber,
            test_section: qData.type,
            question_text: qData.question,
          })
          .select()
          .single();

        if (newQErr) throw newQErr;
        questionId = newQ.id;
      }

      if (qData.type === "Multiple Choice" && qData.choices?.length) {
        await supabase.from("question_options").delete().eq("question_id", questionId);
        const optionsToInsert = qData.choices.map((text, idx) => ({
          question_id: questionId,
          option_letter: String.fromCharCode(65 + idx),
          option_text: text,
        }));
        await supabase.from("question_options").insert(optionsToInsert);
      }

      if (qData.answer) {
        await supabase.from("answer_keys").delete().eq("question_id", questionId);
        await supabase.from("answer_keys").insert({
          question_id: questionId,
          correct_answer: qData.answer,
        });
      }

      // Sync total_items count on assessments table
      await supabase
        .from("assessments")
        .update({ total_items: questions.length + (qData.id ? 0 : 1) })
        .eq("id", id);

      await loadAssessment();
      setModal(null);
    } catch (err) {
      alert(`Error saving question: ${err.message}`);
    }
  };

  const updateStatus = async (nextStatus) => {
    try {
      let { error } = await supabase
        .from("assessments")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) {
        const { error: lowerErr } = await supabase
          .from("assessments")
          .update({ status: nextStatus.toLowerCase() })
          .eq("id", id);

        if (lowerErr) throw lowerErr;
      }

      setStatus(nextStatus);
      alert(`Assessment status successfully changed to ${nextStatus}!`);
    } catch (err) {
      alert(`Unable to update status: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading assessment details...</div>;
  if (!assessment) return <div className="p-8 text-center text-gray-500">Assessment not found.</div>;

  const info = [
    ["Assessment Name", assessment.title],
    ["Course Code / Title", assessment.courses ? `${assessment.courses.code} - ${assessment.courses.title}` : "—"],
    ["Assessment Type", assessment.set_type || "Written"],
    ["Time Limit", assessment.time_limit_minutes ? `${assessment.time_limit_minutes} minutes` : "N/A"],
    ["Created Date", new Date(assessment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="flex gap-2 text-sm font-semibold">
            <Link to="/admin/assessments" className="text-gray-500 hover:text-[#002f86] hover:underline">Assessment Library</Link>
            <span>&gt;</span>
            <span className="text-[#002f86]">Assessment Details</span>
          </nav>
          <h1 className="mt-2 text-4xl font-bold">{assessment.title}</h1>
          <p className="mt-2 text-gray-600">Review and manage assessment questions and settings.</p>
        </div>
        <button onClick={() => setModal("add")} className="flex items-center gap-2 rounded-lg bg-[#002f86] px-4 py-3 font-semibold text-white hover:bg-[#001f59]">
          <Plus size={18} /> Add Question
        </button>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold">Assessment Information</h2>
        <div className="mt-5 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {info.map(([label, value]) => (
            <p key={label}><b>{label}:</b> {value || "—"}</p>
          ))}
          <p><b>Status:</b> <StatusBadge status={status} /></p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-bold">Question Summary</h2>
        <div className="mt-3 flex flex-wrap gap-5">
          {groups.map(([type, list]) => (
            <span key={type}><b>{type}:</b> {list.length}</span>
          ))}
          <b>Total Questions: {questions.length}</b>
        </div>
      </section>

      {groups.map(([type, list]) => (
        <section key={type} className="overflow-hidden rounded-2xl bg-white shadow-md">
          <button onClick={() => setOpen((items) => ({ ...items, [type]: !items[type] }))} className="flex w-full items-center justify-between p-5 text-left font-bold">
            {type} <span className="ml-2 font-normal text-gray-500">({list.length})</span>
            <ChevronDown className={open[type] ? "ml-auto rotate-180" : "ml-auto"} />
          </button>
          {open[type] && (
            <div className="border-t border-gray-200">
              {list.map((question, index) => (
                <div key={question.id} className="flex gap-4 border-b border-gray-200 p-5">
                  <span className="grid h-8 w-8 place-items-center rounded bg-[#002f86] text-white font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    {question.choices?.length > 0 && (
                      <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-gray-600">
                        {question.choices.map((choice, i) => (
                          <li key={i}>
                            <b>{String.fromCharCode(65 + i)}:</b> {choice}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-sm text-gray-700">
                      <b>Answer:</b> {question.answer || "Matching pairs"}
                    </p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenu(menu === question.id ? null : question.id)} aria-label="Question actions">
                      <MoreVertical />
                    </button>
                    {menu === question.id && (
                      <div className="absolute right-0 top-7 z-10 w-28 rounded border bg-white shadow">
                        <button onClick={() => { setModal(question); setMenu(null); }} className="w-full px-3 py-2 text-left hover:bg-gray-50">
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="flex justify-end gap-3">
        <button onClick={() => updateStatus("Draft")} className="rounded border px-4 py-2 hover:bg-gray-50">Save as Draft</button>
        <button onClick={() => updateStatus("Active")} className="rounded bg-[#002f86] px-4 py-2 text-white hover:bg-[#001f59]">Activate Assessment</button>
      </div>

      {modal && <QuestionModal initial={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={saveQuestion} />}
    </div>
  );
}