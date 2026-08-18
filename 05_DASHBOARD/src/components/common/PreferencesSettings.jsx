import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, Globe2, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const languageCodes = ["af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "ceb", "cs", "cy", "da", "de", "el", "en", "eo", "es", "et", "eu", "fa", "fi", "fil", "fr", "ga", "gl", "gu", "he", "hi", "hr", "hu", "hy", "id", "is", "it", "ja", "jv", "ka", "kk", "km", "kn", "ko", "ky", "lo", "lt", "lv", "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "or", "pa", "pl", "ps", "pt", "ro", "ru", "si", "sk", "sl", "so", "sq", "sr", "su", "sv", "sw", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi", "xh", "yo", "zh", "zu"];
const displayNames = new Intl.DisplayNames(["en"], { type: "language" });

function SelectField({ value, onChange, options, getLabel = (option) => option }) {
  return <span className="relative block w-full sm:w-72"><select value={value} onChange={onChange} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100">{options.map((option) => <option key={option} value={option}>{getLabel(option)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} /></span>;
}

function PreferenceRow({ icon: Icon, title, description, children, last = false }) {
  return <div className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${last ? "" : "border-b border-slate-200"}`}><div className="flex items-center gap-4"><Icon className="shrink-0 text-slate-700" size={23} /><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-sm text-slate-600">{description}</p></div></div>{children}</div>;
}

export default function PreferencesSettings() {
  const { preferences, updatePreferences, savePreferences } = useTheme();
  const [draft, setDraft] = useState(preferences);
  const [previewDate, setPreviewDate] = useState("2026-08-17");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const timeZones = useMemo(() => Intl.supportedValuesOf?.("timeZone") || ["Asia/Manila"], []);
  const languages = useMemo(() => languageCodes.map((code) => ({ code, label: displayNames.of(code) || code })), []);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const updateDraft = (updates) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    setSaved(false);
    setError("");
    if (updates.language || updates.theme) updatePreferences(updates);
  };

  const save = async () => {
    try {
      await savePreferences(draft);
      setSaved(true);
    } catch {
      setError("Preferences were applied locally but could not be saved to your account.");
    }
  };

  const cancel = () => {
    setDraft(preferences);
    updatePreferences({ language: preferences.language, theme: preferences.theme });
    setSaved(false);
    setError("");
  };

  return <div>
    <h2 className="text-2xl font-bold text-slate-950">Preferences</h2>
    <p className="mt-1 text-sm text-slate-600">Customize your account preferences.</p>

    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <PreferenceRow icon={Globe2} title="Language" description="Choose your preferred language."><SelectField value={draft.language} onChange={(event) => updateDraft({ language: event.target.value })} options={languages.map((language) => language.code)} getLabel={(code) => displayNames.of(code) || code} /></PreferenceRow>
      <PreferenceRow icon={Clock3} title="Time Zone" description="Select your current time zone."><SelectField value={draft.timeZone} onChange={(event) => updateDraft({ timeZone: event.target.value })} options={timeZones} /></PreferenceRow>
      <PreferenceRow icon={CalendarDays} title="Date Format" description="Choose your preferred date format."><div className="w-full sm:w-72"><span className="relative block"><CalendarDays size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><input type="date" value={previewDate} onChange={(event) => setPreviewDate(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" /></span></div></PreferenceRow>
      <PreferenceRow icon={Monitor} title="Theme / Appearance" description="Select your preferred theme." last><SelectField value={draft.theme === "dark" ? "Dark" : "Light"} onChange={(event) => updateDraft({ theme: event.target.value.toLowerCase() })} options={["Light", "Dark"]} /></PreferenceRow>
    </div>

    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
      {(saved || error) && <span className={`mr-auto text-sm font-medium ${error ? "text-amber-600" : "text-emerald-600"}`}>{error || "Preferences saved."}</span>}
      <button type="button" onClick={cancel} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
      <button type="button" onClick={save} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,47,134,0.25)] transition hover:bg-[#00266b]">Save Changes</button>
    </div>
  </div>;
}
