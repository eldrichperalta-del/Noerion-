import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";
import AssignedAssessmentsTable from "../../components/assessordashboard/home/AssignedAssessmentsTable";
import AssessorNotifications from "../../components/assessordashboard/home/AssessorNotifications";
import AssessorOverviewCards from "../../components/assessordashboard/home/AssessorOverviewCards";
import UpcomingSchedule from "../../components/assessordashboard/home/UpcomingSchedule";
import { supabase } from "../../supabaseClient"; // Adjust path if needed

const dashboardStats = {
  assignedAssessments: 15,
  ongoingAssessments: 4,
  completedEvaluations: 88,
};

const assignedAssessments = [
  {
    id: 1,
    traineeName: "Juan Dela Cruz",
    course: "TESDA NC III Electronics: Advanced Robotics Assembly",
    schedule: "April 15, 2025 - 09:00 AM",
    status: "Pending",
    canEvaluate: true,
  },
  {
    id: 2,
    traineeName: "Maria Santos",
    course: "Culinary Arts",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Ongoing",
    canEvaluate: true,
  },
  {
    id: 3,
    traineeName: "Maria Garcia",
    course: "Culinary Arts",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Ongoing",
    canEvaluate: true,
  },
  {
    id: 4,
    traineeName: "Juan Dela Cruz",
    course: "TESDA NC III Electronics: Advanced Robotics Assembly",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Completed",
    canEvaluate: false,
  },
  {
    id: 5,
    traineeName: "Maria Garcia",
    course: "TESDA NC III Electronics: Advanced Robotics Assembly",
    schedule: "April 16, 2025 - 02:00 PM",
    status: "Valid",
    canEvaluate: false,
  },
];

const upcomingSchedules = [
  {
    id: 1,
    month: "Apr",
    day: "16",
    traineeName: "Maria Santos",
    assessmentType: "Practical Exam",
    time: "09:00 AM",
  },
  {
    id: 2,
    month: "Apr",
    day: "16",
    traineeName: "Maria Garcia",
    assessmentType: "Practical Exam",
    time: "02:00 PM",
  },
];

const notifications = [
  {
    id: 1,
    tone: "success",
    message: "Newly assigned: Advanced Robotics Assembly for Juan Dela Cruz",
  },
  {
    id: 2,
    tone: "warning",
    message: "Pending evaluation: Industrial Electronics for Maria Garcia",
  },
  {
    id: 3,
    tone: "info",
    message: "Schedule updated: Culinary Arts practical exam at 2:00 PM",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [assessorName, setAssessorName] = useState("Assessor");

  useEffect(() => {
    const fetchAssessorName = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            const fullName = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ");

            if (fullName) {
              setAssessorName(fullName);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching assessor name for header:", error);
      }
    };

    fetchAssessorName();
  }, []);

  const handleViewDetails = () => {
    navigate("/assessor/assessment-panel");
  };

  const handleEvaluate = () => {
    navigate("/assessor/evaluation");
  };

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title={`Welcome, ${assessorName}`}
        subtitle="Manage and evaluate assigned assessment."
      />

      <AssessorOverviewCards stats={dashboardStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AssignedAssessmentsTable
          assessments={assignedAssessments}
          onViewDetails={handleViewDetails}
          onEvaluate={handleEvaluate}
        />

        <div className="space-y-6">
          <UpcomingSchedule schedules={upcomingSchedules} />
          <AssessorNotifications notifications={notifications} />
        </div>
      </div>
    </div>
  );
}