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

const normalize = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
};


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

  // --------------------------------------------------------------------------
  // NAVIGATION DATA
  // --------------------------------------------------------------------------

  const selectedCourse =
    state?.selectedCourse ??
    null;

  const batchId =
    state?.batchId ??
    null;

  const assessmentId =
    state?.assessmentId ??
    state?.assessment?.id ??
    null;

  const batchCode =
    state?.batchCode ??
    state?.courseCode ??
    "N/A";


  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");


  const {
    setSelectedAssessment,
    setSelectedTrainee,
  } = useAssessments();


  // ==========================================================================
  // COURSE LABEL
  // ==========================================================================

  const courseLabel =
    typeof selectedCourse === "string"
      ? selectedCourse
      : firstExisting(
        selectedCourse?.qualificationName,
        selectedCourse?.courseName,
        selectedCourse?.name,
        selectedCourse?.qualification,
        "Selected Course"
      );


  // ==========================================================================
  // FETCH ASSIGNED TRAINEES
  // ==========================================================================

  useEffect(() => {
    let isMounted = true;


    async function fetchAssignedTrainees() {
      setLoading(true);
      setErrorMessage("");


      try {
        console.log(
          "===================================================="
        );

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

        console.log(
          "Selected course:",
          selectedCourse
        );


        // ====================================================================
        // 1. GET CURRENT AUTHENTICATED USER
        //
        // assignments.assessor_id contains the Supabase Auth user UUID.
        // Therefore, this is the most important filter.
        // ====================================================================

        const {
          data: {
            user,
          },
          error: authError,
        } = await supabase.auth.getUser();


        if (authError) {
          throw authError;
        }


        if (!user?.id) {
          throw new Error(
            "No authenticated assessor was found."
          );
        }


        const currentAssessorId =
          user.id;


        console.log(
          "Current authenticated assessor:",
          currentAssessorId
        );


        // ====================================================================
        // 2. FETCH ASSIGNMENTS FOR THIS ASSESSOR ONLY
        //
        // IMPORTANT:
        //
        // We DO NOT fetch every assignment anymore.
        //
        // This prevents:
        //
        // Assessor A seeing Assessor B's trainees.
        // ====================================================================

        let assignmentsQuery =
          supabase
            .from("assignments")
            .select("*")
            .eq(
              "assessor_id",
              currentAssessorId
            );


        // ====================================================================
        // 3. FILTER BY BATCH WHEN AVAILABLE
        //
        // This ensures the page shows trainees assigned to this assessor
        // specifically for the selected assessment batch.
        // ====================================================================

        if (batchId) {
          assignmentsQuery =
            assignmentsQuery.eq(
              "batch_id",
              batchId
            );
        }


        // ====================================================================
        // 4. FILTER BY ASSESSMENT WHEN AVAILABLE
        //
        // Example:
        //
        // Computer Systems Servicing Set B
        // assessment_id =
        // 804760a0-44fc-4187-ad73-cbb081071355
        //
        // Only assignments for that assessment are returned.
        // ====================================================================

        if (assessmentId) {
          assignmentsQuery =
            assignmentsQuery.eq(
              "assessment_id",
              assessmentId
            );
        }


        const {
          data: assignmentsData,
          error: assignmentsError,
        } = await assignmentsQuery;


        if (assignmentsError) {
          throw assignmentsError;
        }


        const assignments =
          assignmentsData || [];


        console.log(
          "Assignments for current assessor:",
          JSON.stringify(
            assignments,
            null,
            2
          )
        );


        // ====================================================================
        // 5. NEVER FALL BACK TO ALL ASSIGNMENTS
        //
        // If there are no assignments for this assessor/batch/assessment,
        // the correct result is an empty table.
        // ====================================================================

        if (assignments.length === 0) {
          console.log(
            "No trainees are assigned to this assessor for the selected batch/assessment."
          );


          if (isMounted) {
            setTrainees([]);
          }


          return;
        }


        // ====================================================================
        // 6. SAFETY CHECK
        //
        // Even though the database query already filters assessor_id,
        // perform a second JavaScript-level check.
        //
        // This makes sure that only assignments belonging to the currently
        // authenticated assessor reach the UI.
        // ====================================================================

        const assessorAssignments =
          assignments.filter(
            (assignment) =>
              normalize(
                assignment.assessor_id
              ) ===
              normalize(
                currentAssessorId
              )
          );


        console.log(
          "Verified assessor assignments:",
          JSON.stringify(
            assessorAssignments,
            null,
            2
          )
        );


        if (
          assessorAssignments.length === 0
        ) {
          if (isMounted) {
            setTrainees([]);
          }

          return;
        }


        // ====================================================================
        // 7. EXTRACT TRAINEE IDS
        // ====================================================================

        const traineeIds = [
          ...new Set(
            assessorAssignments
              .map(
                (assignment) =>
                  assignment.trainee_id
              )
              .filter(Boolean)
          ),
        ];


        // ====================================================================
        // 8. EXTRACT ASSIGNMENT IDS
        // ====================================================================

        const assignmentIds = [
          ...new Set(
            assessorAssignments
              .map(
                (assignment) =>
                  assignment.id
              )
              .filter(Boolean)
          ),
        ];


        console.log(
          "Trainee IDs:",
          traineeIds
        );

        console.log(
          "Assignment IDs:",
          assignmentIds
        );


        // ====================================================================
        // 9. FETCH PROFILES
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
                String(profile.id)
              ] = profile;
            }
          );
        }


        // ====================================================================
        // 10. FETCH TRAINEE PROFILES
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
        // 11. FETCH SUBMISSIONS
        //
        // We only need submissions belonging to:
        //
        // - this assessor
        // - these assignments
        // - these trainees
        //
        // We can safely fetch the assessor's submissions and match them
        // against the already-filtered assignments.
        // ====================================================================

        const submissionsMapByAssignment = {};
        const submissionsMapByTrainee = {};


        if (
          assignmentIds.length > 0 ||
          traineeIds.length > 0
        ) {
          const {
            data: submissionsData,
            error: submissionsError,
          } = await supabase
            .from("assessment_submissions")
            .select("*")
            .eq(
              "assessor_id",
              currentAssessorId
            );


          if (submissionsError) {
            throw submissionsError;
          }


          console.log(
            "Submissions for current assessor:",
            JSON.stringify(
              submissionsData || [],
              null,
              2
            )
          );


          (submissionsData || []).forEach(
            (submission) => {
              // --------------------------------------------------------------
              // Match by assignment_id
              // --------------------------------------------------------------

              if (
                submission.assignment_id
              ) {
                submissionsMapByAssignment[
                  String(
                    submission.assignment_id
                  )
                ] = submission;
              }


              // --------------------------------------------------------------
              // Match by trainee_id
              // --------------------------------------------------------------

              if (
                submission.trainee_id
              ) {
                submissionsMapByTrainee[
                  String(
                    submission.trainee_id
                  )
                ] = submission;
              }
            }
          );
        }


        // ====================================================================
        // 12. FORMAT TRAINEES
        // ====================================================================

        const formattedTrainees =
          assessorAssignments.map(
            (assignment) => {

              const traineeId =
                assignment.trainee_id;


              const profile =
                traineeId
                  ? profilesMap[
                  String(
                    traineeId
                  )
                  ] || null
                  : null;


              const traineeProfile =
                traineeId
                  ? traineeProfilesMap[
                  String(
                    traineeId
                  )
                  ] || null
                  : null;


              // --------------------------------------------------------------
              // Prefer exact assignment match for submission.
              // --------------------------------------------------------------

              const submission =
                submissionsMapByAssignment[
                String(
                  assignment.id
                )
                ] ||
                submissionsMapByTrainee[
                String(
                  traineeId
                )
                ] ||
                null;


              // ==============================================================
              // RESOLVE TRAINEE NAME
              // ==============================================================

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


              // ==============================================================
              // RESOLVE STATUS
              // ==============================================================

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


              // ==============================================================
              // RETURN TRAINEE RECORD
              // ==============================================================

              return {

                // ------------------------------------------------------------
                // REAL TRAINEE UUID
                // ------------------------------------------------------------

                id:
                  traineeId ||
                  assignment.id,


                traineeId:
                  traineeId ||
                  null,


                // ------------------------------------------------------------
                // REAL ASSIGNMENT ID
                // ------------------------------------------------------------

                assignmentId:
                  assignment.id,


                // ------------------------------------------------------------
                // BATCH
                // ------------------------------------------------------------

                batchId:
                  assignment.batch_id ||
                  batchId ||
                  null,


                batchCode:
                  batchCode,


                batchName:
                  assignment.batch_name ||
                  null,


                // ------------------------------------------------------------
                // ASSESSMENT
                // ------------------------------------------------------------

                assessmentId:
                  assignment.assessment_id ||
                  assessmentId ||
                  null,


                assessmentName:
                  assignment.assessment_name ||
                  null,


                assessmentType:
                  assignment.assessment_type ||
                  null,


                // ------------------------------------------------------------
                // COURSE
                // ------------------------------------------------------------

                course:
                  selectedCourse,


                courseName:
                  assignment.assessment_name ||
                  courseLabel,


                qualification:
                  assignment.qualification ||
                  null,


                // ------------------------------------------------------------
                // TRAINEE
                // ------------------------------------------------------------

                fullName:


                  fullName,


                displayTraineeId:
                  traineeId
                    ? `#TR-${String(
                      traineeId
                    )
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
                        8
                      )
                      .toUpperCase()}`,


                // ------------------------------------------------------------
                // STATUS
                // ------------------------------------------------------------

                status:


                  status,


                // ------------------------------------------------------------
                // SUBMISSION
                // ------------------------------------------------------------

                submission:
                  submission ||
                  null,


                submissionId:
                  submission?.id ||
                  null,


                submission_id:
                  submission?.id ||
                  null,


                // ------------------------------------------------------------
                // ORIGINAL DATABASE RECORDS
                // ------------------------------------------------------------

                assignment:
                  assignment,


                profile:
                  profile,


                traineeProfile:
                  traineeProfile,
              };
            }
          );


        // ====================================================================
        // 13. REMOVE DUPLICATE TRAINEES
        //
        // A trainee should normally have one assignment for the selected
        // batch/assessment. This prevents accidental duplicate rows.
        // ====================================================================

        const uniqueTrainees = [];
        const seenTrainees = new Set();


        formattedTrainees.forEach(
          (trainee) => {

            const uniqueKey =
              trainee.assignmentId ||
              trainee.traineeId;


            if (
              !seenTrainees.has(
                String(uniqueKey)
              )
            ) {
              seenTrainees.add(
                String(uniqueKey)
              );

              uniqueTrainees.push(
                trainee
              );
            }
          }
        );


        // ====================================================================
        // 14. DEBUG OUTPUT
        // ====================================================================

        console.log(
          "===================================================="
        );

        console.log(
          "Current assessor:",
          currentAssessorId
        );

        console.log(
          "Selected batch:",
          batchId
        );

        console.log(
          "Selected assessment:",
          assessmentId
        );

        console.log(
          "Verified assignments:",
          assessorAssignments.length
        );

        console.log(
          "Final formatted trainees:",
          JSON.stringify(
            uniqueTrainees,
            null,
            2
          )
        );

        console.log(
          "===================================================="
        );


        // ====================================================================
        // 15. SET UI DATA
        // ====================================================================

        if (isMounted) {
          setTrainees(
            uniqueTrainees
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
            error?.message ||
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
    batchCode,
  ]);


  // ==========================================================================
  // OPEN TRAINEE EVALUATION
  // ==========================================================================

  const handleViewAssessment = (
    trainee
  ) => {

    // ------------------------------------------------------------------------
    // Use the REAL IDs from the assignment.
    // ------------------------------------------------------------------------

    const realAssessmentId =
      trainee.assignment?.assessment_id ||
      trainee.assessmentId ||
      null;


    const realBatchId =
      trainee.assignment?.batch_id ||
      trainee.batchId ||
      null;


    const realAssignmentId =
      trainee.assignmentId ||
      trainee.assignment?.id ||
      null;


    const realSubmissionId =
      trainee.submissionId ||
      trainee.submission?.id ||
      null;


    const assessmentInfo = {

      id:
        realAssessmentId,


      batchId:
        realBatchId,


      assignmentId:
        realAssignmentId,


      courseCode:
        batchCode,


      courseName:
        trainee.assignment?.assessment_name ||
        courseLabel,
    };


    console.log(
      "Opening trainee evaluation:"
    );


    console.log(
      "Trainee:",
      trainee
    );


    console.log(
      "Assessment info:",
      assessmentInfo
    );


    // ------------------------------------------------------------------------
    // Context
    // ------------------------------------------------------------------------

    setSelectedAssessment(
      assessmentInfo
    );


    setSelectedTrainee(
      trainee
    );


    // ------------------------------------------------------------------------
    // Navigate to Evaluation Summary
    // ------------------------------------------------------------------------

    navigate(
      "/assessor/evaluation/summary",
      {
        state: {

          selectedCourse:


            selectedCourse,


          selectedTrainee:
            trainee,


          assessment:
            assessmentInfo,


          batchId:
            realBatchId,


          batchCode:
            batchCode,


          assessmentId:
            realAssessmentId,


          assignmentId:
            realAssignmentId,


          submissionId:
            realSubmissionId,
        },
      }
    );
  };


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (

    <div className="space-y-6">

      {/* ================================================================== */}
      {/* BREADCRUMBS */}
      {/* ================================================================== */}

      <AssessorBreadcrumbs
        items={[

          {
            label:
              courseLabel,

            to:
              "/assessor/evaluation",

            state: {
              selectedCourse,
            },
          },

          "Trainees for Evaluation",
        ]}
      />


      {/* ================================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================================== */}

      <AssessorPageHeader
        title="Trainees for Evaluation"
        subtitle={
          `Showing trainees assigned to you for ${courseLabel
          }.`
        }
      />


      {/* ================================================================== */}
      {/* ERROR */}
      {/* ================================================================== */}

      {errorMessage && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

          {errorMessage}

        </div>

      )}


      {/* ================================================================== */}
      {/* LOADING */}
      {/* ================================================================== */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center font-medium text-gray-500 shadow-sm">

          Fetching trainees assigned to you...

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