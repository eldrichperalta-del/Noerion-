import { GraduationCap, IdCard, UserRound } from "lucide-react";
import AssessorPanel from "../shared/AssessorPanel";

export default function TraineeInformationCard({ trainee = {} }) {
  return (
    <AssessorPanel title="">
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
        {/* Trainee Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Trainee Name
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {trainee.name ?? "-"}
            </p>
          </div>
        </div>

        {/* Trainee ID */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <IdCard size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Trainee ID
            </p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-800">
              {trainee.id ?? "-"}
            </p>
          </div>
        </div>

        {/* Course */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Course / Qualification
            </p>
            <p className="mt-0.5 text-base font-bold leading-snug text-slate-900">
              {trainee.course ?? "-"}
            </p>
          </div>
        </div>
      </div>
    </AssessorPanel>
  );
}