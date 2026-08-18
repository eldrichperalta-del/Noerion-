import { CalendarDays } from "lucide-react";

function ReadOnlyField({ label, children, calendar = false }) {
  return <div><p className="text-sm font-semibold text-slate-800">{label}</p><div className="relative mt-2 flex min-h-12 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800">{children}{calendar && <CalendarDays className="absolute right-3 text-slate-700" size={19} />}</div></div>;
}

export default function TraineeInformationSettings() {
  return <div>
    <h2 className="text-2xl font-bold text-slate-950">Trainee Information</h2>
    <p className="mt-1 text-sm text-slate-600">View your trainee details.</p>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <ReadOnlyField label="Trainee ID">TRN-2024-000123</ReadOnlyField>
      <ReadOnlyField label="Registration Date" calendar>January 10, 2024</ReadOnlyField>
      <ReadOnlyField label="Qualification / Program">Shielded Metal Arc Welding (SMAW) NC II</ReadOnlyField>
      <ReadOnlyField label="Account Status"><span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Active</span></ReadOnlyField>
      <ReadOnlyField label="Training Institution">TESDA Training Center - NCR</ReadOnlyField>
    </div>
  </div>;
}
