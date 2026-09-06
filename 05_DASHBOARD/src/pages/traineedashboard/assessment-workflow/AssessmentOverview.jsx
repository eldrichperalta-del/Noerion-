import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Clock3,
  FileText,
  BookOpen,
  Activity,
} from "lucide-react";
import { supabase } from "../../../supabaseClient";
import tesdaLogo from "../../../assets/tesda1.png";

// Safe date parser
const parseDateString = (dateStr) => {
  if (!dateStr || dateStr === "Invalid Date") return null;

  const cleanStr = String(dateStr).split("T")[0].split(" ")[0];
  const parts = cleanStr.split("-").map(Number);

  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

// Compute dynamic status if needed
const calculateStatus = (assignmentData, isCompleted) => {
  if (isCompleted || assignmentData?.status === "Completed") return "Completed";
  if (assignmentData?.status === "Closed") return "Closed";

  if (assignmentData?.assessment_date) {
    const scheduleDate = parseDateString(assignmentData.assessment_date);

    if (scheduleDate) {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkDate = new Date(scheduleDate);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < today) return "Closed";
      if (checkDate > today) return "Scheduled";

      if (assignmentData.start_time) {
        const match = assignmentData.start_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          let [, h, m, period] = match;
          h = Number(h);
          m = Number(m);
          if (period) {
            if (period.toUpperCase() === "PM" && h !== 12) h += 12;
            if (period.toUpperCase() === "AM" && h === 12) h = 0;
          }
          const startTimeDate = new Date();
          startTimeDate.setHours(h, m, 0, 0);

          if (now < startTimeDate) {
            return "Scheduled";
          }
        }
      }
      return "Pending";
    }
  }

  return assignmentData?.status || "Scheduled";
};

export default function AssessmentOverview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [assessment, setAssessment] = useState(state?.assessment || null);
  const [loading, setLoading] = useState(!state?.assessment);

  // Fetch assessment details from Supabase if not present in state
  useEffect(() => {
    async function fetchAssessmentDetails() {
      const assignmentId =
        state?.assignmentId ||
        state?.assessment?.id ||
        localStorage.getItem("active_assignment_id");

      const assessmentId =
        state?.assessmentId ||
        state?.assessment?.assessment_id ||
        localStorage.getItem("active_assignment_id_ref");

      if (!assignmentId && !assessmentId) {
        setLoading(false);
        return;
      }

      if (assignmentId) localStorage.setItem("active_assignment_id", assignmentId);
      if (assessmentId) localStorage.setItem("active_assignment_id_ref", assessmentId);

      if (state?.assessment) {
        setAssessment(state.assessment);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        let assignmentData = null;
        if (assignmentId) {
          const { data: assignData } = await supabase
            .from("assignments")
            .select(`
              id,
              assessment_id,
              assessment_name,
              qualification,
              assessment_date,
              start_time,
              status,
              assessor:profiles!assignments_assessor_id_fkey(first_name, last_name)
            `)
            .eq("id", assignmentId)
            .maybeSingle();

          assignmentData = assignData;
        }

        let isCompleted = assignmentData?.status === "Completed";
        if (user && assignmentId && !isCompleted) {
          const { data: submission } = await supabase
            .from("assessment_submissions")
            .select("status")
            .eq("assignment_id", assignmentId)
            .eq("trainee_id", user.id)
            .maybeSingle();

          if (submission) {
            isCompleted = true;
          }
        }

        const targetAssessmentId = assessmentId || assignmentData?.assessment_id;
        let duration = 40;
        let totalItems = 40;

        if (targetAssessmentId) {
          const { data: assessData } = await supabase
            .from("assessments")
            .select("time_limit_minutes")
            .eq("id", targetAssessmentId)
            .maybeSingle();

          if (assessData) {
            duration = assessData.time_limit_minutes || 40;
          }
        }

        const assessorName = assignmentData?.assessor
          ? `${assignmentData.assessor.first_name || ""} ${assignmentData.assessor.last_name || ""}`.trim()
          : "Assigned Assessor";

        let scheduleStr = "To Be Announced";
        if (assignmentData?.assessment_date) {
          const dateObj = parseDateString(assignmentData.assessment_date);
          if (dateObj) {
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            scheduleStr = `${dateStr}${assignmentData.start_time ? " - " + assignmentData.start_time : ""}`;
          }
        }

        const calculatedStatus = calculateStatus(assignmentData, isCompleted);

        setAssessment({
          id: assignmentId || assignmentData?.id,
          assessment_id: targetAssessmentId,
          title: assignmentData?.assessment_name || "Assessment Overview",
          qualification: assignmentData?.qualification || "General Competency",
          assessor: assessorName,
          schedule: scheduleStr,
          status: calculatedStatus,
          durationMinutes: duration,
          totalItems: totalItems,
        });
      } catch (err) {
        console.error("Error fetching assessment overview:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessmentDetails();
  }, [state]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg font-medium text-gray-600">Loading assessment details...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">Assessment not found.</h2>
        <button
          onClick={() => navigate("/trainee/assessment")}
          className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  // ==========================================================
  // Assessment Status Mapping
  // ==========================================================
  const taskStateMap = {
    Pending: {
      label: "Not Started",
      button: "START BASELINE",
      badgeColor: "bg-yellow-100 text-yellow-700",
      statusDot: "bg-yellow-400",
      disabled: false,
    },
    Scheduled: {
      label: "Scheduled",
      button: "START BASELINE",
      badgeColor: "bg-blue-100 text-blue-700",
      statusDot: "bg-blue-500",
      disabled: true, // Greyed out if in scheduled state
    },
    Ongoing: {
      label: "In Progress",
      button: "CONTINUE ASSESSMENT",
      badgeColor: "bg-blue-100 text-blue-700",
      statusDot: "bg-blue-500",
      disabled: false,
    },
    Completed: {
      label: "Completed",
      button: "VIEW RESULTS",
      badgeColor: "bg-green-100 text-green-700",
      statusDot: "bg-green-500",
      disabled: false,
    },
  };

  const current = taskStateMap[assessment.status] || taskStateMap.Scheduled;
  const durationMinutes = assessment.durationMinutes || 40;
  const totalItems = assessment.totalItems || assessment.questions?.length || 40;

  // ==========================================================
  // Assessment Action Handler
  // ==========================================================
  const handleAssessmentAction = () => {
    if (current.disabled) return;

    const navigationState = {
      assignmentId: assessment.id || state?.assignmentId,
      assessmentId: assessment.assessment_id || state?.assessmentId,
      assessment: assessment,
    };

    switch (assessment.status) {
      case "Pending":
      case "Scheduled":
        navigate("/trainee/assessment/baseline", {
          state: {
            ...navigationState,
            startNew: true,
          },
        });
        break;

      case "Ongoing":
        navigate("/trainee/assessment/written-assessment", {
          state: {
            ...navigationState,
            resume: true,
          },
        });
        break;

      case "Completed":
        navigate("/trainee/results", {
          state: navigationState,
        });
        break;

      default:
        navigate("/trainee/assessment/baseline", {
          state: navigationState,
        });
    }
  };

  return (
    <div className="p-0">
      {/* PAGE TITLE */}
      <div className="mb-5">
        <nav className="mb-2 flex gap-2 text-sm font-semibold">
          <Link
            to="/trainee/assessment"
            className="text-gray-500 hover:text-[#002f86] hover:underline"
          >
            My Assessments
          </Link>
          <span>&gt;</span>
          <span className="text-[#002f86]">Assessment Overview</span>
        </nav>
        <h1 className="text-4xl font-bold text-gray-900">
          Assessment Overview
        </h1>

        <p className="text-gray-500 mt-2">
          Review the details of your assessment before starting.
        </p>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] border-gray-100 mb-6">
        <div className="grid grid-cols-4 gap-30 p-6">
          <div>
            <p className="text-xs font-semibold uppercase">
              Assessment Title
            </p>
            <p className="font-semibold mt-1">{assessment.title}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">
              Assigned Assessor
            </p>
            <p className="font-semibold mt-1">{assessment.assessor}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">Schedule</p>
            <p className="font-semibold mt-1 whitespace-pre-line">
              {assessment.schedule}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">Status</p>
            <span
              className={`inline-flex px-4 py-1 mt-1 rounded-full text-sm font-semibold ${current.badgeColor}`}
            >
              {assessment.status}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-10 space-y-6">
          {/* Assessment Information */}
          <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">
            <div className="flex justify-between items-start gap-12">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="text-[#003C8F]" />
                </div>

                <div>
                  <h3 className="font-semibold">Written Assessment</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">
                    Evaluate theoretical knowledge and problem-solving skills
                    related to the assigned competency. EEG signals will also be
                    monitored during the assessment.
                  </p>
                </div>
              </div>

              {/* Status and button block */}
              <div className="mt-3 flex items-center gap-12 justify-end">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${current.statusDot}`}
                  />
                  <span className="font-medium whitespace-nowrap">
                    {current.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <img
                    src={tesdaLogo}
                    alt="TESDA"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-semibold uppercase whitespace-nowrap">
                    EEG Monitoring Enabled
                  </span>
                </div>

                <button
                  onClick={handleAssessmentAction}
                  disabled={current.disabled}
                  className={`px-6 py-3 min-w-[200px] font-semibold rounded-lg shadow transition whitespace-nowrap ${
                    current.disabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#003C8F] text-white hover:bg-blue-800"
                  }`}
                >
                  {current.disabled ? "START BASELINE (SCHEDULED)" : current.button}
                </button>
              </div>
            </div>
          </div>

          {/* SECOND ROW (Progress and Key Details) */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Key Details */}
            <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">
              <h2 className="font-bold uppercase text-gray-700 mb-5">
                Key Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">
                  <Clock3 className="text-blue-600" />
                  <div>
                    <p className="font-semibold">{durationMinutes} Minutes</p>
                    <p className="text-sm text-gray-500">Duration</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">
                  <FileText className="text-green-600" />
                  <div>
                    <p className="font-semibold">{totalItems} Questions</p>
                    <p className="text-sm text-gray-500">Items</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">
                  <Activity className="text-purple-600" />
                  <div>
                    <p className="font-semibold">EEG Enabled</p>
                    <p className="text-sm text-gray-500">Monitoring</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">
                  <BookOpen className="text-yellow-600" />
                  <div>
                    <p className="font-semibold">Written</p>
                    <p className="text-sm text-gray-500">Assessment Type</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-11 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-8">
              <div className="mt-5 relative flex justify-between items-start">
                <div className="absolute top-6 left-[8%] right-[8%] h-0.5 bg-gray-400 z-0"></div>

                {[
                  "Overview",
                  "Baseline",
                  "Prepare",
                  "Written\nAssessment",
                  "Completed",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="relative z-10 flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 cursor-pointer ${
                        index === 0
                          ? "bg-[#003C8F] border-[#003C8F] text-white"
                          : "bg-white border-gray-300 text-gray-500 transition-all duration-300 hover:bg-[#003C8F] hover:border-[#003C8F] hover:text-white hover:scale-110"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <span className="mt-3 text-xs text-center whitespace-pre-line text-gray-600">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}