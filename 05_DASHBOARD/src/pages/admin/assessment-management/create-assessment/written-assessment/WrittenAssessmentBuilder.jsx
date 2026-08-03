import { useState } from "react";
import { Plus } from "lucide-react";
import AssessmentInfo from "../../../../../components/admin/create-assessment/written-assessment/AssessmentInfo";
import QuestionList from "../../../../../components/admin/create-assessment/written-assessment/QuestionList";
import AddQuestionModal from "../../../../../components/admin/create-assessment/written-assessment/AddQuestionModal";

export default function WrittenAssessmentBuilder({ assessmentData, setAssessmentData }) {
  const [openModal, setOpenModal] = useState(false);
  const questions = assessmentData.questions || [];

  const addQuestion = (question) => {
    setAssessmentData({ ...assessmentData, questions: [...questions, { id: Date.now(), ...question }] });
    setOpenModal(false);
  };

  const deleteQuestion = (id) => setAssessmentData({ ...assessmentData, questions: questions.filter((question) => question.id !== id) });

  return (
    <div className="space-y-6">
      <AssessmentInfo assessmentData={assessmentData} setAssessmentData={setAssessmentData} />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Questions</h2>
        <button onClick={() => setOpenModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"><Plus size={18} />Add Question</button>
      </div>
      <QuestionList questions={questions} onDelete={deleteQuestion} />
      {openModal && <AddQuestionModal onClose={() => setOpenModal(false)} onSave={addQuestion} />}
    </div>
  );
}
