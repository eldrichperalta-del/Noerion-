import { useMemo, useState } from "react";

import AssessmentHistoryFilters from "../../components/assessordashboard/assessment-history/AssessmentHistoryFilters";
import AssessmentHistoryTable from "../../components/assessordashboard/assessment-history/AssessmentHistoryTable";
import HistorySummaryCards from "../../components/assessordashboard/assessment-history/HistorySummaryCards";
import AssessorPageHeader from "../../components/assessordashboard/shared/AssessorPageHeader";

import { mockAssessmentHistory } from "../../data/mockAssessmentHistory";

/* ============================================================================
   BACKEND HANDOFF

   Replace mockAssessmentHistory with completed assessment records retrieved
   from Supabase for the currently authenticated assessor.

   Expected fields:
   - traineeName
   - traineeId
   - course
   - writtenScore
   - finalResult
   - completedDate
   - status
   - aiAvailable

   Filtering should eventually be handled through backend queries for better
   performance when working with large datasets.
============================================================================ */

export default function AssessmentHistory() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("All Courses");
  const [result, setResult] = useState("All Results");
  const [dateRange, setDateRange] = useState("");

  const filteredHistory = useMemo(() => {
    return mockAssessmentHistory.filter((record) => {
      const matchesSearch =
        record.traineeName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        record.traineeId
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCourse =
        course === "All Courses" ||
        record.course === course;

      const matchesResult =
        result === "All Results" ||
        record.finalResult === result;

      // Placeholder until a date range picker is implemented.
      const matchesDate = true;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesResult &&
        matchesDate
      );
    });
  }, [search, course, result, dateRange]);

  return (
    <div className="space-y-6">
      <AssessorPageHeader
        title="Assessment History"
        subtitle="Review your complete record of past assessments and validated certifications."
      />

      <HistorySummaryCards
        history={filteredHistory}
      />

      <AssessmentHistoryFilters
        search={search}
        onSearchChange={setSearch}
        course={course}
        onCourseChange={setCourse}
        result={result}
        onResultChange={setResult}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <AssessmentHistoryTable
        history={filteredHistory}
      />
    </div>
  );
}