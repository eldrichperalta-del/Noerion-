import {
  Activity,
  ClipboardList,
  Clock3,
  FileText,
  ListChecks,
} from "lucide-react";

import AssessorPanel from "../shared/AssessorPanel";
import AssessorStatusBadge from "../shared/AssessorStatusBadge";

export default function AssessmentOverviewPanel({
  trainee,
  sections,
  onEvaluate,
}) {
  const section = sections[0];

  return (
    <div className="space-y-4">

      {/* =======================================================
          Trainee Information
      ======================================================= */}
      <AssessorPanel title="">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trainee Name
            </p>

            <p className="mt-2 text-base font-semibold text-gray-900">
              {trainee.fullName}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trainee ID
            </p>

            <p className="mt-2 text-base font-semibold text-gray-900">
              {trainee.traineeId}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Course
            </p>

            <p className="mt-2 text-base font-semibold text-gray-900">
              {trainee.course}
            </p>
          </div>

        </div>
      </AssessorPanel>

      {/* =======================================================
          Written Assessment
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-md">

        <div className="grid grid-cols-1 items-center gap-6 px-6 py-5 lg:grid-cols-[2fr_0.8fr_1fr_auto]">

          {/* Assessment Info */}
          <div className="flex items-center gap-5">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#002f86]">
              <ClipboardList size={30} />
            </div>

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                {section.title}
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
                {section.description}
              </p>

            </div>

          </div>

          {/* Status */}
          <div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </p>

            <AssessorStatusBadge status={section.status} />

          </div>

          {/* EEG */}
          <div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              EEG Indicator
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-[#2563eb]">

              <Activity
                size={18}
                strokeWidth={2.5}
              />

              <span>{section.eegStatus}</span>

            </div>

          </div>

          {/* Button */}
          <div className="flex justify-end">

            <button
              type="button"
              disabled={section.status === "Not Started"}
              onClick={onEvaluate}
              className={`
              rounded-lg px-10 py-3 text-sm font-semibold transition

                ${section.status === "Not Started"
                  ? "cursor-not-allowed bg-yellow-200 text-yellow-700 border border-gray-200"
                  : "bg-[#002f86] text-white hover:bg-[#00266b]"
                }
              `}
            >
              {section.status === "Not Started"
                ? "Processing"
                : "Evaluate"}
            </button>

          </div>
        </div>

      </div>

      {/* =======================================================
          Assessment Mode
      ======================================================= */}

      <div className="flex min-h-[100px] rounded-2xl border border-gray-200 bg-white px-6 py-4
        shadow-md transition-all duration-300
        hover:-translate-y-1 hover:shadow-2xl">
        <div className="flex w-full items-center gap-5">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <ListChecks className="h-5 w-5 text-orange-700" />
          </div>

          <div className="flex-1">

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Assessment Mode
            </p>

            <div className="mt-2 flex flex-wrap gap-2">

              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Multiple Choice
              </span>

              <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                True or False
              </span>

              <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700">
                Identification
              </span>

              <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
                Matching Type
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =======================================================
          Assessment Details
      ======================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Duration */}
        <div className="flex min-h-[100px] rounded-2xl border border-gray-200 bg-white px-6 py-4
          shadow-md transition-all duration-300
          hover:-translate-y-1 hover:shadow-2xl">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Clock3 className="h-5 w-5 text-[#002f86]" />
            </div>

            <div>

              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Duration
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                40 Minutes
              </p>

            </div>

          </div>

        </div>

        {/* Questions */}
        <div className="flex min-h-[100px] rounded-2xl border border-gray-200 bg-white px-6 py-4
          shadow-md transition-all duration-300
          hover:-translate-y-1 hover:shadow-2xl">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <FileText className="h-5 w-5 text-green-700" />
            </div>

            <div>

              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Questions
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                40 Items
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}