import { useLocation, useNavigate } from "react-router-dom";
import {
  Clock3,
  FileText,
  BookOpen,
  Activity,
} from "lucide-react";
import tesdaLogo from "../../../assets/tesda1.png";

export default function AssessmentOverview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Temporary: If no state, use dummy data (Optional, for easy testing)
  const assessment = state?.assessment || {
    id: 1,
    title: "Advanced Robotics Assembly",
    assessor: "Engr. J. Dela Cruz",
    schedule: "April 14, 2025 - 09:00 AM",
    status: "Pending", // Can be "Pending", "Ongoing", "Completed"
  };

  // If even dummy data fails (unlikely in this context)
  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold">
          Assessment not found.
        </h2>

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
  //
  // Pending   -> Not Started
  // Ongoing   -> In Progress
  // Completed -> Completed
  // ==========================================================

  const taskStateMap = {
    Pending: {
      label: "Not Started",
      button: "START ASSESSMENT",
      badgeColor: "bg-yellow-100 text-yellow-700",
      statusDot: "bg-yellow-400",
    },

    Ongoing: {
      label: "In Progress",
      button: "CONTINUE ASSESSMENT",
      badgeColor: "bg-blue-100 text-blue-700",
      statusDot: "bg-blue-500",
    },

    Completed: {
      label: "Completed",
      button: "VIEW RESULTS",
      badgeColor: "bg-green-100 text-green-700",
      statusDot: "bg-green-500",
    },
  };

  const current = taskStateMap[assessment.status] || taskStateMap.Pending;

  // ==========================================================
  // Assessment Action Handler
  // ==========================================================
  const handleAssessmentAction = () => {
    switch (assessment.status) {
      case "Pending":
        // This is a special flag for baseline
        navigate("/trainee/assessment/baseline", {
          state: {
            assessment,
            startNew: true, // Signal to clear data
          },
        });
        break;

      case "Ongoing":
        // We go straight to written for resume
        navigate("/trainee/assessment/written-assessment", {
          state: {
            assessment,
            resume: true,
          },
        });
        break;

      case "Completed":
        navigate("/trainee/results", {
          state: {
            assessment,
          },
        });
        break;

      default:
        // Default to starting baseline
        navigate("/trainee/assessment/baseline", {
          state: {
            assessment,
          },
        });
    }
  };

  return (
    <div className="p-0">

      {/* PAGE TITLE */}

      <div className="mb-5">
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

            <p className="font-semibold mt-1">
              {assessment.title}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">
              Assigned Assessor
            </p>

            <p className="font-semibold mt-1">
              {assessment.assessor}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">
              Schedule
            </p>

            <p className="font-semibold mt-1 whitespace-pre-line">
              {assessment.schedule}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase">
              Status
            </p>

            <span
              className={`inline-flex px-4 py-1 mt-1 rounded-full text-sm font-semibold ${current.badgeColor}`}
            >
              {assessment.status}
            </span>
          </div>

        </div>

      </div>

      {/* CONTENT - Changed to a grid to support the blank space on the right */}

      <div className="grid grid-cols-10 gap-6">

        {/* LEFT & CENTER CARD (Assessment Information) - Span most of the width */}

        <div className="col-span-10 space-y-6">

          {/* Assessment Information */}

          <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6">


            {/* Changed flex-row layout to put status/button on far right */}
            <div className="flex justify-between items-start gap-12">

              <div className="flex gap-4">

                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="text-[#003C8F]" />
                </div>

                <div>

                  <h3 className="font-semibold">
                    Written Assessment
                  </h3>

                  {/* Widened the text for better flow in the wider card */}
                  <p className="text-sm text-gray-500 mt-2 max-w-xl">
                    Evaluate theoretical knowledge and problem-solving
                    skills related to the assigned competency.
                    EEG signals will also be monitored during
                    the assessment.
                  </p>

                </div>

              </div>

              {/* Status and button block - Horizontally aligned */}
              <div className="mt-3 flex items-center gap-12 justify-end">

                {/* State Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${current.statusDot}`}
                  />
                  <span className="font-medium whitespace-nowrap">
                    {current.label}
                  </span>
                </div>

                {/* EEG Enabled */}
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

                {/* Action Button moved here */}
                <button
                  onClick={handleAssessmentAction}
                  className="px-6 py-3 min-w-[200px] bg-[#003C8F] text-white font-semibold rounded-lg shadow hover:bg-blue-800 transition whitespace-nowrap"
                >
                  {current.button}
                </button>

              </div>

            </div>

          </div>

          {/* SECOND ROW (Progress and Key Details) - Back to grid columns */}
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
                    <p className="font-semibold">
                      30 Minutes
                    </p>

                    <p className="text-sm text-gray-500">
                      Duration
                    </p>
                  </div>

                </div>

                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">

                  <FileText className="text-green-600" />

                  <div>
                    <p className="font-semibold">
                      40 Questions
                    </p>

                    <p className="text-sm text-gray-500">
                      Items
                    </p>
                  </div>

                </div>

                <div className="bg-white rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">

                  <Activity className="text-purple-600" />

                  <div>
                    <p className="font-semibold">
                      EEG Enabled
                    </p>

                    <p className="text-sm text-gray-500">
                      Monitoring
                    </p>
                  </div>

                </div>

                <div className="bg-white  rounded-xl p-4 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#003C8F]">
                  <BookOpen className="text-yellow-600" />

                  <div>
                    <p className="font-semibold">
                      Written
                    </p>

                    <p className="text-sm text-gray-500">
                      Assessment Type
                    </p>
                  </div>

                </div>

              </div>

            </div>


            {/* Progress */}

            <div className="mt-11 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-8">

              <div className="mt-5 relative flex justify-between items-start">

                {/* Connecting Line */}
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
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 cursor-pointer ${index === 0
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