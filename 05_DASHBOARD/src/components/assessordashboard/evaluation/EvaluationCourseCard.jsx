import {
  ClipboardList,
  Users,
  ArrowRight,
  FileText,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const formatNumber = (value) =>
  new Intl.NumberFormat().format(
    Number(value) || 0
  );

const getCourseLabel = (course) => {
  if (!course) return "Unknown Course";

  return (
    course.title ??
    course.name ??
    course.qualificationName ??
    "Unknown Course"
  );
};

const getQualificationLevel = (course) => {
  return (
    course.qualificationLevel ??
    course.qualification_level ??
    ""
  );
};

const getProgressText = (assessment) => {
  const completed =
    Number(
      assessment.completedEvaluations
    ) || 0;

  const total =
    Number(
      assessment.totalTrainees
    ) || 0;

  const percentage =
    Number(
      assessment.progressPercentage
    ) || 0;

  return `${completed} / ${total} Completed (${percentage}%)`;
};

const getProgressWidth = (assessment) => {
  const percentage =
    Number(
      assessment.progressPercentage
    ) || 0;

  return Math.min(
    Math.max(percentage, 0),
    100
  );
};

const getAssessmentStatus = (assessment) => {
  const status = String(
    assessment.status ?? ""
  )
    .trim()
    .toLowerCase();

  if (
    status === "draft"
  ) {
    return {
      label: "Draft",
      className:
        "bg-gray-100 text-gray-600",
    };
  }

  if (
    status === "inactive" ||
    assessment.isActive === false
  ) {
    return {
      label: "Inactive",
      className:
        "bg-gray-100 text-gray-600",
    };
  }

  if (
    Number(
      assessment.totalTrainees
    ) > 0 &&
    Number(
      assessment.completedEvaluations
    ) >=
    Number(
      assessment.totalTrainees
    )
  ) {
    return {
      label: "Completed",
      className:
        "bg-green-50 text-green-700",
    };
  }

  return {
    label: "Active",
    className:
      "bg-blue-50 text-blue-700",
  };
};

export default function EvaluationCourseCard({
  course,
}) {
  const navigate = useNavigate();

  const assessments =
    course?.assessments ?? [];

  const courseLabel =
    getCourseLabel(course);

  const qualificationLevel =
    getQualificationLevel(course);

  /* ================================================================
     NAVIGATION

     View Trainees opens the exact assessment.

     We pass:
       selectedCourse
       assessmentId
       assessment
       batchId
       batchCode
  ================================================================= */

  const handleViewTrainees = (
    assessment
  ) => {
    const firstBatch =
      assessment?.batches?.[0] ?? null;

    navigate(
      "/assessor/evaluation/trainees",
      {
        state: {
          selectedCourse: {
            id: course.id,
            code: course.code,
            title: course.title,
            name: course.title,
            qualificationName:
              course.qualificationName ??
              course.title,
            qualificationLevel:
              course.qualificationLevel,
          },

          assessmentId:
            assessment.id,

          assessment: {
            id: assessment.id,
            title: assessment.title,
            setType:
              assessment.setType,
            totalItems:
              assessment.totalItems,
            status:
              assessment.status,
            isActive:
              assessment.isActive,
          },

          batchId:
            firstBatch?.id ?? null,

          batchCode:
            firstBatch?.name ?? null,
        },
      }
    );
  };

  /* ================================================================
     EMPTY ASSESSMENTS

     The course STILL renders.
  ================================================================= */

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ================================================================
          COURSE HEADER
      ================================================================= */}

      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList
                size={20}
                className="text-gray-500"
              />

              <h2 className="text-lg font-bold text-gray-900">
                {courseLabel}
              </h2>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {qualificationLevel && (
                <span>
                  {qualificationLevel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <FileText size={16} />

            <span>
              {formatNumber(
                assessments.length
              )}{" "}
              {assessments.length === 1
                ? "Assessment"
                : "Assessments"}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          ASSESSMENT TABLE
      ================================================================= */}

      {assessments.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">
            No assessments available
          </p>

          <p className="mt-1 text-sm text-gray-400">
            This course is still displayed because
            it exists in the courses table.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Assessment
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  No. of Trainees
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Evaluation Progress
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {assessments.map(
                (assessment) => {
                  const status =
                    getAssessmentStatus(
                      assessment
                    );

                  const progressWidth =
                    getProgressWidth(
                      assessment
                    );

                  const hasTrainees =
                    Number(
                      assessment.totalTrainees
                    ) > 0;

                  return (
                    <tr
                      key={assessment.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                    >
                      {/* ==================================================
                          ASSESSMENT
                      =================================================== */}

                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <FileText
                              size={17}
                              className="text-gray-600"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {assessment.title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {assessment.setType && (
                                <span className="text-xs text-gray-500">
                                  {assessment.setType}
                                </span>
                              )}

                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ==================================================
                          TRAINEES
                      =================================================== */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Users
                            size={17}
                            className="text-gray-400"
                          />

                          <span className="font-semibold text-gray-900">
                            {formatNumber(
                              assessment.totalTrainees
                            )}
                          </span>
                        </div>
                      </td>

                      {/* ==================================================
                          PROGRESS
                      =================================================== */}

                      <td className="px-6 py-5">
                        <div className="min-w-[250px]">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-gray-700">
                              {getProgressText(
                                assessment
                              )}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gray-900 transition-all"
                              style={{
                                width: `${progressWidth}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* ==================================================
                          ACTION
                      =================================================== */}

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewTrainees(
                              assessment
                            )
                          }
                          disabled={
                            !hasTrainees
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          View Trainees

                          <ArrowRight
                            size={16}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}