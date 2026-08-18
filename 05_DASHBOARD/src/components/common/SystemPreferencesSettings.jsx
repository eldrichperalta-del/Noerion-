import { useState } from "react";
import { Bell, ChevronRight, Clock3, Compass, Settings2, X } from "lucide-react";

const preferences = [
  { id: "duration", title: "Default Assessment Duration", description: "Set the default duration for newly created assessments.", icon: Clock3, field: "Default duration (minutes)", type: "number", value: "60" },
  { id: "navigation", title: "Default Assessment Navigation Behavior", description: "Configure how trainees navigate through assessments by default.", icon: Compass, field: "Navigation behavior", type: "select", value: "Allow forward and backward navigation", options: ["Allow forward and backward navigation", "Require sequential navigation", "Lock answers after moving forward"] },
  { id: "reminders", title: "Assessment Reminder Preferences", description: "Set default reminders for upcoming and pending assessments.", icon: Bell, field: "Default reminder", type: "select", value: "24 hours before assessment", options: ["24 hours before assessment", "48 hours before assessment", "1 week before assessment"] },
  { id: "other", title: "Other System Preferences", description: "Configure other system-wide settings and options.", icon: Settings2, field: "System option", type: "text", value: "Standard assessment policy" },
];

export default function SystemPreferencesSettings() {
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState(() => Object.fromEntries(preferences.map((preference) => [preference.id, preference.value])));
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("noerion-admin-system-preferences", JSON.stringify(values));
    setSaved(true);
    setSelected(null);
  };

  return <div>
    <h2 className="text-2xl font-bold text-slate-950">System Preferences</h2>
    <p className="mt-1 text-sm text-slate-600">Configure default settings and system preferences for the assessment system.</p>
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      {preferences.map((preference) => {
        const Icon = preference.icon;
        return <button key={preference.id} type="button" onClick={() => { setSelected(preference); setSaved(false); }} className="flex w-full items-center gap-4 border-b border-slate-200 px-4 py-4 text-left last:border-b-0 transition hover:bg-slate-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800"><Icon size={22} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-950">{preference.title}</span><span className="mt-0.5 block text-sm text-slate-600">{preference.description}</span></span><ChevronRight className="shrink-0 text-slate-800" size={21} /></button>;
      })}
    </div>
    {saved && <p className="mt-4 text-sm font-medium text-emerald-600">System preference saved.</p>}

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-950">{selected.title}</h3><p className="mt-1 text-sm text-slate-600">{selected.description}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"><X size={22} /></button></div><label className="mt-6 block text-sm font-semibold text-slate-800">{selected.field}{selected.type === "select" ? <select value={values[selected.id]} onChange={(event) => setValues((current) => ({ ...current, [selected.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100">{selected.options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={selected.type} min={1} value={values[selected.id]} onChange={(event) => setValues((current) => ({ ...current, [selected.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />}</label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" onClick={save} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00266b]">Save Changes</button></div></div></div>}
  </div>;
}
