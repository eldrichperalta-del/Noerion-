import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StepProgressBar from "../../../components/admin/create-assessment/StepProgressBar";
import { addScheduledAssessment } from "../../../data/scheduledAssessments";
import SelectTrainees from "./create-assessment/SelectTrainees";
import AssignAssessor from "./create-assessment/AssignAssessor";
import ScheduleDetails from "./create-assessment/ScheduleAssessment";
import ReviewConfirm from "./create-assessment/ReviewConfirm";
import ChooseAssessment from "./ChooseAssessment";

const initialAssessment = () => ({ title: "", qualification: "", instructions: "", questions: [], selectedAssessment: null, trainees: [], assessor: {}, schedule: { date: "", startTime: "", endTime: "" } });

export default function ScheduleAssessmentWorkflow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentData, setAssessmentData] = useState(initialAssessment);
  const nextStep = () => setCurrentStep((step) => Math.min(step + 1, 5));
  const previousStep = () => setCurrentStep((step) => Math.max(step - 1, 1));
  const completeWorkflow = (data) => {
    const selected = data.selectedAssessment;
    if (selected) addScheduledAssessment({ id: `scheduled-${Date.now()}`, course: selected.title, qualification: selected.qualification, type: selected.assessmentType || "Written", scheduleDate: data.schedule.date || new Date().toISOString().slice(0, 10), assessment: selected, trainees: data.trainees || [], assessor: data.assessor || {}, schedule: data.schedule || {} });
    navigate("/admin/assessments/schedule");
  };
  const workflowStep = currentStep === 1 ? <ChooseAssessment assessmentData={assessmentData} setAssessmentData={setAssessmentData} onNext={nextStep} />
    : currentStep === 2 ? <SelectTrainees assessmentData={assessmentData} setAssessmentData={setAssessmentData} onNext={nextStep} onBack={previousStep} />
      : currentStep === 3 ? <AssignAssessor assessmentData={assessmentData} setAssessmentData={setAssessmentData} onNext={nextStep} onBack={previousStep} />
        : currentStep === 4 ? <ScheduleDetails assessmentData={assessmentData} setAssessmentData={setAssessmentData} onNext={nextStep} onBack={previousStep} />
          : <ReviewConfirm assessmentData={assessmentData} onNext={nextStep} onBack={previousStep} resetAssessment={() => {}} onComplete={completeWorkflow} />;

  return <div className="min-h-screen"><header className="mb-8"><nav className="flex gap-2 text-sm font-semibold"><Link to="/admin/assessments/schedule" className="text-gray-500 hover:text-[#002f86] hover:underline">Assessment Scheduling</Link><span>&gt;</span><span className="text-[#002f86]">Schedule Assessment</span></nav><h1 className="mt-2 text-3xl font-bold text-[#1E3A8A]">Schedule Assessment</h1><p className="mt-2 text-gray-600">Complete the steps to schedule an assessment session.</p></header><StepProgressBar currentStep={currentStep} />{workflowStep}</div>;
}
