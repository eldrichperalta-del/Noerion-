import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CourseListTable from "../../components/assessordashboard/assessment-panel/CourseListTable";
import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";

// BACKEND HANDOFF:
// Fetch only courses assigned to the logged-in assessor.
// Suggested fields: id, qualification_name, course_code, active_trainee_count,
// schedule_label, start_date. The "View Trainees" action should route to a
// course-specific trainee list once that route is added.
const courseList = [
  {
    id: 1,
    name: "TESDA NC III Electronics: Advanced Robotics Assembly",
    code: "ERA-3001",
    activeTrainees: 32,
    schedule: "Weekdays 9-11 AM",
    startDate: "Apr 20, 2025",
  },
  {
    id: 2,
    name: "TESDA NC II Cookery: Culinary Arts Technique",
    code: "CAT-2001",
    activeTrainees: 18,
    schedule: "Evenings 6-8 PM",
    startDate: "May 1, 2025",
  },
  {
    id: 3,
    name: "TESDA NC IV IT: Web Application Development",
    code: "WAD-4001",
    activeTrainees: 25,
    schedule: "Mon/Wed 1-3 PM",
    startDate: "Apr 22, 2025",
  },
  {
    id: 4,
    name: "TESDA NC I Mechatronics: Basic PLC Programming",
    code: "BPC-1001",
    activeTrainees: 15,
    schedule: "Fri 9 AM-12 PM",
    startDate: "May 15, 2025",
  },
];

export default function AssessmentPanel() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return courseList;

    return courseList.filter((course) =>
      `${course.name} ${course.code}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const handleViewTrainees = (course) => {
    navigate("/assessor/assessment-panel/selected-trainees", {
      state: {
        selectedCourse: course.name,
        courseId: course.id,
        courseCode: course.code,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assessment Panel"
        subtitle="Manage and monitor your assigned assessment courses"
      />

      <CourseListTable
        courses={filteredCourses}
        searchTerm={searchTerm}
        selectedDate={selectedDate}
        onSearchChange={setSearchTerm}
        onDateChange={setSelectedDate}
        onViewTrainees={handleViewTrainees}
      />
    </div>
  );
}
