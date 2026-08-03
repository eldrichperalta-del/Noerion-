import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Copy, MoreVertical, RotateCcw, Search, Trash2 } from "lucide-react";
import { addMockAssessment, mockAssessments } from "../../data/mockAssessment";

const clone = (value) => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const qualificationLevel = (value) => value.match(/NC\s+(?:I{1,3}|IV)/)?.[0] || value;

const createLibraryItem = (assessment) => ({
  id: assessment.id,
  course: assessment.title,
  qualification: qualificationLevel(assessment.qualification),
  type: assessment.assessmentType || "Theoretical",
  questions: assessment.questions?.length || 0,
  updated: assessment.lastUpdated || "2026-07-01",
  status: assessment.status === "Pending" || assessment.status === "Ongoing" ? "Active" : assessment.status || "Draft",
});

const badge = (value) => value === "Active" ? "bg-green-100 text-green-700" : value === "Draft" ? "bg-gray-200 text-gray-700" : "bg-amber-100 text-amber-800";

function MenuItem({ label, Icon, onClick, destructive = false }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}><Icon size={16} />{label}</button>;
}

export default function AssessmentManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => mockAssessments.map(createLibraryItem));
  const [search, setSearch] = useState("");
  const [qualification, setQualification] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Last Updated");
  const [openMenu, setOpenMenu] = useState(null);

  const assessments = useMemo(() => items
    .filter((item) => (qualification === "All" || item.qualification === qualification) && (status === "All" || item.status === (status === "Archive" ? "Archived" : status)) && item.course.toLowerCase().includes(search.toLowerCase()))
    .sort((first, second) => sort === "Last Updated" ? String(second.updated).localeCompare(String(first.updated)) : first.course.localeCompare(second.course)), [items, search, qualification, status, sort]);

  const closeMenu = () => setOpenMenu(null);
  const changeStatus = (id, nextStatus) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus, updated: new Date().toISOString().slice(0, 10) } : item));
    const source = mockAssessments.find((assessment) => String(assessment.id) === String(id));
    if (source) source.status = nextStatus;
    closeMenu();
  };

  const duplicate = (item) => {
    const original = mockAssessments.find((assessment) => String(assessment.id) === String(item.id));
    if (!original) return;

    const newId = `copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duplicatedAssessment = clone(original);
    duplicatedAssessment.id = newId;
    duplicatedAssessment.title = `${original.title} - Copy`;
    duplicatedAssessment.status = "Draft";
    duplicatedAssessment.createdDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    duplicatedAssessment.lastUpdated = duplicatedAssessment.createdDate;
    addMockAssessment(duplicatedAssessment);

    setItems((current) => [{ ...createLibraryItem(duplicatedAssessment) }, ...current]);
    closeMenu();
  };

  const remove = (id, permanent = false) => {
    if (permanent && !window.confirm("Permanently delete this archived assessment? This cannot be undone.")) return;
    setItems((current) => current.filter((item) => item.id !== id));
    closeMenu();
  };

  const actions = (item) => (
    <div className={`absolute right-4 top-12 z-10 w-52 origin-top-right overflow-hidden rounded-xl border bg-white py-1 shadow-lg transition-all duration-200 ${openMenu === item.id ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-95 opacity-0"}`}>
      {item.status === "Active" && <><MenuItem label="Duplicate" Icon={Copy} onClick={() => duplicate(item)} /><MenuItem label="Archive" Icon={Archive} onClick={() => changeStatus(item.id, "Archived")} /><MenuItem label="Delete" Icon={Trash2} onClick={() => remove(item.id)} destructive /></>}
      {item.status === "Draft" && <><MenuItem label="Duplicate" Icon={Copy} onClick={() => duplicate(item)} /><MenuItem label="Delete" Icon={Trash2} onClick={() => remove(item.id)} destructive /></>}
      {item.status === "Archived" && <><MenuItem label="Restore" Icon={RotateCcw} onClick={() => changeStatus(item.id, "Active")} /><MenuItem label="Duplicate" Icon={Copy} onClick={() => duplicate(item)} /><MenuItem label="Delete Permanently" Icon={Trash2} onClick={() => remove(item.id, true)} destructive /></>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-4xl font-bold text-gray-900">Assessment Library</h1><p className="mt-2 text-gray-600">Create, organize, and manage reusable assessment templates.</p></div><button type="button" onClick={() => navigate("/admin/assessments/create")} className="rounded-xl bg-[#002f86] px-5 py-3 font-semibold text-white shadow-md hover:bg-[#001f59]">+ Create Assessment</button></div>
      <div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-[#002f86]" /></label><select value={qualification} onChange={(event) => setQualification(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="All">Qualification</option><option>NC I</option><option>NC II</option><option>NC III</option><option>NC IV</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="All">Status</option><option>Active</option><option>Draft</option><option>Archive</option></select><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option>Last Updated</option><option>Course Name</option></select></div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {assessments.map((item) => (
          <article key={item.id} className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <button onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)} className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 transition hover:bg-gray-100" aria-label="Assessment actions"><MoreVertical size={22} /></button>
            {actions(item)}
            <h2 className="pr-8 text-xl font-bold text-gray-900">{item.course}</h2>
            <dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><dt>Qualification</dt><dd className="font-semibold">{item.qualification}</dd></div><div className="flex justify-between"><dt>Assessment Type</dt><dd className="font-semibold">{item.type}</dd></div><div className="flex justify-between"><dt>Total Questions</dt><dd className="font-semibold">{item.questions}</dd></div><div className="flex justify-between"><dt>Last Updated</dt><dd className="font-semibold">{item.updated}</dd></div><div className="flex items-center justify-between"><dt>Status</dt><dd className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(item.status)}`}>{item.status}</dd></div></dl>
            <button type="button" onClick={() => navigate(`/admin/assessments/${item.id}`)} className="mt-6 w-full rounded-lg bg-[#002f86] py-3 font-semibold text-white hover:bg-[#001f59]">View Assessment</button>
          </article>
        ))}
        {!assessments.length && <p className="text-gray-500">No assessments match your filters.</p>}
      </div>
    </div>
  );
}
