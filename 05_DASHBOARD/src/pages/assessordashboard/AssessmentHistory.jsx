import { useEffect, useMemo, useState } from "react";

import { supabase } from "../../supabaseClient.js";

import AssessmentHistoryFilters from "../../components/assessordashboard/assessment-history/AssessmentHistoryFilters";
import AssessmentHistoryTable from "../../components/assessordashboard/assessment-history/AssessmentHistoryTable";
import HistorySummaryCards from "../../components/assessordashboard/assessment-history/HistorySummaryCards";
import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";

export default function AssessmentHistory() {
  const [history, setHistory] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    course: "all",
    date: "",
    result: "All Results",
  });

  /* ==========================================================================
     LOAD COURSES
     ========================================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      setCoursesLoading(true);

      const { data, error: coursesError } = await supabase
        .from("courses")
        .select(
          `
            id,
            code,
            title,
            qualification_level
          `
        )
        .order("title", { ascending: true });

      if (coursesError) {
        console.error(
          "Assessment History - Error loading courses:",
          coursesError
        );

        if (mounted) {
          setCourses([]);
          setCoursesLoading(false);
        }

        return;
      }

      const formattedCourses = (data || []).map((course) => ({
        id: course.id,
        code: course.code,
        title: course.title,
        qualificationLevel: course.qualification_level,
        label: [course.title, course.qualification_level]
          .filter(Boolean)
          .join(" "),
      }));

      if (mounted) {
        setCourses(formattedCourses);
        setCoursesLoading(false);
      }
    }

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================================
     LOAD ASSESSMENT HISTORY
     ========================================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadAssessmentHistory() {
      setLoading(true);
      setError("");

      try {
        /* ----------------------------------------------------------------------
           GET CURRENT AUTHENTICATED ASSESSOR
           ---------------------------------------------------------------------- */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            "No authenticated assessor was found."
          );
        }

        console.log(
          "Assessment History - Current Assessor:",
          user.id
        );

        /* ----------------------------------------------------------------------
           GET ASSESSMENT SUBMISSIONS
           ----------------------------------------------------------------------

           We include both:

           submitted
           evaluated

           because your current database contains submitted records.
        ---------------------------------------------------------------------- */

        const {
          data: submissions,
          error: submissionsError,
        } = await supabase
          .from("assessment_submissions")
          .select(
            `
              id,
              assessment_id,
              trainee_id,
              assessor_id,
              submitted_at,
              created_at,
              updated_at,
              status,
              total_score,
              passed,
              overall_result,
              remarks,
              justification,
              override_score,
              override_result,
              override_applied
            `
          )
          .eq("assessor_id", user.id)
          .in("status", ["submitted", "evaluated"])
          .order("submitted_at", {
            ascending: false,
          });

        if (submissionsError) {
          throw submissionsError;
        }

        console.log(
          "Assessment History - Submissions:",
          submissions
        );

        if (!submissions || submissions.length === 0) {
          if (mounted) {
            setHistory([]);
          }

          return;
        }

        /* ----------------------------------------------------------------------
           GET ASSESSMENT IDS
           ---------------------------------------------------------------------- */

        const assessmentIds = [
          ...new Set(
            submissions
              .map((submission) => submission.assessment_id)
              .filter(Boolean)
          ),
        ];

        /* ----------------------------------------------------------------------
           GET ASSESSMENTS
           ---------------------------------------------------------------------- */

        let assessments = [];

        if (assessmentIds.length > 0) {
          const {
            data,
            error: assessmentsError,
          } = await supabase
            .from("assessments")
            .select(
              `
                id,
                course_id,
                title,
                set_type,
                total_items,
                status
              `
            )
            .in("id", assessmentIds);

          if (assessmentsError) {
            throw assessmentsError;
          }

          assessments = data || [];
        }

        const assessmentMap = new Map(
          assessments.map((assessment) => [
            assessment.id,
            assessment,
          ])
        );

        /* ----------------------------------------------------------------------
           GET COURSE IDS FROM ASSESSMENTS
           ---------------------------------------------------------------------- */

        const courseIds = [
          ...new Set(
            assessments
              .map((assessment) => assessment.course_id)
              .filter(Boolean)
          ),
        ];

        /* ----------------------------------------------------------------------
           GET COURSES
           ---------------------------------------------------------------------- */

        let historyCourses = [];

        if (courseIds.length > 0) {
          const {
            data,
            error: historyCoursesError,
          } = await supabase
            .from("courses")
            .select(
              `
                id,
                code,
                title,
                qualification_level
              `
            )
            .in("id", courseIds);

          if (historyCoursesError) {
            throw historyCoursesError;
          }

          historyCourses = data || [];
        }

        const courseMap = new Map(
          historyCourses.map((course) => [
            course.id,
            course,
          ])
        );

        /* ----------------------------------------------------------------------
           GET TRAINEE IDS
           ---------------------------------------------------------------------- */

        const traineeIds = [
          ...new Set(
            submissions
              .map((submission) => submission.trainee_id)
              .filter(Boolean)
          ),
        ];

        /* ----------------------------------------------------------------------
           GET TRAINEE PROFILES
           ---------------------------------------------------------------------- */

        let traineeProfiles = [];

        if (traineeIds.length > 0) {
          const {
            data,
            error: traineeProfilesError,
          } = await supabase
            .from("trainee_profiles")
            .select(
              `
                user_id,
                training_center,
                nc_level,
                qualification_course,
                batch,
                center_id
              `
            )
            .in("user_id", traineeIds);

          if (traineeProfilesError) {
            console.warn(
              "Assessment History - Trainee profiles could not be loaded:",
              traineeProfilesError
            );
          } else {
            traineeProfiles = data || [];
          }
        }

        const traineeProfileMap = new Map(
          traineeProfiles.map((profile) => [
            profile.user_id,
            profile,
          ])
        );

        /* ----------------------------------------------------------------------
           GET PROFILE INFORMATION
           ---------------------------------------------------------------------- */

        let profiles = [];

        if (traineeIds.length > 0) {
          const {
            data,
            error: profilesError,
          } = await supabase
            .from("profiles")
            .select("*")
            .in("id", traineeIds);

          if (profilesError) {
            console.warn(
              "Assessment History - Profiles could not be loaded:",
              profilesError
            );
          } else {
            profiles = data || [];
          }
        }

        const profileMap = new Map(
          profiles.map((profile) => [
            profile.id,
            profile,
          ])
        );

        /* ----------------------------------------------------------------------
           BUILD NORMALIZED HISTORY RECORDS
           ---------------------------------------------------------------------- */

        const formattedHistory = submissions.map(
          (submission) => {
            const assessment = assessmentMap.get(
              submission.assessment_id
            );

            const course = assessment?.course_id
              ? courseMap.get(assessment.course_id)
              : null;

            const traineeProfile =
              traineeProfileMap.get(
                submission.trainee_id
              );

            const profile = profileMap.get(
              submission.trainee_id
            );

            /* ------------------------------------------------------------------
               TRAINEE NAME
               ------------------------------------------------------------------ */

            const firstName =
              profile?.first_name ||
              profile?.firstname ||
              profile?.given_name ||
              "";

            const lastName =
              profile?.last_name ||
              profile?.lastname ||
              profile?.family_name ||
              "";

            const combinedName =
              `${firstName} ${lastName}`.trim();

            const traineeName =
              profile?.full_name ||
              profile?.fullname ||
              combinedName ||
              profile?.name ||
              submission.trainee_id ||
              "Unknown Trainee";

            /* ------------------------------------------------------------------
               SCORE
               ------------------------------------------------------------------ */

            const totalItems =
              Number(assessment?.total_items) || 0;

            const rawScore =
              Number(submission.total_score) || 0;

            const writtenScore =
              totalItems > 0
                ? Math.round(
                  (rawScore / totalItems) * 100
                )
                : 0;

            /* ------------------------------------------------------------------
               FINAL RESULT
               ------------------------------------------------------------------ */

            let finalResult = "In Evaluation";

            const overrideApplied =
              submission.override_applied === true;

            if (
              overrideApplied &&
              submission.override_result
            ) {
              finalResult =
                submission.override_result;
            } else if (
              submission.overall_result &&
              normalizeResult(
                submission.overall_result
              ) !== "in evaluation"
            ) {
              finalResult =
                submission.overall_result;
            } else if (
              submission.passed === true
            ) {
              finalResult = "Competent";
            } else if (
              submission.passed === false &&
              submission.status === "evaluated"
            ) {
              finalResult =
                "Not Yet Competent";
            }

            /* ------------------------------------------------------------------
               COURSE

               IMPORTANT:
               courseId is kept separately from course label.

               The dropdown filters using courseId.
               ------------------------------------------------------------------ */

            const courseLabel = course
              ? [
                course.title,
                course.qualification_level,
              ]
                .filter(Boolean)
                .join(" ")
              : traineeProfile?.qualification_course ||
              "Unknown Course";

            /* ------------------------------------------------------------------
               COMPLETED DATE
               ------------------------------------------------------------------ */

            const completedAt =
              submission.submitted_at ||
              submission.updated_at ||
              submission.created_at;

            const completedDate = completedAt
              ? formatDisplayDate(completedAt)
              : "-";

            return {
              id: submission.id,

              traineeName,

              traineeId:
                submission.trainee_id,

              /* Display value */
              course: courseLabel,

              /* IMPORTANT: actual courses.id */
              courseId:
                assessment?.course_id || null,

              assessmentId:
                submission.assessment_id,

              submissionId:
                submission.id,

              writtenScore,

              rawScore,

              totalItems,

              finalResult,

              completedDate,

              status:
                submission.status,


              passed:
                submission.passed,

              overallResult:
                submission.overall_result,

              overrideApplied:
                submission.override_applied,

              overrideResult:
                submission.override_result,

              remarks:
                submission.remarks,

              justification:
                submission.justification,
            };
          }
        );

        console.log(
          "Assessment History - Final Records:",
          formattedHistory
        );

        if (mounted) {
          setHistory(formattedHistory);
        }
      } catch (loadError) {
        console.error(
          "Assessment History - Error:",
          loadError
        );

        if (mounted) {
          setError(
            loadError?.message ||
            "Unable to load assessment history."
          );

          setHistory([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAssessmentHistory();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================================
     FILTER HISTORY
     ========================================================================== */

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const searchValue = String(
        filters.search || ""
      )
        .trim()
        .toLowerCase();

      /* ------------------------------------------------------------------------
         SEARCH
         ------------------------------------------------------------------------ */

      const matchesSearch =
        !searchValue ||
        String(record.traineeName || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(record.traineeId || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(record.course || "")
          .toLowerCase()
          .includes(searchValue);

      /* ------------------------------------------------------------------------
         COURSE

         THIS IS THE IMPORTANT FIX.

         filters.course contains courses.id.

         record.courseId also contains courses.id.

         Therefore they can be compared directly.
         ------------------------------------------------------------------------ */

      const matchesCourse =
        filters.course === "all" ||
        filters.course === "All Courses" ||
        record.courseId === filters.course;

      /* ------------------------------------------------------------------------
         RESULT
         ------------------------------------------------------------------------ */

      const matchesResult =
        filters.result === "All Results" ||
        normalizeResult(record.finalResult) ===
        normalizeResult(filters.result);

      /* ------------------------------------------------------------------------
         DATE
         ------------------------------------------------------------------------ */

      const matchesDate =
        !filters.date ||
        record.completedDate ===
        formatFilterDate(filters.date);

      return (
        matchesSearch &&
        matchesCourse &&
        matchesResult &&
        matchesDate
      );
    });
  }, [history, filters]);

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assessment History"
        subtitle="Review your complete record of past assessments and validated certifications."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <HistorySummaryCards
        history={filteredHistory}
      />

      <AssessmentHistoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        courses={courses}
        coursesLoading={coursesLoading}
      />

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-sm font-medium text-gray-500 shadow-sm">
          Loading assessment history...
        </div>
      ) : (
        <AssessmentHistoryTable
          history={filteredHistory}
        />
      )}
    </div>
  );
}

/* ============================================================================
   HELPERS
   ============================================================================ */

function normalizeResult(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatDisplayDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatFilterDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}