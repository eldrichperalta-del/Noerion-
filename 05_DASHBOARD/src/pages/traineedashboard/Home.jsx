
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Safe date parser to handle YYYY-MM-DD or full ISO timestamp strings
const parseDateString = (dateStr) => {
  if (!dateStr || dateStr === "Invalid Date") return null;

  const cleanStr = String(dateStr).split("T")[0].split(" ")[0];
  const parts = cleanStr.split("-").map(Number);

  if (
    parts.length >= 3 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    !isNaN(parts[2])
  ) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

// Helper to parse time string into Date object
const parseTimeString = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return null;

  const match = timeStr.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!match) return null;

  let [, h, m, period] = match;

  h = Number(h);
  m = Number(m);

  if (period) {
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
  }

  const resultDate = new Date(baseDate);
  resultDate.setHours(h, m, 0, 0);

  return resultDate;
};

// Helper to determine status based on Date, Start Time, End Time, and DB state
const calculateDisplayStatus = (item, isCompleted) => {
  if (
    isCompleted ||
    item.status?.toLowerCase() === "completed"
  ) {
    return "Completed";
  }

  if (item.status?.toLowerCase() === "closed") {
    return "Closed";
  }

  if (item.assessment_date) {
    const scheduleDate = parseDateString(item.assessment_date);

    if (scheduleDate) {
      const now = new Date();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkDate = new Date(scheduleDate);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < today) {
        return "Closed";
      } else if (checkDate > today) {
        return "Scheduled";
      } else {
        // Same day time comparisons

        // 1. If current time is past end_time -> Closed
        if (item.end_time) {
          const endTimeDate = parseTimeString(
            item.end_time,
            now
          );

          if (endTimeDate && now > endTimeDate) {
            return "Closed";
          }
        }

        // 2. If current time is before start_time -> Scheduled
        if (item.start_time) {
          const startTimeDate = parseTimeString(
            item.start_time,
            now
          );

          if (startTimeDate && now < startTimeDate) {
            return "Scheduled";
          }
        }

        // 3. Within start and end time -> Pending
        return "Pending";
      }
    }
  }

  return item.status || "Scheduled";
};

export default function Home() {
  const navigate = useNavigate();

  const [traineeName, setTraineeName] = useState("Trainee");

  const [stats, setStats] = useState({
    totalAssessments: 0,
    pendingAssessments: 0,
    latestResult: "N/A",
    certificates: 0,
    progress: 0,
  });

  const [upcomingAssessments, setUpcomingAssessments] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [animatedProgress, setAnimatedProgress] =
    useState(0);

  // ============================================================
  // PAGINATION
  // Maximum of 5 assessments per page.
  // Pagination appears when there are 5 or more assessments.
  // ============================================================

  const ITEMS_PER_PAGE = 5;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(
    upcomingAssessments.length / ITEMS_PER_PAGE
  );

  const paginatedAssessments =
    upcomingAssessments.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

  // Reset to page 1 when the assessment list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [upcomingAssessments.length]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) =>
      Math.min(page + 1, totalPages)
    );
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";

      case "closed":
        return "bg-red-100 text-red-700 border border-red-300";

      case "completed":
        return "bg-green-100 text-green-700 border border-green-300";

      case "scheduled":
      default:
        return "bg-blue-100 text-blue-700 border border-blue-300";
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isMounted) return;

        // ============================================================
        // 1. PROFILE
        // ============================================================

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && isMounted) {
          const fullName = [
            profile.first_name,
            profile.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          if (fullName) {
            setTraineeName(fullName);
          }
        }

        // ============================================================
        // 2. SUBMISSIONS
        // ============================================================

        const { data: submissions } = await supabase
          .from("assessment_submissions")
          .select("assignment_id, status")
          .eq("trainee_id", user.id);

        const completedAssignmentIds = new Set(
          (submissions || [])
            .map((s) => String(s.assignment_id))
            .filter(Boolean)
        );

        // ============================================================
        // 3. ASSIGNMENTS
        // ============================================================

        const {
          data: assignments,
          error: assignErr,
        } = await supabase
          .from("assignments")
          .select(`
            id,
            assessment_id,
            assessment_name,
            assessment_type,
            qualification,
            assessment_date,
            start_time,
            end_time,
            status
          `)
          .eq("trainee_id", user.id)
          .order("assessment_date", {
            ascending: true,
          });

        if (assignErr) throw assignErr;

        // ============================================================
        // 4. CALCULATE STATUSES
        // ============================================================

        const activeList = [];

        (assignments || []).forEach((item) => {
          const isCompleted =
            completedAssignmentIds.has(
              String(item.id)
            ) ||
            item.status?.toLowerCase() ===
              "completed";

          let formattedSchedule =
            "Date To Be Announced";

          if (item.assessment_date) {
            const dateObj = parseDateString(
              item.assessment_date
            );

            if (dateObj) {
              const dateStr =
                dateObj.toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                );

              formattedSchedule = `${dateStr}${
                item.start_time
                  ? " - " + item.start_time
                  : ""
              }`;
            }
          }

          const currentStatus =
            calculateDisplayStatus(
              item,
              isCompleted
            );

          activeList.push({
            id: item.id,
            assessment_id: item.assessment_id,
            name:
              item.assessment_name ||
              "Assessment",
            type:
              item.qualification ||
              item.assessment_type ||
              "General",
            schedule: formattedSchedule,
            status: currentStatus,
          });
        });

        // ============================================================
        // 5. DASHBOARD STATS
        // ============================================================

        const totalTaken =
          completedAssignmentIds.size;

        const pendingCount =
          activeList.filter(
            (a) => a.status === "Pending"
          ).length;

        const latestResultStr =
          totalTaken > 0
            ? "Completed"
            : "No Records";

        const totalAssigned =
          (assignments || []).length;

        const calculatedProgress =
          totalAssigned > 0
            ? Math.round(
                (totalTaken / totalAssigned) * 100
              )
            : 0;

        if (isMounted) {
          setUpcomingAssessments(activeList);

          setStats({
            totalAssessments: totalTaken,
            pendingAssessments: pendingCount,
            latestResult: latestResultStr,
            certificates: totalTaken,
            progress: calculatedProgress,
          });
        }
      } catch (error) {
        console.error(
          "Error loading homepage data:",
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(stats.progress);
    }, 300);

    return () => clearTimeout(timer);
  }, [stats.progress]);

  return (
    <div className="space-y-4">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome, {traineeName}
        </h1>

        <p className="mt-1 text-gray-600">
          Here is your assessment overview and progress.
        </p>
      </div>

      {/* ============================================================
          STAT CARDS
      ============================================================ */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Total Assessments Taken
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={22} />
            </div>

            <span className="text-3xl font-bold text-gray-900">
              {stats.totalAssessments}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Pending Assessments
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock3 size={22} />
            </div>

            <span className="text-3xl font-bold text-gray-900">
              {stats.pendingAssessments}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Latest Result Status
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>

            <span className="text-lg font-semibold text-green-600">
              {stats.latestResult}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            Certificates Earned
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Award size={22} />
            </div>

            <span className="text-3xl font-bold text-gray-900">
              {stats.certificates}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">

            {/* ========================================================
                SCHEDULE ASSESSMENTS HEADER

                No longer a button.
            ======================================================== */}

            <h2 className="mb-5 text-2xl font-semibold text-gray-900">
              Schedule Assessments
            </h2>

            {/* ========================================================
                TABLE
            ======================================================== */}

            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="grid grid-cols-[1.4fr_1.2fr_0.6fr] gap-4 bg-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                <span>Assessment</span>
                <span>Schedule</span>
                <span>Status</span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-500">
                  Loading schedules...
                </div>
              ) : upcomingAssessments.length > 0 ? (
                paginatedAssessments.map(
                  (assessment) => (
                    <div
                      key={assessment.id}
                      onClick={() =>
                        navigate(
                          "/trainee/assessment",
                          {
                            state: {
                              assignmentId:
                                assessment.id,
                            },
                          }
                        )
                      }
                      className="grid grid-cols-[1.4fr_1.2fr_0.6fr] items-center gap-4 border-b border-gray-100 px-4 py-4 transition hover:cursor-pointer hover:bg-gray-50"
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
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeStyle(
                            assessment.status
                          )}`}
                        >
                          {assessment.status}
                        </span>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No upcoming assessments available.
                </div>
              )}
            </div>

            {/* ========================================================
                PAGINATION

                IMPORTANT:
                Pagination appears when there are EXACTLY 5 or more
                assessments.

                1-4  -> hidden
                5+   -> visible
            ======================================================== */}

            {upcomingAssessments.length >= 5 && (
              <div className="mt-5 flex items-center justify-between">

                {/* Previous button */}
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 text-gray-300"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-2">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        goToPage(page)
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? "bg-[#002f86] text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next button */}
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={
                    currentPage === totalPages
                  }
                  className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    currentPage === totalPages
                      ? "cursor-not-allowed border-gray-200 text-gray-300"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            RIGHT SIDE
        ============================================================ */}

        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={() =>
                  navigate(
                    "/trainee/assessment"
                  )
                }
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200 transition"
              >
                View Assessments
              </button>

              <button
                onClick={() =>
                  navigate("/trainee/results")
                }
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200 transition"
              >
                Check Results
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/trainee/certificates"
                  )
                }
                className="w-full rounded-lg border border-gray-400 py-2 font-medium hover:bg-gray-200 transition"
              >
                View Certificates
              </button>
            </div>
          </div>

          {/* Assessment Completion Progress */}
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

