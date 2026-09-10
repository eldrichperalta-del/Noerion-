import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient.js";

import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";
import EvaluationFilters from "../../components/assessordashboard/evaluation/EvaluationFilters";
import EvaluationCourseGrid from "../../components/assessordashboard/evaluation/EvaluationCourseGrid";

/* ============================================================================
   HELPERS
============================================================================ */

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isEvaluationCompleted = (submission) => {
  if (!submission) {
    return false;
  }

  const status = normalizeText(submission.status);
  const overallResult = normalizeText(
    submission.overall_result
  );

  /*
   * A submission is considered completed only after
   * the assessor has finalized/evaluated it.
   */
  if (status === "evaluated") {
    return true;
  }

  if (
    status === "completed" &&
    [
      "competent",
      "not yet competent",
      "passed",
      "failed",
    ].includes(overallResult)
  ) {
    return true;
  }

  return false;
};

const getLatestSubmission = (submissions = []) => {
  if (!submissions.length) {
    return null;
  }

  return [...submissions].sort((a, b) => {
    const dateA = new Date(
      a?.updated_at ??
        a?.submitted_at ??
        a?.created_at ??
        0
    ).getTime();

    const dateB = new Date(
      b?.updated_at ??
        b?.submitted_at ??
        b?.created_at ??
        0
    ).getTime();

    return dateB - dateA;
  })[0];
};

/* ============================================================================
   COMPONENT
============================================================================ */

export default function Evaluation() {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCourseId, setSelectedCourseId] =
    useState("all");

  /*
   * IMPORTANT:
   * This contains ONLY courses assigned to the current assessor.
   */
  const [courses, setCourses] = useState([]);

  /*
   * Each course contains ONLY assessments assigned
   * to the current assessor.
   */
  const [evaluationCourses, setEvaluationCourses] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* ==========================================================================
     LOAD EVALUATION DATA
  ========================================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadEvaluationData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        /* ====================================================================
           1. GET CURRENT AUTHENTICATED ASSESSOR
        ==================================================================== */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.id) {
          throw new Error(
            "No authenticated assessor was found."
          );
        }

        const assessorId = user.id;

        /* ====================================================================
           2. GET ASSIGNMENTS FOR THIS ASSESSOR ONLY

           THIS IS THE SOURCE OF TRUTH FOR WHAT SHOULD APPEAR
           ON THE EVALUATION PAGE.

           We do this FIRST because we must NOT display:
             - courses with no assignments
             - assessments with no assignments
        ==================================================================== */

        const {
          data: assignmentData,
          error: assignmentError,
        } = await supabase
          .from("assignments")
          .select(
            `
              id,
              admin_id,
              assessor_id,
              trainee_id,
              assigned_at,
              assessment_name,
              status,
              assessment_date,
              assessment_id,
              start_time,
              end_time,
              duration,
              batch_id,
              batch_name,
              qualification,
              assessment_type,
              instructions,
              completed_at
            `
          )
          .eq("assessor_id", assessorId);

        if (assignmentError) {
          throw assignmentError;
        }

        const assessorAssignments =
          assignmentData ?? [];

        /* ====================================================================
           3. GET ONLY THE ASSESSMENT IDS THAT ARE ASSIGNED
        ==================================================================== */

        const assignedAssessmentIds = [
          ...new Set(
            assessorAssignments
              .map(
                (assignment) =>
                  assignment.assessment_id
              )
              .filter(Boolean)
          ),
        ];

        /*
         * If the assessor has no assignments, the Evaluation page
         * should contain no courses or assessments.
         */
        if (
          assignedAssessmentIds.length === 0
        ) {
          if (!isMounted) return;

          setCourses([]);
          setEvaluationCourses([]);
          setLoading(false);

          return;
        }

        /* ====================================================================
           4. GET ASSESSMENTS

           We only retrieve the assessment records that are referenced
           by this assessor's assignments.

           Therefore an unassigned assessment cannot appear.
        ==================================================================== */

        const {
          data: assessmentData,
          error: assessmentError,
        } = await supabase
          .from("assessments")
          .select(
            `
              id,
              course_id,
              title,
              set_type,
              total_items,
              time_limit_minutes,
              is_active,
              created_at,
              status
            `
          )
          .in(
            "id",
            assignedAssessmentIds
          )
          .order("created_at", {
            ascending: false,
          });

        if (assessmentError) {
          throw assessmentError;
        }

        const assignedAssessments =
          assessmentData ?? [];

        /* ====================================================================
           5. GET COURSE IDS FROM THE ASSIGNED ASSESSMENTS

           Example:

           Assignment
              ↓
           assessment_id
              ↓
           assessment.course_id
              ↓
           course

           This ensures the assessment goes under its
           proper course.
        ==================================================================== */

        const assignedCourseIds = [
          ...new Set(
            assignedAssessments
              .map(
                (assessment) =>
                  assessment.course_id
              )
              .filter(Boolean)
          ),
        ];

        if (
          assignedCourseIds.length === 0
        ) {
          if (!isMounted) return;

          setCourses([]);
          setEvaluationCourses([]);
          setLoading(false);

          return;
        }

        /* ====================================================================
           6. GET ONLY ASSIGNED COURSES

           IMPORTANT:

           We DO NOT fetch all courses anymore.

           Only courses referenced by the assessor's assigned assessments
           are retrieved.
        ==================================================================== */

        const {
          data: courseData,
          error: courseError,
        } = await supabase
          .from("courses")
          .select(
            `
              id,
              code,
              title,
              qualification_level,
              description,
              created_at
            `
          )
          .in(
            "id",
            assignedCourseIds
          )
          .order("title", {
            ascending: true,
          });

        if (courseError) {
          throw courseError;
        }

        const assignedCourses =
          courseData ?? [];

        /* ====================================================================
           7. GET SUBMISSIONS FOR THIS ASSESSOR ONLY

           Used only for calculating evaluation progress.
        ==================================================================== */

        const {
          data: submissionData,
          error: submissionError,
        } = await supabase
          .from("assessment_submissions")
          .select(
            `
              id,
              assessment_id,
              trainee_id,
              assessor_id,
              started_at,
              submitted_at,
              status,
              total_score,
              passed,
              created_at,
              updated_at,
              assignment_id,
              overall_result,
              remarks,
              justification,
              override_score,
              override_result,
              override_applied
            `
          )
          .eq("assessor_id", assessorId);

        if (submissionError) {
          throw submissionError;
        }

        const assessorSubmissions =
          submissionData ?? [];

        /* ====================================================================
           8. CREATE COURSE MAP
        ==================================================================== */

        const courseMap = new Map();

        assignedCourses.forEach((course) => {
          courseMap.set(
            course.id,
            course
          );
        });

        /* ====================================================================
           9. CREATE SUBMISSION LOOKUPS

           Primary lookup:
             assignment_id

           Fallback:
             assessment_id + trainee_id
        ==================================================================== */

        const submissionsByAssignment =
          new Map();

        const submissionsByAssessmentTrainee =
          new Map();

        assessorSubmissions.forEach(
          (submission) => {
            /* --------------------------------------------------------------
               ASSIGNMENT ID LOOKUP
            -------------------------------------------------------------- */

            if (
              submission.assignment_id
            ) {
              const existing =
                submissionsByAssignment.get(
                  submission.assignment_id
                );

              const currentDate =
                new Date(
                  submission.updated_at ??
                    submission.submitted_at ??
                    submission.created_at ??
                    0
                ).getTime();

              const existingDate =
                existing
                  ? new Date(
                      existing.updated_at ??
                        existing.submitted_at ??
                        existing.created_at ??
                        0
                    ).getTime()
                  : 0;

              if (
                !existing ||
                currentDate >= existingDate
              ) {
                submissionsByAssignment.set(
                  submission.assignment_id,
                  submission
                );
              }
            }

            /* --------------------------------------------------------------
               ASSESSMENT + TRAINEE LOOKUP
            -------------------------------------------------------------- */

            if (
              submission.assessment_id &&
              submission.trainee_id
            ) {
              const key = `${submission.assessment_id}:${submission.trainee_id}`;

              const existing =
                submissionsByAssessmentTrainee.get(
                  key
                );

              const currentDate =
                new Date(
                  submission.updated_at ??
                    submission.submitted_at ??
                    submission.created_at ??
                    0
                ).getTime();

              const existingDate =
                existing
                  ? new Date(
                      existing.updated_at ??
                        existing.submitted_at ??
                        existing.created_at ??
                        0
                    ).getTime()
                  : 0;

              if (
                !existing ||
                currentDate >= existingDate
              ) {
                submissionsByAssessmentTrainee.set(
                  key,
                  submission
                );
              }
            }
          }
        );

        /* ====================================================================
           10. BUILD COURSE SECTIONS

           VERY IMPORTANT:

           We iterate over assignedCourses.

           We do NOT iterate over every course in the database.

           Each course receives only assessments that:
             1. belong to that course
             2. are assigned to this assessor
        ==================================================================== */

        const courseSections =
          assignedCourses
            .map((course) => {
              /*
               * Assessments already came from assignedAssessmentIds,
               * so these are automatically restricted to this assessor.
               */
              const courseAssessments =
                assignedAssessments.filter(
                  (assessment) =>
                    assessment.course_id ===
                    course.id
                );

              /* ==============================================================
                 BUILD ASSESSMENTS
              ============================================================== */

              const assessments =
                courseAssessments
                  .map((assessment) => {
                    /*
                     * Get ONLY this assessor's assignments
                     * for this assessment.
                     */
                    const assessmentAssignments =
                      assessorAssignments.filter(
                        (assignment) =>
                          assignment.assessment_id ===
                          assessment.id
                      );

                    /* --------------------------------------------------------
                       UNIQUE TRAINEES

                       If the same trainee has duplicate assignment rows,
                       count that trainee only once.
                    -------------------------------------------------------- */

                    const traineeMap =
                      new Map();

                    assessmentAssignments.forEach(
                      (assignment) => {
                        if (
                          !assignment.trainee_id
                        ) {
                          return;
                        }

                        if (
                          !traineeMap.has(
                            assignment.trainee_id
                          )
                        ) {
                          traineeMap.set(
                            assignment.trainee_id,
                            assignment
                          );
                        }
                      }
                    );

                    const uniqueAssignments =
                      [
                        ...traineeMap.values(),
                      ];

                    const totalTrainees =
                      uniqueAssignments.length;

                    /* --------------------------------------------------------
                       TRAINEE EVALUATIONS
                    -------------------------------------------------------- */

                    const traineeEvaluations =
                      uniqueAssignments.map(
                        (assignment) => {
                          const submissions = [];

                          /*
                           * First try assignment_id.
                           */
                          if (
                            assignment.id
                          ) {
                            const submission =
                              submissionsByAssignment.get(
                                assignment.id
                              );

                            if (
                              submission
                            ) {
                              submissions.push(
                                submission
                              );
                            }
                          }

                          /*
                           * Then fallback to assessment + trainee.
                           */
                          const fallbackSubmission =
                            submissionsByAssessmentTrainee.get(
                              `${assessment.id}:${assignment.trainee_id}`
                            );

                          if (
                            fallbackSubmission &&
                            !submissions.some(
                              (submission) =>
                                submission.id ===
                                fallbackSubmission.id
                            )
                          ) {
                            submissions.push(
                              fallbackSubmission
                            );
                          }

                          const latestSubmission =
                            getLatestSubmission(
                              submissions
                            );

                          return {
                            assignment,
                            submission:
                              latestSubmission,
                          };
                        }
                      );

                    /* --------------------------------------------------------
                       COMPLETED EVALUATIONS
                    -------------------------------------------------------- */

                    const completedEvaluations =
                      traineeEvaluations.filter(
                        ({
                          submission,
                        }) =>
                          isEvaluationCompleted(
                            submission
                          )
                      ).length;

                    /* --------------------------------------------------------
                       PROGRESS
                    -------------------------------------------------------- */

                    const progressPercentage =
                      totalTrainees > 0
                        ? Math.round(
                            (completedEvaluations /
                              totalTrainees) *
                              100
                          )
                        : 0;

                    /* --------------------------------------------------------
                       BATCHES
                    -------------------------------------------------------- */

                    const batchMap =
                      new Map();

                    assessmentAssignments.forEach(
                      (assignment) => {
                        const batchKey =
                          assignment.batch_id ??
                          `assignment-${assignment.id}`;

                        if (
                          !batchMap.has(
                            batchKey
                          )
                        ) {
                          batchMap.set(
                            batchKey,
                            {
                              id:
                                assignment.batch_id ??
                                null,

                              name:
                                assignment.batch_name ??
                                assignment.qualification ??
                                "Assigned Batch",

                              assignments: [],
                            }
                          );
                        }

                        batchMap
                          .get(batchKey)
                          .assignments.push(
                            assignment
                          );
                      }
                    );

                    const batches = [
                      ...batchMap.values(),
                    ];

                    return {
                      id: assessment.id,

                      assessmentId:
                        assessment.id,

                      courseId:
                        assessment.course_id,

                      /*
                       * IMPORTANT:
                       * Use the actual assessment.title.
                       *
                       * Example:
                       *
                       * Automotive Servicing NC II - Set B
                       *
                       * NOT:
                       *
                       * Set B
                       */
                      title:
                        assessment.title ??
                        "Untitled Assessment",

                      setType:
                        assessment.set_type ??
                        "",

                      status:
                        assessment.status ??
                        "",

                      isActive:
                        assessment.is_active ??
                        false,

                      totalItems:
                        Number(
                          assessment.total_items
                        ) || 0,

                      timeLimitMinutes:
                        Number(
                          assessment.time_limit_minutes
                        ) || 0,

                      createdAt:
                        assessment.created_at,

                      assignments:
                        uniqueAssignments,

                      traineeEvaluations,

                      batches,

                      /*
                       * Used by TraineesForEvaluation navigation.
                       */
                      batchId:
                        batches[0]?.id ??
                        null,

                      batchName:
                        batches[0]?.name ??
                        "",

                      totalTrainees,

                      completedEvaluations,

                      progressPercentage,
                    };
                  })
                  .sort((a, b) => {
                    const dateA =
                      new Date(
                        a.createdAt ?? 0
                      ).getTime();

                    const dateB =
                      new Date(
                        b.createdAt ?? 0
                      ).getTime();

                    return dateB - dateA;
                  });

              /*
               * IMPORTANT:
               *
               * Only return the course if it actually has
               * an assessment assigned to this assessor.
               *
               * This protects the page even if course/assessment
               * data somehow becomes inconsistent.
               */
              if (
                assessments.length === 0
              ) {
                return null;
              }

              return {
                id: course.id,

                code:
                  course.code ?? "",

                title:
                  course.title ??
                  "Unknown Course",

                qualificationName:
                  course.title ??
                  "Unknown Course",

                qualificationLevel:
                  course.qualification_level ??
                  "",

                qualification_level:
                  course.qualification_level ??
                  "",

                description:
                  course.description ??
                  "",

                createdAt:
                  course.created_at,

                assessments,
              };
            })
            .filter(Boolean);

        /* ====================================================================
           11. UPDATE STATE
        ==================================================================== */

        if (!isMounted) {
          return;
        }

        /*
         * courses is ALSO restricted to assigned courses.
         *
         * Therefore the Course Filter dropdown will NOT show
         * unrelated courses.
         */
        const finalCourses =
          courseSections.map(
            (course) => ({
              id: course.id,
              code: course.code,
              title: course.title,
              qualificationName:
                course.qualificationName,
              qualificationLevel:
                course.qualificationLevel,
              qualification_level:
                course.qualificationLevel,
              description:
                course.description,
              createdAt:
                course.createdAt,
            })
          );

        setCourses(finalCourses);
        setEvaluationCourses(
          courseSections
        );

        /*
         * If the previously selected course is no longer
         * available, reset the dropdown.
         */
        if (
          selectedCourseId !== "all" &&
          !courseSections.some(
            (course) =>
              course.id ===
              selectedCourseId
          )
        ) {
          setSelectedCourseId("all");
        }
      } catch (error) {
        console.error(
          "Error loading Evaluation data:",
          error
        );

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.message ??
            "Unable to load evaluation data."
        );

        setCourses([]);
        setEvaluationCourses([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvaluationData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ==========================================================================
     FILTERED COURSES
  ========================================================================== */

  const filteredCourses = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    let result =
      evaluationCourses;

    /* ------------------------------------------------------------------------
       COURSE FILTER
    ------------------------------------------------------------------------ */

    if (
      selectedCourseId !== "all"
    ) {
      result = result.filter(
        (course) =>
          course.id ===
          selectedCourseId
      );
    }

    /* ------------------------------------------------------------------------
       SEARCH
    ------------------------------------------------------------------------ */

    if (!search) {
      return result;
    }

    return result.filter(
      (course) => {
        const courseMatches =
          [
            course.title,
            course.code,
            course.qualificationLevel,
            course.qualificationName,
          ].some((value) =>
            normalizeText(
              value
            ).includes(search)
          );

        const assessmentMatches =
          course.assessments?.some(
            (assessment) =>
              normalizeText(
                assessment.title
              ).includes(search)
          );

        return (
          courseMatches ||
          assessmentMatches
        );
      }
    );
  }, [
    evaluationCourses,
    searchTerm,
    selectedCourseId,
  ]);

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assigned Courses & Qualifications"
        subtitle="Evaluate trainee performance across your assigned courses."
      />

      {/* ======================================================================
          SEARCH + COURSE FILTER
      ====================================================================== */}

      <EvaluationFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        courses={courses}
        selectedCourseId={
          selectedCourseId
        }
        setSelectedCourseId={
          setSelectedCourseId
        }
        loading={loading}
      />

      {/* ======================================================================
          ERROR
      ====================================================================== */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {/* ======================================================================
          COURSE SECTIONS

          Every section represents an ASSIGNED COURSE.

          Inside each section are only the ASSESSMENTS assigned
          to the current assessor.
      ====================================================================== */}

      <EvaluationCourseGrid
        courses={filteredCourses}
        loading={loading}
        searchTerm={searchTerm}
      />
    </div>
  );
}

