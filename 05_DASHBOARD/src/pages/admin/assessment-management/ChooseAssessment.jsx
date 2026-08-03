import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { mockAssessments } from "../../../data/mockAssessment";

const displayStatus = (status) => status === "Pending" || status === "Ongoing" ? "Active" : status;

export default function ChooseAssessment({ assessmentData, setAssessmentData, onNext }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedId, setSelectedId] = useState(assessmentData.selectedAssessment?.id || null);
  const assessments = useMemo(() => mockAssessments.filter((assessment) => {
    const matchesSearch = `${assessment.title} ${assessment.qualification}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "All" || displayStatus(assessment.status) === status);
  }), [search, status]);
  const selectAssessment = (assessment) => {
    setSelectedId(assessment.id);
    setAssessmentData((data) => ({ ...data, selectedAssessment: assessment }));
  };
  const selected = mockAssessments.find((assessment) => String(assessment.id) === String(selectedId));

  return <div className="-mt-4 rounded-2xl bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"><h2 className="mb-4 text-xl font-semibold text-gray-900">Choose assessment for session</h2><div className="mb-4 flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search course and qualification" className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-gray-400 px-4 py-3"><option value="All">Status</option><option value="Active">Active</option><option value="Draft">Draft</option></select></div><div className="overflow-hidden rounded-xl border-2 border-gray-100"><table className="w-full"><thead className="bg-gray-200"><tr><th className="w-14 px-4 py-4 text-left">Select</th><th className="px-4 py-4 text-left">Course</th><th className="px-4 py-4 text-left">Qualification</th><th className="px-4 py-4 text-left">Assessment Type</th><th className="px-4 py-4 text-left">Status</th></tr></thead><tbody>{assessments.map((assessment) => { const itemStatus = displayStatus(assessment.status); return <tr key={assessment.id} className="border-b border-gray-200 hover:bg-gray-100"><td className="px-4 py-3"><input type="radio" name="assessment" checked={String(selectedId) === String(assessment.id)} onChange={() => selectAssessment(assessment)} /></td><td className="px-4 py-3 font-medium">{assessment.title}</td><td className="px-4 py-3">{assessment.qualification}</td><td className="px-4 py-3">{assessment.assessmentType || "Written"}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-sm ${itemStatus === "Active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>{itemStatus}</span></td></tr>; })}</tbody></table></div><div className="mt-4 flex items-start justify-between px-2 py-2 text-sm"><p className="font-medium text-gray-700">Total selected: {selected ? "1/1" : "0/1"}</p><div className="flex flex-col items-end gap-4"><div className="flex items-center gap-3 text-gray-600"><span>Showing 1-{assessments.length} of {mockAssessments.length} course</span><button type="button" className="rounded-md border border-gray-300 px-3 py-1">‹</button><button type="button" className="rounded-md border border-gray-300 bg-gray-100 px-3 py-1 font-medium">1</button><button type="button" className="rounded-md border border-gray-300 px-3 py-1">›</button></div><button type="button" disabled={!selected} onClick={onNext} className={`rounded-lg px-6 py-3 font-semibold text-white ${selected ? "bg-[#001F5B] hover:bg-[#001746]" : "cursor-not-allowed bg-gray-300"}`}>Continue</button></div></div></div>;
}
