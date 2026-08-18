import { useState } from "react";
import { BarChart3, Bell, CalendarCheck, ChevronDown, Monitor } from "lucide-react";

const settings = [
  { id: "reminder", title: "Assessment reminder preference", description: "Choose how and when you want to be reminded about assessments.", icon: Bell, value: "1 Day Before", options: ["1 Day Before", "2 Days Before", "1 Week Before"] },
  { id: "evaluation", title: "Evaluation notification preference", description: "Choose how you want to be notified about evaluation updates.", icon: CalendarCheck, value: "Instantly", options: ["Instantly", "Daily Summary", "Weekly Summary"] },
  { id: "view", title: "Default assessment view", description: "Set your preferred default view when accessing assessments.", icon: Monitor, value: "List View", options: ["List View", "Card View", "Calendar View"] },
  { id: "results", title: "Result display preferences", description: "Configure how assessment results are displayed to you.", icon: BarChart3, value: "Detailed View", options: ["Detailed View", "Summary View", "Score View"] },
];

export default function AssessmentPreferencesSettings() {
  const [values, setValues] = useState(() => Object.fromEntries(settings.map((setting) => [setting.id, setting.value])));

  return <div>
    <h2 className="text-2xl font-bold text-slate-950">Assessment Preferences</h2>
    <p className="mt-1 text-sm text-slate-600">Manage your assessment-related preferences and how you receive updates.</p>
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      {settings.map((setting) => {
        const Icon = setting.icon;
        return <div key={setting.id} className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 last:border-b-0 sm:flex-row sm:items-center"><Icon className="shrink-0 text-slate-800" size={25} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-950">{setting.title}</p><p className="mt-0.5 text-sm text-slate-600">{setting.description}</p></div><span className="relative block sm:w-36"><select value={values[setting.id]} onChange={(event) => setValues((current) => ({ ...current, [setting.id]: event.target.value }))} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100">{setting.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" size={16} /></span></div>;
      })}
    </div>
  </div>;
}
