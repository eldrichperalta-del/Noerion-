import { Calendar, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

// Safe date parser to handle YYYY-MM-DD or full ISO timestamp strings
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

// Safe time parser to parse "11:30 PM" or "11:30:00" into a Date object
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
  if (isCompleted || item.status?.toLowerCase() === "completed") {
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
        // --- SAME DAY TIME COMPARISONS ---

        // 1. If current time is past end_time -> Closed
        if (item.end_time) {
          const endTimeDate = parseTimeString(item.end_time, now);
          if (endTimeDate && now > endTimeDate) {
            return "Closed";
          }
        }

        // 2. If current time is before start_time -> Scheduled
        if (item.start_time) {
          const startTimeDate = parseTimeString(item.start_time, now);
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

export default function Assessment() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic trainee assessments from Supabase
  useEffect(() => {
    async function fetchTraineeAssessments() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // 1. Fetch Submissions to check completed assessments
        const { data: submissions } = await supabase
          .from("assessment_submissions")
          .select("assignment_id, status")
          .eq("trainee_id", user.id);

        const completedMap = new Set(
          (submissions || []).map((s) => String(s.assignment_id))
        );

        // 2. Fetch Assignments joined with Profiles for Assessor name
        const { data: assignments, error } = await supabase
          .from("assignments")
          .select(`
            id,
            assessment_id,
            assessment_name,
            qualification,
            assessment_date,
            start_time,
            end_time,
            status,
            assessor:profiles!assignments_assessor_id_fkey(first_name, last_name)
          `)
          .eq("trainee_id", user.id)
          .order("assessment_date", { ascending: true });

        if (error) throw error;

        // 3. Format assignments for display
        const formattedList = (assignments || []).map((item) => {
          const isCompleted = completedMap.has(String(item.id)) || item.status === "Completed";
          
          const displayStatus = calculateDisplayStatus(item, isCompleted);

          // Format Assessor Name
          const assessorName = item.assessor 
            ? `${item.assessor.first_name || ""} ${item.assessor.last_name || ""}`.trim() 
            : "Assigned Assessor";

          // Format Date String
          let formattedSchedule = "To Be Announced";
          if (item.assessment_date) {
            const dateObj = parseDateString(item.assessment_date);
            if (dateObj) {
              const dateStr = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              formattedSchedule = `${dateStr}${item.start_time ? " (" + item.start_time + ")" : ""}`;
            }
          }

          return {
            id: item.id,
            assessment_id: item.assessment_id,
            title: item.assessment_name || "Untitled Assessment",
            qualification: item.qualification || "General Competency",
            assessor: assessorName || "TBD",
            schedule: formattedSchedule,
            rawDate: item.assessment_date,
            start_time: item.start_time,
            end_time: item.end_time,
            status: displayStatus,
          };
        });

        setAssessments(formattedList);
      } catch (err) {
        console.error("Error fetching assessments:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTraineeAssessments();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  // Filter Logic
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.qualification.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || assessment.status === statusFilter;

    const matchesDate = !selectedDate || assessment.rawDate === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleViewAssessment = (assessment) => {
    navigate("/trainee/assessment/overview", {
      state: { 
        assignmentId: assessment.id, 
        assessmentId: assessment.assessment_id,
        assessment: assessment
      },
    });
  };

  return (
    <div className="p-0">
      <DashboardPageHeader
        title="My Assessments"
        subtitle="View your scheduled assessments and continue the next step in your evaluation."
      />

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
        <div className="relative w-full lg:max-w-md">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Title or Qualification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex w-full gap-3 lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[160px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>

          <div className="relative flex-1 lg:w-64">
            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 rounded-xl bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
        <div>Assessment Title</div>
        <div>Assigned Assessor</div>
        <div>Schedule</div>
        <div>Status</div>
        <div></div>
      </div>

      {/* Assessment List */}
      <div className="space-y-4 mt-4">
        {loading ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">
            Loading your assessments...
          </div>
        ) : filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="grid grid-cols-[2fr_1.2fr_1.4fr_0.8fr_1fr] gap-4 items-center rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div>
                <h3 className="font-semibold text-lg">{assessment.title}</h3>
                <p className="text-gray-500">{assessment.qualification}</p>
              </div>

              <div className="text-sm text-gray-700">{assessment.assessor}</div>
              <div className="text-sm text-gray-700">{assessment.schedule}</div>

              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(assessment.status)}`}>
                  {assessment.status}
                </span>
              </div>

              <div className="flex justify-end">
                {/* Hide button if assessment status is "Closed" */}
                {assessment.status !== "Closed" && (
                  <button
                    onClick={() => handleViewAssessment(assessment)}
                    className="rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#001f59] hover:shadow-lg active:scale-95"
                  >
                    View Assessment
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">
            No assessments found.
          </div>
        )}
      </div>
    </div>
  );
}