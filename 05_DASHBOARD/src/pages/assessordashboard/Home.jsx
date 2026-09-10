import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";
import AssignedAssessmentsTable from "../../components/assessordashboard/home/AssignedAssessmentsTable";
import AssessorNotifications from "../../components/assessordashboard/home/AssessorNotifications";
import AssessorOverviewCards from "../../components/assessordashboard/home/AssessorOverviewCards";
import UpcomingSchedule from "../../components/assessordashboard/home/UpcomingSchedule";

import { supabase } from "../../supabaseClient";


/* ============================================================================
   HELPERS
   ============================================================================ */

function getDateTime(date, time) {
  if (!date) return null;

  const datePart = String(date).split("T")[0];
  const timePart = time || "00:00:00";

  const result = new Date(`${datePart}T${timePart}`);

  return Number.isNaN(result.getTime()) ? null : result;
}


function formatDate(date) {
  if (!date) return "No date";

  const datePart = String(date).split("T")[0];
  const result = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(result.getTime())) {
    return "No date";
  }

  return result.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = String(time)
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return String(time);
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}


function formatSchedule(date, startTime, endTime) {
  const formattedDate = formatDate(date);

  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (start && end) {
    return `${formattedDate} - ${start} to ${end}`;
  }

  if (start) {
    return `${formattedDate} - ${start}`;
  }

  return formattedDate;
}


function getStatus(assignment) {
  const databaseStatus = String(
    assignment.status || ""
  )
    .trim()
    .toLowerCase();

  /*
   * The assignment table already has a status.
   * Respect explicit completed status first.
   */
  if (
    databaseStatus === "completed" ||
    assignment.completed_at
  ) {
    return "Completed";
  }

  const start = getDateTime(
    assignment.assessment_date,
    assignment.start_time
  );

  const end = getDateTime(
    assignment.assessment_date,
    assignment.end_time
  );

  const now = new Date();

  if (start && end) {
    if (now >= start && now <= end) {
      return "Ongoing";
    }

    if (now < start) {
      return "Pending";
    }

    /*
     * If the scheduled time has ended but the database has not yet
     * marked it completed, keep it as Pending rather than falsely
     * marking the evaluation as completed.
     */
    return "Pending";
  }

  if (start) {
    return now >= start ? "Ongoing" : "Pending";
  }

  return "Pending";
}


/* ============================================================================
   HOME
   ============================================================================ */

export default function Home() {
  const navigate = useNavigate();

  const [assessorName, setAssessorName] =
    useState("Assessor");

  const [dashboardStats, setDashboardStats] =
    useState({
      assignedAssessments: 0,
      ongoingAssessments: 0,
      completedEvaluations: 0,
    });

  const [assignedAssessments, setAssignedAssessments] =
    useState([]);

  const [upcomingSchedules, setUpcomingSchedules] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");


  /* ==========================================================================
     LOAD DASHBOARD DATA
     ========================================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage("");


        /* ====================================================================
           1. GET CURRENT AUTHENTICATED USER
        ==================================================================== */

        const {
          data: {
            user,
          },
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


        /* ====================================================================
           2. GET ASSESSOR NAME
        ==================================================================== */

        const {
          data: assessorProfile,
          error: assessorProfileError,
        } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (assessorProfileError) {
          throw assessorProfileError;
        }

        if (assessorProfile) {
          const name = [
            assessorProfile.first_name,
            assessorProfile.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          if (name && mounted) {
            setAssessorName(name);
          }
        }


        /* ====================================================================
           3. GET THIS ASSESSOR'S ASSIGNMENTS
        ==================================================================== */

        const {
          data: assignments,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(`
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
          `)
          .eq("assessor_id", user.id)
          .order("assessment_date", {
            ascending: true,
          });

        if (assignmentsError) {
          throw assignmentsError;
        }

        const assignmentRows = assignments || [];


        /* ====================================================================
           4. GET TRAINEE NAMES

           assignments.trainee_id corresponds to the trainee's user/profile ID.
        ==================================================================== */

        const traineeIds = [
          ...new Set(
            assignmentRows
              .map((assignment) => assignment.trainee_id)
              .filter(Boolean)
          ),
        ];

        let traineeProfiles = [];

        if (traineeIds.length > 0) {
          const {
            data,
            error: traineeError,
          } = await supabase
            .from("profiles")
            .select(
              "id, first_name, last_name, email"
            )
            .in("id", traineeIds);

          if (traineeError) {
            throw traineeError;
          }

          traineeProfiles = data || [];
        }


        /* ====================================================================
           5. CREATE TRAINEE LOOKUP
        ==================================================================== */

        const traineeMap = new Map();

        traineeProfiles.forEach((trainee) => {
          traineeMap.set(
            String(trainee.id),
            trainee
          );
        });


        /* ====================================================================
           6. FORMAT ASSIGNMENTS FOR THE EXISTING TABLE
        ==================================================================== */

        const formattedAssignments =
          assignmentRows.map((assignment) => {
            const trainee = traineeMap.get(
              String(assignment.trainee_id)
            );

            const traineeName = [
              trainee?.first_name,
              trainee?.last_name,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            const status = getStatus(
              assignment
            );

            return {
              id: assignment.id,

              traineeName:
                traineeName ||
                trainee?.email ||
                "Unknown Trainee",

              course:
                assignment.qualification ||
                assignment.assessment_name ||
                "Assessment",

              schedule:
                formatSchedule(
                  assignment.assessment_date,
                  assignment.start_time,
                  assignment.end_time
                ),

              status,

              /*
               * Evaluation is available while the assessment is ongoing.
               */
              canEvaluate:
                status === "Ongoing",

              /*
               * Keep database IDs available for navigation.
               */
              assignment_id:
                assignment.id,

              assessment_id:
                assignment.assessment_id,

              trainee_id:
                assignment.trainee_id,

              raw:
                assignment,
            };
          });


        /* ====================================================================
           7. CALCULATE OVERVIEW COUNTS
        ==================================================================== */

        const assignedCount =
          assignmentRows.length;

        const ongoingCount =
          formattedAssignments.filter(
            (assignment) =>
              assignment.status === "Ongoing"
          ).length;

        const completedCount =
          assignmentRows.filter((assignment) => {
            const status = String(
              assignment.status || ""
            )
              .trim()
              .toLowerCase();

            return (
              status === "completed" ||
              Boolean(assignment.completed_at)
            );
          }).length;


        /* ====================================================================
           8. UPCOMING SCHEDULE
        ==================================================================== */

        const now = new Date();

        const upcomingAssignments =
          assignmentRows
            .filter((assignment) => {
              /*
               * Don't show completed assignments.
               */
              const status = String(
                assignment.status || ""
              )
                .trim()
                .toLowerCase();

              if (
                status === "completed" ||
                assignment.completed_at
              ) {
                return false;
              }

              const start = getDateTime(
                assignment.assessment_date,
                assignment.start_time
              );

              if (!start) {
                return false;
              }

              return start > now;
            })
            .sort((a, b) => {
              const aStart = getDateTime(
                a.assessment_date,
                a.start_time
              );

              const bStart = getDateTime(
                b.assessment_date,
                b.start_time
              );

              return (
                aStart.getTime() -
                bStart.getTime()
              );
            })
            .slice(0, 5);


        const formattedSchedules =
          upcomingAssignments.map(
            (assignment) => {
              const trainee =
                traineeMap.get(
                  String(
                    assignment.trainee_id
                  )
                );

              const traineeName = [
                trainee?.first_name,
                trainee?.last_name,
              ]
                .filter(Boolean)
                .join(" ")
                .trim();

              const datePart =
                String(
                  assignment.assessment_date || ""
                ).split("T")[0];

              const dateObject =
                new Date(
                  `${datePart}T00:00:00`
                );

              return {
                id: assignment.id,

                month:
                  dateObject.toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                    }
                  ),

                day:
                  dateObject.toLocaleDateString(
                    "en-US",
                    {
                      day: "numeric",
                    }
                  ),

                traineeName:
                  traineeName ||
                  trainee?.email ||
                  "Unknown Trainee",

                assessmentType:
                  assignment.assessment_type ||
                  assignment.assessment_name ||
                  "Assessment",

                time:
                  formatTime(
                    assignment.start_time
                  ),
              };
            }
          );


        /* ====================================================================
           9. UPDATE PAGE STATE
        ==================================================================== */

        if (mounted) {
          setDashboardStats({
            assignedAssessments:
              assignedCount,

            ongoingAssessments:
              ongoingCount,

            completedEvaluations:
              completedCount,
          });

          setAssignedAssessments(
            formattedAssignments
          );

          setUpcomingSchedules(
            formattedSchedules
          );
        }

      } catch (error) {
        console.error(
          "Assessor Home dashboard error:",
          error
        );

        if (mounted) {
          setErrorMessage(
            error?.message ||
              "Unable to load assessor dashboard data."
          );

          setDashboardStats({
            assignedAssessments: 0,
            ongoingAssessments: 0,
            completedEvaluations: 0,
          });

          setAssignedAssessments([]);
          setUpcomingSchedules([]);
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);


  /* ==========================================================================
     NAVIGATION
     ========================================================================== */

  const handleViewDetails = (assessment) => {
    navigate(
      "/assessor/assessment-panel",
      {
        state: {
          assignmentId:
            assessment.assignment_id,

          assessmentId:
            assessment.assessment_id,

          traineeId:
            assessment.trainee_id,
        },
      }
    );
  };


  const handleEvaluate = (assessment) => {
    navigate(
      "/assessor/evaluation",
      {
        state: {
          assignmentId:
            assessment.assignment_id,

          assessmentId:
            assessment.assessment_id,

          traineeId:
            assessment.trainee_id,
        },
      }
    );
  };


  /* ==========================================================================
     LOADING STATE
     ========================================================================== */

  if (loading) {
    return (
      <div className="space-y-6">

        <AssessorPageHeader
          title={`Welcome, ${assessorName}`}
          subtitle="Manage and evaluate assigned assessment."
        />

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Loading assessor dashboard...
        </div>

      </div>
    );
  }


  /* ==========================================================================
     PAGE
     ========================================================================== */

  return (
    <div className="space-y-6">

      <AssessorPageHeader
        title={`Welcome, ${assessorName}`}
        subtitle="Manage and evaluate assigned assessment."
      />


      {/* ================================================================
          OVERVIEW CARDS
      ================================================================ */}

      <AssessorOverviewCards
        stats={dashboardStats}
      />


      {/* ================================================================
          ERROR
      ================================================================ */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}


      {/* ================================================================
          MAIN DASHBOARD CONTENT
      ================================================================ */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        <AssignedAssessmentsTable
          assessments={
            assignedAssessments
          }
          onViewDetails={
            handleViewDetails
          }
          onEvaluate={
            handleEvaluate
          }
        />


        <div className="space-y-6">

          <UpcomingSchedule
            schedules={
              upcomingSchedules
            }
          />


          {/*
           * Notifications remain empty for now because there is no
           * notifications table in the database schema you provided.
           */}
          <AssessorNotifications
            notifications={[]}
          />

        </div>

      </div>

    </div>
  );
}

