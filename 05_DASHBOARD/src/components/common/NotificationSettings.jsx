import { useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronDown, ClipboardCheck, FileText, Megaphone, ShieldAlert, UserPlus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const iconCycle = [ClipboardCheck, CalendarDays, Bell, FileText, ShieldAlert, ClipboardCheck, Megaphone, UserPlus];

export default function NotificationSettings({ items }) {
  const { userId, dashboardScope } = useTheme();
  const initialState = useMemo(() => Object.fromEntries(items.map((item) => [item.id, true])), [items]);
  const [enabled, setEnabled] = useState(initialState);
  const [delivery, setDelivery] = useState("Email");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem(`noerion-notifications:${userId}:${dashboardScope}`, JSON.stringify({ enabled, delivery }));
    setSaved(true);
  };

  const cancel = () => {
    setEnabled(initialState);
    setDelivery("Email");
    setSaved(false);
  };

  return <div>
    <h2 className="text-2xl font-bold text-slate-950">Notifications</h2>
    <p className="mt-1 text-sm text-slate-600">Manage your notification preferences.</p>
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      {items.map((item, index) => {
        const Icon = iconCycle[index % iconCycle.length];
        const isEnabled = enabled[item.id];
        return <div key={item.id} className="flex items-center gap-4 border-b border-slate-200 px-4 py-3.5"><Icon className="shrink-0 text-slate-700" size={20} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-xs text-slate-600">{item.description}</p></div><button type="button" role="switch" aria-checked={isEnabled} aria-label={item.title} onClick={() => { setEnabled((current) => ({ ...current, [item.id]: !current[item.id] })); setSaved(false); }} className={`relative h-6 w-11 shrink-0 rounded-full transition ${isEnabled ? "bg-blue-700" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${isEnabled ? "left-6" : "left-1"}`} /></button></div>;
      })}
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><Bell className="shrink-0 text-slate-700" size={20} /><div><p className="text-sm font-bold text-slate-900">Email notification preference</p><p className="mt-0.5 text-xs text-slate-600">Choose how you want to receive notifications.</p></div></div><span className="relative block sm:w-40"><select value={delivery} onChange={(event) => { setDelivery(event.target.value); setSaved(false); }} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"><option>Email</option><option>Text</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} /></span></div>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">{saved && <span className="mr-auto text-sm font-medium text-emerald-600">Notification preferences saved.</span>}<button type="button" onClick={cancel} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button><button type="button" onClick={save} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b]">Save Changes</button></div>
  </div>;
}
