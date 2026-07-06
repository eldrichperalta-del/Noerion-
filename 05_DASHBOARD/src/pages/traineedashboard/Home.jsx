/*
=================================================

TRAINEE DASHBOARD

BACKEND REQUIREMENTS

Tables Needed:

1. trainees
   - id
   - user_id
   - full_name

2. dashboard_stats
   - trainee_id
   - total_assessments
   - pending_assessments
   - latest_result
   - certificates
   - progress

3. assessments
   - id
   - trainee_id
   - assessment_name
   - assessment_type
   - schedule
   - status
   - assessment_date

Frontend Status:
✓ UI Complete
✓ Responsive
✓ Navigation Working
✓ Mock Data Added
✓ Ready For Supabase Integration

=================================================
*/


import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// BACKEND:
// Uncomment when connecting Supabase
// import { supabase } from "../../supabaseClient";

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Award,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  // =====================================================
  // BACKEND NOTE:
  // These states currently contain MOCK DATA.
  // Replace with Supabase/API data later.
  // =====================================================

  const [traineeName, setTraineeName] = useState("Ash");

  const [stats, setStats] = useState({
    totalAssessments: 26,
    pendingAssessments: 3,
    latestResult: "Earned",
    certificates: 5,
    progress: 85,
  });

  const [upcomingAssessments, setUpcomingAssessments] = useState([
    {
      id: 1,
      name: "Assessment 1",
      type: "Documentation & Filing",
      schedule: "Wed, Apr 2 - 1:30 PM",
      status: "Scheduled",
    },
    {
      id: 2,
      name: "Assessment 2",
      type: "Computer Systems Servicing",
      schedule: "Wed, Apr 2 - 10:00 AM",
      status: "Pending",
    },
    {
      id: 3,
      name: "Assessment 3",
      type: "Electrical Installation",
      schedule: "Nov 1 - 1:30 PM",
      status: "Pending",
    },
    {
      id: 4,
      name: "Assessment 4",
      type: "Cookery NC II",
      schedule: "Nov 1 - 3:30 PM",
      status: "Pending",
    },
  ]);

  const [animatedProgress, setAnimatedProgress] = useState(0);

  // =====================================================
  // Progress Animation
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(stats.progress);
    }, 300);

    return () => clearTimeout(timer);
  }, [stats.progress]);

  // =====================================================
  // BACKEND SECTION
  // Uncomment this entire block when Supabase is ready
  // =====================================================

  /*
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // ==========================================
        // Get Logged-in User
        // ==========================================

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // ==========================================
        // Get Trainee Information
        // ==========================================

        const { data: trainee, error: traineeError } =
          await supabase
            .from("trainees")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (traineeError) throw traineeError;

        setTraineeName(trainee.full_name);

        // ==========================================
        // Get Dashboard Statistics
        // ==========================================

        const { data: dashboardStats, error: statsError } =
          await supabase
            .from("dashboard_stats")
            .select("*")
            .eq("trainee_id", trainee.id)
            .single();

        if (statsError) throw statsError;

        setStats({
          totalAssessments:
            dashboardStats.total_assessments,
          pendingAssessments:
            dashboardStats.pending_assessments,
          latestResult:
            dashboardStats.latest_result,
          certificates:
            dashboardStats.certificates,
          progress:
            dashboardStats.progress,
        });

        // ==========================================
        // Get Upcoming Assessments
        // ==========================================

        const {
          data: assessments,
          error: assessmentsError,
        } = await supabase
          .from("assessments")
          .select("*")
          .eq("trainee_id", trainee.id)
          .order("assessment_date", {
            ascending: true,
          });

        if (assessmentsError)
          throw assessmentsError;

        setUpcomingAssessments(
          assessments.map((assessment) => ({
            id: assessment.id,
            name: assessment.assessment_name,
            type: assessment.assessment_type,
            schedule: assessment.schedule,
            status: assessment.status,
          }))
        );
      } catch (error) {
        console.error(
          "Dashboard Error:",
          error.message
        );
      }
    }

    fetchDashboardData();
  }, []);
  */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome, Eldrich
        </h1>

        <p className="mt-1 text-gray-600">
          Here is your assessment overview and progress.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Assessments */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Total Assessments Taken
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <ClipboardList size={22} />
            </div>

            <span className="text-3xl font-bold">
              {stats.totalAssessments}
            </span>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Pending Assessments
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <Clock3 size={22} />
            </div>

            <span className="text-3xl font-bold">
              {stats.pendingAssessments}
            </span>
          </div>
        </div>

        {/* Latest Result */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Latest Result Status
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2 size={22} />
            </div>

            <span className="text-lg font-semibold text-green-600">
              {stats.latestResult}
            </span>
          </div>
        </div>

        {/* Certificates */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Certificates Earned
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3">
              <Award size={22} />
            </div>

            <span className="text-3xl font-bold">
              {stats.certificates}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Upcoming Assessments */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-5">
              Upcoming Assessments
            </h2>

            <div className="space-y-4">
              {upcomingAssessments.length > 0 ? (
                upcomingAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="grid grid-cols-[1.4fr_1.2fr_0.6fr] gap-4 border-b border-gray-100 pb-4 items-center hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {assessment.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {assessment.type}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-800">
                        Schedule
                      </p>

                      <p className="text-sm text-gray-500">
                        {assessment.schedule}
                      </p>
                    </div>

                    <div className="flex justify-start">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${assessment.status === "Scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {assessment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  {/* BACKEND:
                  This message appears when no assessments
                  are returned from the database.
                  */}
                  No upcoming assessments available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]  border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/trainee/assessment")}
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200"
              >
                View Assessments
              </button>

              <button
                onClick={() => navigate("/trainee/results")}
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200"
              >
                Check Results
              </button>

              <button
                onClick={() => navigate("/trainee/certificates")}
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200"
              >
                View Certificates
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-2xl bg-white p-7 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <p className="font-medium text-gray-700 mb-3">
              Assessment Completion Progress
            </p>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-[3000ms] ease-out"
                style={{
                  width: `${animatedProgress}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Progress: {animatedProgress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}