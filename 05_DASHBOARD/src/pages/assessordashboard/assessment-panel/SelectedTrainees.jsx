import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { supabase } from "../../../supabaseClient.js";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs.jsx";
import SelectedTraineesTable from "../../../components/assessordashboard/flow/SelectedTraineesTable.jsx";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader.jsx";

export default function TraineesProgress() {
  const { state } = useLocation();

  const selectedCourse =
    state?.selectedCourse || "Assessment Batch";

  const batchId = state?.batchId;

  const assessmentId =
    state?.assessmentId || state?.courseId;

  const batchCode =
    state?.batchCode ||
    state?.courseCode ||
    "N/A";

  const assessmentCategory =
    state?.assessmentCategory || "Ongoing";

  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAssignedTrainees() {
      setLoading(true);

      try {
        // =====================================================
        // 1. FETCH ASSIGNED TRAINEES FOR THIS BATCH
        // =====================================================

        let query = supabase
          .from("assignments")
          .select("*");

        if (batchId) {
          query = query.eq("batch_id", batchId);
        } else if (assessmentId) {
          query = query.eq(
            "assessment_id",
            assessmentId
          );
        }

        const {
          data: assignmentsData,
          error: assignError,
        } = await query;

        if (assignError) {
          throw assignError;
        }

        if (
          !assignmentsData ||
          assignmentsData.length === 0
        ) {
          if (isMounted) {
            setTrainees([]);
          }

          return;
        }

        // =====================================================
        // 2. EXTRACT IDS
        // =====================================================

        const traineeIds = [
          ...new Set(
            assignmentsData
              .map((assignment) => assignment.trainee_id)
              .filter(Boolean)
          ),
        ];

        const assignmentIds = assignmentsData
          .map((assignment) => assignment.id)
          .filter(Boolean);

        // =====================================================
        // 3. FETCH TRAINEE PROFILES
        // =====================================================

        const profilesMap = {};

        if (traineeIds.length > 0) {
          const {
            data: profilesData,
            error: profilesError,
          } = await supabase
            .from("profiles")
            .select(
              "id, first_name, last_name, email"
            )
            .in("id", traineeIds);

          if (profilesError) {
            console.error(
              "Profiles error:",
              profilesError
            );
          }

          if (profilesData) {
            profilesData.forEach((profile) => {
              profilesMap[profile.id] = profile;
            });
          }
        }

        // =====================================================
        // 4. FETCH SUBMISSIONS
        // =====================================================
        //
        // IMPORTANT:
        //
        // We use assessment_submissions to determine whether
        // the trainee actually started/took the assessment.
        //
        // An assignment becoming "Completed" does NOT mean
        // the trainee completed the assessment.
        //
        // =====================================================

        const submissionsMap = {};

        if (assignmentIds.length > 0) {
          const {
            data: submissionsData,
            error: submissionsError,
          } = await supabase
            .from("assessment_submissions")
            .select("*")
            .in(
              "assignment_id",
              assignmentIds
            );

          console.log(
            "=== TRAINEE PROGRESS DEBUG ==="
          );
          console.log(
            "Batch ID:",
            batchId
          );
          console.log(
            "Assessment ID:",
            assessmentId
          );
          console.log(
            "Assignment IDs:",
            assignmentIds
          );
          console.log(
            "Submissions:",
            submissionsData
          );
          console.log(
            "Submission Error:",
            submissionsError
          );

          if (submissionsError) {
            console.error(
              "Submission query error:",
              submissionsError
            );
          }

          if (submissionsData) {
            submissionsData.forEach(
              (submission) => {
                if (
                  submission.assignment_id
                ) {
                  submissionsMap[
                    submission.assignment_id
                  ] = submission;
                }
              }
            );
          }
        }

        // =====================================================
        // 5. FORMAT TRAINEES
        // =====================================================

        const formatted =
          assignmentsData.map(
            (assignment) => {
              const profile =
                profilesMap[
                  assignment.trainee_id
                ];

              /*
               * IMPORTANT:
               *
               * Only use the submission belonging to
               * THIS assignment.
               *
               * Do not fall back to another submission
               * belonging to the same trainee.
               *
               * This prevents a submission from another
               * assessment from making this trainee appear
               * completed.
               */

              const submission =
                submissionsMap[
                  assignment.id
                ] || null;

              // =================================================
              // RESOLVE NAME
              // =================================================

              const fullName = profile
                ? `${profile.first_name || ""} ${
                    profile.last_name || ""
                  }`.trim() ||
                  profile.email
                : assignment.trainee_id
                  ? `Trainee #${assignment.trainee_id.slice(
                      0,
                      8
                    )}`
                  : "Assigned Trainee";

              // =================================================
              // RESOLVE TRAINEE STATUS
              // =================================================
              //
              // IMPORTANT:
              //
              // assignment.status is NOT used to decide
              // whether the trainee completed the assessment.
              //
              // assessment_submissions is the source of truth
              // for actual assessment activity.
              //
              // =================================================

              let status = "No Assessment";

              if (submission) {
                const rawStatus = String(
                  submission.status || ""
                )
                  .trim()
                  .toLowerCase();

                const startedAt =
                  submission.started_at;

                const submittedAt =
                  submission.submitted_at;

                /*
                 * =========================================================
                 * COMPLETED
                 * =========================================================
                 *
                 * A submission with submitted_at means the trainee
                 * actually submitted the assessment.
                 */

                if (submittedAt) {
                  status = "Completed";
                }

                /*
                 * =========================================================
                 * SUBMITTED
                 * =========================================================
                 *
                 * Some existing records may have a submitted status
                 * even if submitted_at was not populated.
                 */

                else if (
                  rawStatus === "submitted"
                ) {
                  status = "Submitted";
                }

                /*
                 * =========================================================
                 * EVALUATED
                 * =========================================================
                 *
                 * Your current database uses:
                 *
                 * status = evaluated
                 *
                 * for completed/evaluated submissions.
                 *
                 * If there is an actual submission row, this is valid
                 * evidence that the trainee took the assessment.
                 */

                else if (
                  rawStatus === "evaluated"
                ) {
                  status = "Completed";
                }

                /*
                 * =========================================================
                 * IN PROGRESS
                 * =========================================================
                 */

                else if (
                  startedAt ||
                  rawStatus === "in_progress" ||
                  rawStatus === "in progress"
                ) {
                  status = "In Progress";
                }

                /*
                 * =========================================================
                 * OTHER EXISTING SUBMISSION
                 * =========================================================
                 *
                 * A submission row itself means the trainee has started
                 * an assessment session.
                 *
                 * Therefore, don't mark it as Completed unless there is
                 * evidence of submission/evaluation.
                 */

                else {
                  status = "In Progress";
                }
              } else {
                /*
                 * =========================================================
                 * NO SUBMISSION
                 * =========================================================
                 *
                 * This is the important fix.
                 *
                 * Even if:
                 *
                 * assignment.status === "Completed"
                 *
                 * the trainee is still:
                 *
                 * No Assessment
                 *
                 * because there is no assessment_submissions row.
                 */

                status = "No Assessment";
              }

              console.log(
                "Trainee Progress:",
                fullName,
                {
                  assignmentId:
                    assignment.id,
                  assignmentStatus:
                    assignment.status,
                  submissionId:
                    submission?.id || null,
                  startedAt:
                    submission?.started_at ||
                    null,
                  submittedAt:
                    submission?.submitted_at ||
                    null,
                  submissionStatus:
                    submission?.status ||
                    null,
                  finalStatus:
                    status,
                }
              );

              return {
                id:
                  assignment.trainee_id ||
                  assignment.id,

                assignmentId:
                  assignment.id,

                batchId:
                  assignment.batch_id ||
                  batchId,

                assessmentId:
                  assignment.assessment_id ||
                  assessmentId,

                fullName,

                traineeId:
                  assignment.trainee_id
                    ? `#TR-${assignment.trainee_id
                        .slice(
                          0,
                          8
                        )
                        .toUpperCase()}`
                    : `#ASSIGN-${String(
                        assignment.id
                      )
                        .slice(
                          0,
                          6
                        )
                        .toUpperCase()}`,

                course: selectedCourse,

                status,

                submission:
                  submission || null,

                assignment,

                submissionId:
                  submission?.id ||
                  null,

                submission_id:
                  submission?.id ||
                  null,
              };
            }
          );

        if (isMounted) {
          setTrainees(formatted);
        }
      } catch (err) {
        console.error(
          "Error fetching assigned trainees:",
          err
        );

        if (isMounted) {
          setTrainees([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAssignedTrainees();

    return () => {
      isMounted = false;
    };
  }, [
    batchId,
    assessmentId,
    selectedCourse,
  ]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      <AssessorBreadcrumbs
        items={[
          {
            label: selectedCourse,
            to: "/assessor/assessment-panel",
          },
          {
            label: "Trainees Progress",
          },
        ]}
      />

      <AssessorPageHeader
        title={`Trainees for ${selectedCourse}`}
        subtitle="Monitor the assessment progress and status of trainees assigned to this assessment."
      />

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-sm">
          Fetching assigned trainees for this batch...
        </div>
      ) : (
        <SelectedTraineesTable
          trainees={trainees}
          assessmentCategory={
            assessmentCategory
          }
        />
      )}
    </div>
  );
}

