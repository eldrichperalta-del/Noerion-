import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import PreferencesSettings from "../../components/common/PreferencesSettings";
import AccountSecuritySettings from "../../components/common/AccountSecuritySettings";
import NotificationSettings from "../../components/common/NotificationSettings";
import TraineeInformationSettings from "../../components/traineedashboard/TraineeInformationSettings";

const accountDetails = {
  name: "Juan Dela Cruz",
  role: "Trainee",
  qualification: "Shielded Metal Arc Welding (SMAW) NC II",
  institution: "TESDA Training Center - NCR",
};

const initialForm = {
  fullName: "Juan Dela Cruz",
  birthDate: "2000-01-15",
  email: "juan.delacruz@example.com",
  address: "123 Mabini Street, Barangay 10,\nQuezon City, Metro Manila,\nPhilippines 1100",
  contactNumber: "0917 123 4567",
};

const tabs = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "trainee", label: "Trainee Information", icon: ClipboardList },
  { id: "security", label: "Account & Security", icon: LockKeyhole },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
];

const notificationItems = [
  ["availability", "Assessment availability notifications", "Receive notifications when new assessments are available for you."],
  ["schedule", "Assessment schedule reminders", "Receive reminders about your upcoming assessment schedules."],
  ["reminder", "Assessment reminder notifications", "Receive reminders before your scheduled assessments."],
  ["completion", "Assessment completion notifications", "Receive notifications after you complete an assessment."],
  ["results", "Results availability notifications", "Receive notifications when your assessment results are available."],
  ["certificates", "Certificate availability notifications", "Receive notifications when your certificates are available."],
  ["announcements", "System announcements", "Receive important updates and announcements from the system."],
].map(([id, title, description]) => ({ id, title, description }));

function PlaceholderTab({ tab }) {
  const descriptions = {
    trainee: "Review your qualification, training institution, and trainee details.",
    security: "Manage your password, sign-in methods, and account security.",
    notifications: "Choose how you would like to receive account notifications.",
    preferences: "Customize your dashboard experience and application preferences.",
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-950">{tab.label}</h2>
      <p className="mt-1 text-sm text-slate-600">{descriptions[tab.id]}</p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {tab.label} settings will appear here.
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("personal");
  const [securityViewKey, setSecurityViewKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  const updateField = (field, value) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveChanges = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  const cancelChanges = () => {
    setForm(initialForm);
    setSaved(false);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="p-0 pb-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">My Account</h1>
        <p className="mt-1 text-base text-slate-600">
          Manage your personal information, account security, and preferences.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
        <h2 className="text-xl font-bold text-slate-950">Account Overview</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr_1.25fr_0.9fr] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <img
              src="/trainee.jpg"
              alt="Juan Dela Cruz"
              className="h-32 w-32 rounded-full border-4 border-slate-100 object-cover"
              onError={(event) => { event.currentTarget.src = "/admin.jpg"; }}
            />
          </div>

          <div className="border-slate-200 lg:border-r lg:pr-6">
            <p className="text-sm font-semibold text-slate-700">Full Name:</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{accountDetails.name}</p>
            <p className="mt-5 text-sm font-semibold text-slate-700">Role:</p>
            <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {accountDetails.role}
            </span>
          </div>

          <div className="border-slate-200 lg:border-r lg:pr-6">
            <p className="text-sm font-semibold text-slate-700">Qualification / Program:</p>
            <p className="mt-2 font-bold text-slate-950">{accountDetails.qualification}</p>
            <div className="my-4 border-t border-slate-200" />
            <p className="text-sm font-semibold text-slate-700">Training Institution:</p>
            <p className="mt-2 font-bold text-slate-950">{accountDetails.institution}</p>
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
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setSaved(false); if (tab.id === "security") setSecurityViewKey((key) => key + 1); }}
                  className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-[#002f86] bg-slate-100 text-slate-950" : "border-transparent text-slate-700 hover:bg-slate-50"}`}
                >
                  <Icon size={22} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
          {activeTab === "preferences" ? <PreferencesSettings /> : activeTab === "security" ? <AccountSecuritySettings resetKey={securityViewKey} /> : activeTab === "notifications" ? <NotificationSettings items={notificationItems} /> : activeTab === "trainee" ? <TraineeInformationSettings /> : activeTab !== "personal" ? (
            <PlaceholderTab tab={activeTabData} />
          ) : (
            <form onSubmit={saveChanges}>
              <h2 className="text-2xl font-bold text-slate-950">Personal Information</h2>
              <p className="mt-1 text-sm text-slate-600">View and update your personal details.</p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">Full Name
                  <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-semibold text-slate-800">Date of Birth
                  <span className="relative mt-2 block"><CalendarDays size={19} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="date" value={form.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-11 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" /></span>
                </label>
                <label className="text-sm font-semibold text-slate-800">Email Address
                  <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="row-span-2 text-sm font-semibold text-slate-800">Address
                  <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-2 min-h-36 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-semibold text-slate-800">Contact Number
                  <input value={form.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                {saved && <span className="mr-auto text-sm font-medium text-emerald-600">Changes saved for this session.</span>}
                <button type="button" onClick={cancelChanges} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b]">Save Changes</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
