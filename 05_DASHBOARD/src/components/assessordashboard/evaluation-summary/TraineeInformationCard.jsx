import {
  GraduationCap,
  IdCard,
  UserRound,
} from "lucide-react";

import AssessorPanel from "../shared/AssessorPanel";

export default function TraineeInformationCard({
  trainee = {},
}) {
  // ==========================================================
  // BACKEND HANDOFF:
  // Replace the mock "trainee" prop with data retrieved from
  // the selected trainee evaluation record.
  //
  // Expected object structure:
  // {
  //   name: string,
  //   id: string,
  //   course: string
  // }
  // ==========================================================

  return (
    <AssessorPanel title="">
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-3">

        {/* Trainee Name */}
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <UserRound
              size={24}
              className="text-[#2563eb]"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trainee Name
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {trainee.name ?? "-"}
            </p>
          </div>

        </div>

        {/* Trainee ID */}
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <IdCard
              size={24}
              className="text-[#2563eb]"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trainee ID
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {trainee.id ?? "-"}
            </p>
          </div>

        </div>

        {/* Course */}
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <GraduationCap
              size={24}
              className="text-[#2563eb]"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Course
            </p>

            <p className="mt-1 text-xl font-bold leading-snug text-gray-900">
              {trainee.course ?? "-"}
            </p>
          </div>

        </div>

      </div>
    </AssessorPanel>
  );
}