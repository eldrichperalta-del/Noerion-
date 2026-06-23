import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

import ResultsOverviewCards from "../../components/admin/results-monitoring/ResultsOverviewCards";
import ResultsFilters from "../../components/admin/results-monitoring/ResultsFilters";
import ResultsTable from "../../components/admin/results-monitoring/ResultsTable";

import "../../styles/ResultsMonitoring.css";

export default function ResultsMonitoring() {
  // =========================
  // STATE
  // =========================
  const [overviewData, setOverviewData] = useState({
    totalAssessments: 0,
    totalPassed: 0,
    totalFailed: 0,
    passRate: 0,
  });

  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  // =========================
  // FILTER STATE (FIXED: NO "All")
  // =========================
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const [tempDay, setTempDay] = useState("");
  const [tempMonth, setTempMonth] = useState("");
  const [tempYear, setTempYear] = useState("");

  const [dayFilter, setDayFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError(null);
    await Promise.all([fetchOverview(), fetchResults()]);
  };

  // =========================
  // OVERVIEW (MOCK)
  // =========================
  const fetchOverview = async () => {
    setLoadingOverview(true);

    try {
      const mockOverview = {
        totalAssessments: 5,
        totalPassed: 3,
        totalFailed: 2,
        passRate: 60,
      };

      setOverviewData(mockOverview);
    } catch (err) {
      setError(err.message || "Failed to load overview.");
    } finally {
      setLoadingOverview(false);
    }
  };

  // =========================
  // RESULTS (MOCK)
  // =========================
  const fetchResults = async () => {
    setLoadingResults(true);

    try {
      const mockData = [
        {
          traineeId: "ASR-2023-011",
          traineeName: "Emily Chen",
          course: "Culinary Arts",
          finalResult: "Fail",
          dateCompleted: "2023-07-11",
          writtenScore: 72,
          aiSummary: "Needs improvement in execution and timing.",
        },
        {
          traineeId: "ASR-2023-012",
          traineeName: "Marcus Kim",
          course: "Culinary Arts",
          finalResult: "Pass",
          dateCompleted: "2024-07-11",
          writtenScore: 88,
          aiSummary: "Strong performance with minimal errors.",
        },
        {
          traineeId: "ASR-2023-013",
          traineeName: "Sarah Jenkins",
          course: "BSR / EG",
          finalResult: "Pass",
          dateCompleted: "2025-07-11",
          writtenScore: 91,
          aiSummary: "Excellent understanding and execution.",
        },
        {
          traineeId: "ASR-2023-014",
          traineeName: "MAMAMO",
          course: "Culinary Arts",
          finalResult: "Pass",
          dateCompleted: "2026-07-11",
          writtenScore: 85,
          aiSummary: "Consistent and reliable performance.",
        },
        {
          traineeId: "ASR-2023-015",
          traineeName: "ANIMOSITY",
          course: "PABIGAT",
          finalResult: "Fail",
          dateCompleted: "2026-07-11",
          writtenScore: 60,
          aiSummary: "Below competency threshold.",
        },
      ];

      setResults(mockData);
    } catch (err) {
      setError(err.message || "Failed to load results.");
    } finally {
      setLoadingResults(false);
    }
  };

  // =========================
  // DATE NORMALIZATION
  // =========================
  const normalizedResults = useMemo(() => {
    return results.map((r) => ({
      ...r,
      _date: new Date(r.dateCompleted),
    }));
  }, [results]);

  // =========================
  // APPLY DATE FILTERS
  // =========================
  const handleApplyDateFilter = () => {
    setDayFilter(tempDay);
    setMonthFilter(tempMonth);
    setYearFilter(tempYear);
  };

  // =========================
  // CLEAR ALL FILTERS (FIXED)
  // =========================
  const handleClearFilters = () => {
    setSearchTerm("");
    setResultFilter("");
    setCourseFilter("");

    setTempDay("");
    setTempMonth("");
    setTempYear("");

    setDayFilter("");
    setMonthFilter("");
    setYearFilter("");
  };

  // =========================
  // COURSES LIST (FIXED)
  // =========================
  const courses = useMemo(() => {
    return [...new Set(results.map((r) => r.course))];
  }, [results]);

  // =========================
  // FILTER LOGIC (FIXED CORE BUG HERE)
  // =========================
  const filteredResults = useMemo(() => {
    return normalizedResults.filter((r) => {
      const searchMatch =
        !searchTerm ||
        r.traineeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.traineeId.toLowerCase().includes(searchTerm.toLowerCase());

      const resultMatch =
        !resultFilter || r.finalResult === resultFilter;

      const courseMatch =
        !courseFilter || r.course === courseFilter;

      const dayMatch =
        !dayFilter || r._date.getDate() === Number(dayFilter);

      const monthMatch =
        !monthFilter || r._date.getMonth() + 1 === Number(monthFilter);

      const yearMatch =
        !yearFilter || r._date.getFullYear() === Number(yearFilter);

      return (
        searchMatch &&
        resultMatch &&
        courseMatch &&
        dayMatch &&
        monthMatch &&
        yearMatch
      );
    });
  }, [
    normalizedResults,
    searchTerm,
    resultFilter,
    courseFilter,
    dayFilter,
    monthFilter,
    yearFilter,
  ]);

  // =========================
  // UI
  // =========================
  return (
    <div className="results-page">

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        OVERVIEW
      </h2>

      <ResultsOverviewCards
        stats={overviewData}
        loading={loadingOverview}
      />

      <div className="results-container">

        <ResultsFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          courseFilter={courseFilter}
          setCourseFilter={setCourseFilter}
          day={tempDay}
          setDay={setTempDay}
          month={tempMonth}
          setMonth={setTempMonth}
          year={tempYear}
          setYear={setTempYear}
          onApply={handleApplyDateFilter}
          onClear={handleClearFilters}
          courses={courses}
        />

        <ResultsTable
          results={filteredResults}
          loading={loadingResults}
          error={error}
        />

      </div>
    </div>
  );
}