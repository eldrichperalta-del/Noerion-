import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import PreferencesSettings from "./PreferencesSettings";
import AccountSecuritySettings from "./AccountSecuritySettings";
import NotificationSettings from "./NotificationSettings";
import SystemPreferencesSettings from "./SystemPreferencesSettings";
import AssessmentPreferencesSettings from "../assessordashboard/AssessmentPreferencesSettings";

const commonTabs = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "security", label: "Account & Security", icon: LockKeyhole },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "system", label: "System Preferences", icon: ClipboardList },
];

export default function AccountSettingsPage({
  role,
  avatar,
  officeLabel,
  officeValue,
  fields,
  initialValues,
  extraTabs = [],
  accreditation,
  hideSystemPreferences = false,
  notificationItems = [],
  showAssessmentPreferences = false,
}) {
  const [activeTab, setActiveTab] = useState("personal");
  const [securityViewKey, setSecurityViewKey] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(false);
  const tabs = [...commonTabs.slice(0, 3), ...extraTabs, ...commonTabs.slice(3)].filter(
    (tab) => !(hideSystemPreferences && tab.id === "system")
  );
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const updateField = (key, value) => {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="p-0 pb-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">My Account</h1>
        <p className="mt-1 text-base text-slate-600">Manage your personal information, account security, and preferences.</p>
      </header>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
        <h2 className="text-xl font-bold text-slate-950">Account Overview</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr_1.25fr_0.9fr] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <img src={avatar} alt={values.fullName} className="h-32 w-32 rounded-full border-4 border-slate-100 object-cover" onError={(event) => { event.currentTarget.src = "/admin.jpg"; }} />
          </div>
          <div className="border-slate-200 lg:border-r lg:pr-6">
            <p className="text-sm font-semibold text-slate-700">Full Name:</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{values.fullName}</p>
            <p className="mt-5 text-sm font-semibold text-slate-700">Role:</p>
            <span className="mt-2 inline-flex rounded-full bg-[#002f86] px-3 py-1 text-sm font-semibold text-white">{role}</span>
          </div>
          <div className="border-slate-200 lg:border-r lg:pr-6">
            <p className="text-sm font-semibold text-slate-700">{officeLabel}:</p>
            <p className="mt-2 font-bold text-slate-950">{officeValue}</p>
            {accreditation && <><div className="my-4 border-t border-slate-200" /><p className="text-sm font-semibold text-slate-700">Accreditation Status:</p><span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{accreditation}</span></>}
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">Account Status:</p>
            <p className="flex items-center gap-3 font-semibold text-slate-900"><span className="h-3 w-3 rounded-full bg-emerald-500" />Active</p>
            <p className="flex items-center gap-3 font-semibold text-slate-900"><CheckCircle2 className="text-emerald-500" size={21} />Email Verified</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
          <h2 className="text-xl font-bold text-slate-950">Settings</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">Navigation</p>
          <nav className="mt-5 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setSaved(false); if (tab.id === "security") setSecurityViewKey((key) => key + 1); }} className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-[#002f86] bg-slate-100 text-slate-950" : "border-transparent text-slate-700 hover:bg-slate-50"}`}><Icon size={22} />{tab.label}</button>;
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
          {activeTab === "preferences" ? <PreferencesSettings /> : activeTab === "security" ? <AccountSecuritySettings resetKey={securityViewKey} /> : activeTab === "notifications" ? <NotificationSettings items={notificationItems} /> : activeTab === "assessment" && showAssessmentPreferences ? <AssessmentPreferencesSettings /> : activeTab === "system" ? <SystemPreferencesSettings /> : activeTab !== "personal" ? (
            <div><h2 className="text-2xl font-bold text-slate-950">{activeTabData.label}</h2><p className="mt-1 text-sm text-slate-600">Manage your {activeTabData.label.toLowerCase()} settings.</p><div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{activeTabData.label} settings will appear here.</div></div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
              <h2 className="text-2xl font-bold text-slate-950">Personal Information Details</h2>
              <p className="mt-1 text-sm text-slate-600">View and update your personal details.</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {fields.map((field) => <label key={field.id} className="text-sm font-semibold text-slate-800">{field.label}{field.type === "select" ? <select value={values[field.id]} onChange={(event) => updateField(field.id, event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100">{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type || "text"} value={values[field.id]} onChange={(event) => updateField(field.id, event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />}</label>)}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {saved && <span className="mr-auto text-sm font-medium text-emerald-600">Changes saved for this session.</span>}
                <button type="button" onClick={() => { setValues(initialValues); setSaved(false); }} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b]">Save Changes</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
