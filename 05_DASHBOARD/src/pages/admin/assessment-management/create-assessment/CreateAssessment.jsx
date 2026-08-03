import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WrittenAssessmentBuilder from "./written-assessment/WrittenAssessmentBuilder";
import { addMockAssessment } from "../../../../data/mockAssessment";

export default function CreateAssessment() {
  const navigate = useNavigate();
  const [assessmentData, setAssessmentData] = useState({ title: "", qualification: "", instructions: "", questions: [] });
  const saveAssessment = () => {
    if (!assessmentData.title.trim() || !assessmentData.qualification.trim()) {
      alert("Please provide an assessment title and qualification before saving.");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    addMockAssessment({
      id: `assessment-${Date.now()}`,
      title: assessmentData.title.trim(),
      qualification: assessmentData.qualification.trim(),
      unitOfCompetency: assessmentData.title.trim(),
      instructions: assessmentData.instructions.trim(),
      createdDate: today,
      lastUpdated: today,
      status: "Draft",
      assessmentType: "Written",
      questions: structuredClone(assessmentData.questions),
    });
    navigate("/admin/assessments");
  };

  return (
    <div className="min-h-screen">
      <header className="mb-8">
        <nav className="flex gap-2 text-sm font-semibold">
          <Link to="/admin/assessments" className="text-gray-500 hover:text-[#002f86] hover:underline">Assessment Library</Link>
          <span>&gt;</span>
          <span className="text-[#002f86]">Create Assessment</span>
        </nav>
        <h1 className="mt-2 text-3xl font-bold text-[#1E3A8A]">Create Assessment</h1>
        <p className="mt-2 text-gray-600">Create assessment details and add questions.</p>
      </header>
      <WrittenAssessmentBuilder assessmentData={assessmentData} setAssessmentData={setAssessmentData} />
      <div className="flex justify-end pt-6">
        <button type="button" onClick={saveAssessment} className="rounded-xl bg-[#001F5B] px-6 py-3 font-semibold text-white hover:bg-blue-800">Save Assessment</button>
      </div>
    </div>
  );
}
