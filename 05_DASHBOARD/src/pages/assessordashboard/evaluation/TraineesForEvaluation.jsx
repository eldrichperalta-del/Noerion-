import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "../../../supabaseClient.js";

import AssessorBreadcrumbs from "../../../components/assessordashboard/flow/AssessorBreadcrumbs.jsx";
import SelectedTraineesTable from "../../../components/assessordashboard/flow/SelectedTraineesTable.jsx";
import AssessorPageHeader from "../../../components/assessordashboard/shared/AssessorPageHeader.jsx";

import { useAssessments } from "../../../context/AssessmentContext.jsx";


// ============================================================================
// HELPERS
// ============================================================================

const normalize = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim().toLowerCase();


const firstExisting = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  ) ?? null;


// ============================================================================
// COMPONENT
// ============================================================================

export default function TraineesForEvaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const selectedCourse =
    state?.selectedCourse ??
    "Assessment Batch";

  /*
   * IMPORTANT:
   *
   * These values can be:
   *
   * - UUIDs from the database
   * - numeric mock IDs such as 1
   *
   * We DO NOT directly send them into a UUID database column.
   */
  const batchId =
    state?.batchId ??
    null;

  const assessmentId =
    state?.assessmentId ??
    state?.courseId ??
    null;

  const batchCode =
    state?.batchCode ??
    state?.courseCode ??
    "N/A";


  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");


  const {
    setSelectedAssessment,
    setSelectedTrainee,
  } = useAssessments();


  // ==========================================================================
  // FETCH MOCK DATABASE RECORDS
  // ==========================================================================

  useEffect(() => {
    let isMounted = true;


    async function fetchAssignedTrainees() {
      setLoading(true);
      setErrorMessage("");


      try {
        console.log(
          "=== TRAINEES FOR EVALUATION ==="
        );

        console.log(
          "Navigation batchId:",
          batchId
        );

        console.log(
          "Navigation assessmentId:",
          assessmentId
        );


        // ====================================================================
        // 1. FETCH ASSIGNMENTS
        //
        // DO NOT put assessmentId into .eq("assessment_id", ...)
        //
        // The page can receive mock ID "1", while assessment_id in Supabase
        // can be UUID.
        //
        // We therefore fetch the mock assignment records first and match them
        // safely in JavaScript.
        // ====================================================================

        const {
          data: assignmentsData,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select("*");


        if (assignmentsError) {
          throw assignmentsError;
        }


        const assignments =
          assignmentsData || [];


        console.log(
          "Assignments from database:",
          JSON.stringify(assignments, null, 2)
        );

        if (assignments.length === 0) {
          if (isMounted) {
            setTrainees([]);
          }

          return;
        }


        // ====================================================================
        // 2. FILTER ASSIGNMENTS SAFELY
        //
        // We compare values as strings.
        //
        // This means:
        //
        // UUID === UUID
        // "1" === 1
        //
        // without sending an invalid "1" into PostgreSQL's UUID comparison.
        // ====================================================================

        const normalizedBatchId =
          normalize(batchId);

        const normalizedAssessmentId =
          normalize(assessmentId);


        const filteredAssignments =
          assignments.filter((assignment) => {

            const assignmentBatchId =
              normalize(
                assignment.batch_id
              );

            const assignmentAssessmentId =
              normalize(
                assignment.assessment_id
              );


            /*
             * If a batch ID exists in navigation state,
             * match it only when the database record contains it.
             */
            if (
              normalizedBatchId &&
              assignmentBatchId
            ) {
              if (
                assignmentBatchId !==
                normalizedBatchId
              ) {
                return false;
              }
            }


            /*
             * If an assessment ID exists in navigation state,
             * match it only when both values actually match.
             *
             * This is safe even if the navigation value is "1".
             */
            if (
              normalizedAssessmentId &&
              assignmentAssessmentId
            ) {
              if (
                assignmentAssessmentId !==
                normalizedAssessmentId
              ) {
                return false;
              }
            }


            return true;
          });


        /*
         * If filtering produced nothing, do NOT manufacture trainees.
         *
         * However, when the navigation ID is a local/mock ID that doesn't
         * correspond to the UUID stored in the database, we can still use
         * the database mock records when there is only one logical batch.
         */
        const usableAssignments =
          filteredAssignments.length > 0
            ? filteredAssignments
            : assignments;


        console.log(
          "Assignments used for evaluation:",
          usableAssignments
        );


        // ====================================================================
        // 3. EXTRACT REAL TRAINEE UUIDs
        // ====================================================================

        const traineeIds = [
          ...new Set(
            usableAssignments
              .map(
                (assignment) =>
                  assignment.trainee_id
              )
              .filter(Boolean)
          ),
        ];


        const assignmentIds = [
          ...new Set(
            usableAssignments
              .map(
                (assignment) =>
                  assignment.id
              )
              .filter(Boolean)
          ),
        ];


        console.log(
          "Real trainee IDs from assignments:",
          traineeIds
        );

        console.log(
          "Real assignment IDs:",
          assignmentIds
        );


        // ====================================================================
        // 4. FETCH PROFILES
        //
        // IMPORTANT:
        // The values here come directly from assignment.trainee_id.
        // We never use state.assessmentId.
        // ====================================================================

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
            .in(
              "id",
              traineeIds
            );


          if (profilesError) {
            console.warn(
              "Profiles query failed:",
              profilesError
            );
          }


          (profilesData || []).forEach(
            (profile) => {
              profilesMap[
                profile.id
              ] = profile;
            }
          );
        }


        // ====================================================================
        // 5. FETCH TRAINEE PROFILES
        //
        // This is optional because the exact structure may differ between
        // database versions.
        //
        // We load the records and match them in JavaScript.
        // ====================================================================

        const traineeProfilesMap = {};


        if (traineeIds.length > 0) {

          const {
            data: traineeProfilesData,
            error: traineeProfilesError,
          } = await supabase
            .from("trainee_profiles")
            .select("*");


          if (traineeProfilesError) {

            console.warn(
              "trainee_profiles query failed:",
              traineeProfilesError
            );

          } else {

            (traineeProfilesData || []).forEach(
              (traineeProfile) => {

                const possibleId =
                  firstExisting(
                    traineeProfile.trainee_id,
                    traineeProfile.user_id,
                    traineeProfile.profile_id,
                    traineeProfile.id
                  );


                if (possibleId) {
                  traineeProfilesMap[
                    String(possibleId)
                  ] = traineeProfile;
                }

              }
            );

          }
        }


        // ====================================================================
        // 6. FETCH ASSESSMENT SUBMISSIONS
        //
        // We use REAL assignment IDs and REAL trainee IDs obtained from the
        // database.
        // ====================================================================

        const submissionsMap = {};


        let submissionsData = [];


        if (
          assignmentIds.length > 0 ||
          traineeIds.length > 0
        ) {

          /*
           * Fetch all mock submissions instead of constructing a potentially
           * invalid UUID filter.
           */
          const {
            data,
            error: submissionsError,
          } = await supabase
            .from("assessment_submissions")
            .select("*");


          if (submissionsError) {
            throw submissionsError;
          }


          submissionsData =
            data || [];
        }


        console.log(
          "Assessment submissions:",
          JSON.stringify(submissionsData, null, 2)
        );


        submissionsData.forEach(
          (submission) => {

            if (
              submission.assignment_id
            ) {

              submissionsMap[
                String(
                  submission.assignment_id
                )
              ] = submission;

            }


            if (
              submission.trainee_id
            ) {

              submissionsMap[
                String(
                  submission.trainee_id
                )
              ] = submission;

            }

          }
        );


        // ====================================================================
        // 7. FORMAT TRAINEES
        // ====================================================================

        const formattedTrainees =
          usableAssignments.map(
            (assignment) => {

              const traineeId =
                assignment.trainee_id;


              const profile =
                traineeId
                  ? profilesMap[
                  String(traineeId)
                  ]
                  : null;


              const traineeProfile =
                traineeId
                  ? traineeProfilesMap[
                  String(traineeId)
                  ]
                  : null;


              const submission =
                submissionsMap[
                String(
                  assignment.id
                )
                ] ||
                submissionsMap[
                String(
                  traineeId
                )
                ] ||
                null;


              // ================================================================
              // RESOLVE NAME
              // ================================================================

              const fullName =
                firstExisting(

                  profile
                    ? `${profile.first_name || ""} ${profile.last_name || ""
                      }`.trim()
                    : null,

                  traineeProfile?.full_name,

                  traineeProfile?.name,

                  traineeProfile
                    ? `${traineeProfile.first_name || ""} ${traineeProfile.last_name || ""
                      }`.trim()
                    : null,

                  profile?.email,

                  traineeId
                    ? `Trainee #${String(
                      traineeId
                    ).slice(0, 8)}`
                    : "Assigned Trainee"
                );


              // ================================================================
              // RESOLVE STATUS
              // ================================================================

              let status =
                "Not Started";


              if (submission) {

                const rawStatus =
                  normalize(
                    submission.status
                  );


                const rawOverallResult =
                  normalize(
                    submission.overall_result
                  );


                if (
                  rawStatus ===
                  "evaluated" ||
                  rawStatus ===
                  "completed" ||
                  rawStatus ===
                  "in evaluated"
                ) {

                  status =
                    "Evaluated";

                } else if (
                  rawStatus ===
                  "submitted" ||
                  rawOverallResult ===
                  "submitted"
                ) {

                  status =
                    "Submitted";

                } else if (
                  rawStatus ===
                  "in evaluation" ||
                  rawStatus ===
                  "in_evaluation" ||
                  rawStatus ===
                  "in evaluate"
                ) {

                  status =
                    "In Evaluation";

                } else if (
                  rawStatus ===
                  "in_progress" ||
                  rawStatus ===
                  "in progress"
                ) {

                  status =
                    "In Progress";

                }

              } else {

                const assignmentStatus =
                  normalize(
                    assignment.status
                  );


                if (
                  assignmentStatus ===
                  "completed" ||
                  assignmentStatus ===
                  "evaluated"
                ) {

                  status =
                    "Evaluated";

                } else if (
                  assignmentStatus ===
                  "in_progress" ||
                  assignmentStatus ===
                  "in progress"
                ) {

                  status =
                    "In Progress";

                }

              }


              // ================================================================
              // RETURN NORMALIZED TRAINEE
              // ================================================================

              return {

                /*
                 * IMPORTANT:
                 *
                 * This is the actual trainee UUID from the database.
                 */
                id:
                  traineeId ||
                  assignment.id,


                traineeId:
                  traineeId || null,


                assignmentId:
                  assignment.id,


                batchId:
                  assignment.batch_id ||
                  batchId ||
                  null,


                assessmentId:
                  assignment.assessment_id ||
                  assessmentId ||
                  null,


                fullName,


                /*
                 * Do not replace the real database ID with "1".
                 *
                 * The UI can still display a friendly trainee ID.
                 */
                displayTraineeId:
                  traineeId
                    ? `#TR-${String(
                      traineeId
                    ).slice(0, 8).toUpperCase()}`
                    : `#ASSIGN-${String(
                      assignment.id
                    ).slice(0, 8).toUpperCase()}`,


                course:
                  selectedCourse,


                status,


                submission:
                  submission || null,


                submissionId:
                  submission?.id || null,


                submission_id:
                  submission?.id || null,


                /*
                 * Preserve the original database records so the next page
                 * does not need to query using guessed IDs.
                 */
                assignment,


                profile:
                  profile || null,


                traineeProfile:
                  traineeProfile || null,

              };
            }
          );


        console.log(
          "Final formatted trainees:",
          JSON.stringify(formattedTrainees, null, 2)
        );


        if (isMounted) {
          setTrainees(
            formattedTrainees
          );
        }

      } catch (error) {

        console.error(
          "Error fetching trainees for evaluation:",
          error
        );


        if (isMounted) {

          setTrainees([]);

          setErrorMessage(
            "Unable to load the trainees for evaluation. Please try again."
          );

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


  // ==========================================================================
  // OPEN TRAINEE EVALUATION
  // ==========================================================================

  const handleViewAssessment = (trainee) => {

    const assessmentInfo = {

      /*
       * Prefer the REAL database assessment UUID.
       */
      id:
        trainee.assessmentId ||
        null,


      batchId:
        trainee.batchId ||
        null,


      courseCode:
        batchCode,


      courseName:
        selectedCourse,

    };


    console.log(
      "Opening trainee evaluation:",
      trainee
    );


    setSelectedAssessment(
      assessmentInfo
    );

    setSelectedTrainee(
      trainee
    );


    /*
     * IMPORTANT:
     *
     * The evaluation workflow should go directly to
     * EvaluationSummary, not AssessmentOverview.
     */
    navigate(
      "/assessor/evaluation/summary",
      {
        state: {

          selectedCourse,

          selectedTrainee:
            trainee,

          assessment:
            assessmentInfo,

          batchId:
            trainee.batchId ||
            null,

          batchCode,

          assessmentId:
            trainee.assessmentId ||
            null,

          assignmentId:
            trainee.assignmentId ||
            null,

          submissionId:
            trainee.submissionId ||
            null,

        },
      }
    );

  };


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (

    <div className="space-y-6">

      <AssessorBreadcrumbs
        items={[

          {
            label:
              selectedCourse?.qualificationName ??
              selectedCourse?.name ??
              selectedCourse?.qualification ??
              "Qualification",

            to: "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          }, "Trainees for Evaluation",
        ]}
      />


      <AssessorPageHeader
        title="Trainees for Evaluation"
        subtitle="Select a trainee to review their evaluation results."
      />


      {errorMessage && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

          {errorMessage}

        </div>

      )}


      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center font-medium text-gray-500 shadow-sm">

          Fetching assigned trainees for this batch...

        </div>

      ) : (

        <SelectedTraineesTable

          trainees={
            trainees
          }

          actionLabel={
            "View Evaluation"
          }

          onAction={
            handleViewAssessment
          }

        />

      )}

    </div>

  );

}

