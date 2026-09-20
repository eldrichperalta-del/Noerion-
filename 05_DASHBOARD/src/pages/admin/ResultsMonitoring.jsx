
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { supabase } from "../../supabaseClient";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

import "../../styles/ResultsMonitoring.css";

export default function ResultsMonitoring() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [results, setResults] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCoursesAndResults();
    }, []);

    const fetchCoursesAndResults = async () => {
        setLoading(true);
        setError("");

        try {
            // =========================================================
            // 1. FETCH COURSES
            // =========================================================
            const {
                data: courseData,
                error: courseError,
            } = await supabase
                .from("courses")
                .select(`
                    id,
                    code,
                    title,
                    qualification_level
                `)
                .order("title", {
                    ascending: true,
                });

            if (courseError) {
                throw courseError;
            }

            // =========================================================
            // 2. FETCH ASSESSMENTS
            //
            // Used for:
            // "No. of Assessments"
            //
            // This counts the actual assessment records belonging
            // to each course.
            // =========================================================
            const {
                data: assessmentData,
                error: assessmentError,
            } = await supabase
                .from("assessments")
                .select(`
                    id,
                    course_id,
                    title,
                    total_items,
                    status
                `);

            if (assessmentError) {
                throw assessmentError;
            }

            // =========================================================
            // 3. FETCH ASSESSMENT RESULTS
            //
            // Used for:
            // "Trainees with Results"
            //
            // A trainee is counted only once per course, even if
            // the trainee has results for multiple assessments.
            // =========================================================
            const {
                data: resultData,
                error: resultError,
            } = await supabase
                .from("assessment_submissions")
                .select(`
                    id,
                    assessment_id,
                    trainee_id,
                    status,
                    total_score,
                    passed,
                    overall_result,
                    submitted_at,
                    created_at,
                    updated_at,
                    assessments!inner (
                        id,
                        course_id,
                        title,
                        total_items,
                        status
                    )
                `)
                .in("status", [
                    "submitted",
                    "evaluated",
                ])
                .order("updated_at", {
                    ascending: false,
                });

            if (resultError) {
                throw resultError;
            }

            setCourses(courseData || []);
            setAssessments(assessmentData || []);
            setResults(resultData || []);
        } catch (err) {
            console.error(
                "Results Monitoring error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load assessment results."
            );

            setCourses([]);
            setAssessments([]);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // =============================================================
    // BUILD COURSE-LEVEL SUMMARY
    //
    // The table displays:
    //
    // Course
    // No. of Assessments
    // Trainees with Results
    //
    // Individual Competent / Not Yet Competent results are handled
    // deeper in the Results Monitoring workflow.
    // =============================================================
    const courseResults = useMemo(() => {
        return courses.map((course) => {
            // =====================================================
            // COUNT ASSESSMENTS FOR THIS COURSE
            // =====================================================
            const courseAssessments = assessments.filter(
                (assessment) =>
                    assessment?.course_id === course.id
            );

            // =====================================================
            // FIND UNIQUE TRAINEES WITH RESULTS
            //
            // A trainee should only be counted once per course,
            // even if they have multiple assessment submissions.
            // =====================================================
            const traineeIds = new Set();

            results.forEach((submission) => {
                const submissionCourseId =
                    submission?.assessments?.course_id;

                const traineeId =
                    submission?.trainee_id;

                if (
                    submissionCourseId === course.id &&
                    traineeId
                ) {
                    traineeIds.add(traineeId);
                }
            });

            return {
                id: course.id,

                courseId: course.id,

                name:
                    course.title ||
                    "Untitled Course",

                code:
                    course.code ||
                    "",

                qualificationLevel:
                    course.qualification_level ||
                    "",

                assessmentCount:
                    courseAssessments.length,

                traineesWithResults:
                    traineeIds.size,
            };
        });
    }, [
        courses,
        assessments,
        results,
    ]);

    // =============================================================
    // SEARCH COURSES
    // =============================================================
    const filteredCourses = useMemo(() => {
        const search =
            searchTerm
                .trim()
                .toLowerCase();

        return courseResults.filter(
            (course) => {
                const matchesSearch =
                    !search ||
                    course.name
                        .toLowerCase()
                        .includes(search) ||
                    course.code
                        .toLowerCase()
                        .includes(search);

                return matchesSearch;
            }
        );
    }, [
        courseResults,
        searchTerm,
    ]);

    // =============================================================
    // VIEW BATCHES
    //
    // Results Monitoring -> Batches
    // =============================================================
    const handleViewBatches = (course) => {
        navigate(
            `/admin/results/batches/${course.code}`,
            {
                state: {
                    courseName:
                        course.name,

                    courseCode:
                        course.code,

                    qualificationLevel:
                        course.qualificationLevel,
                },
            }
        );
    };

    return (
        <div className="results-page">
            <DashboardPageHeader
                title="Results Monitoring"
                subtitle="Track assessment performance, completion outcomes, and trainee results."
            />

            <div className="results-container">

                {/* =====================================================
                    SEARCH
                ====================================================== */}
                <div className="mb-6">
                    <label className="relative block w-full md:max-w-md">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search course..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                        />
                    </label>
                </div>

                {/* =====================================================
                    ERROR MESSAGE
                ====================================================== */}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    RESULTS MONITORING TABLE
                ====================================================== */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">

                            {/* =================================================
                                TABLE HEADER
                            ================================================== */}
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>

                                    {/* Course */}
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Course
                                    </th>

                                    {/* Number of Assessments */}
                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        No. of Assessments
                                    </th>

                                    {/* Trainees with Results */}
                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Trainees with Results
                                    </th>

                                    {/* Action */}
                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            {/* =================================================
                                TABLE BODY
                            ================================================== */}
                            <tbody>

                                {/* Loading */}
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            Loading courses...
                                        </td>
                                    </tr>
                                ) : filteredCourses.length === 0 ? (
                                    /* Empty State */
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            No courses found.
                                        </td>
                                    </tr>
                                ) : (
                                    /* Course Rows */
                                    filteredCourses.map(
                                        (course) => (
                                            <tr
                                                key={course.id}
                                                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                            >

                                                {/* Course */}
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-gray-800">
                                                        {
                                                            course.name
                                                        }
                                                    </div>

                                                    {course.code && (
                                                        <div className="mt-1 text-xs text-gray-400">
                                                            {
                                                                course.code
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Number of Assessments */}
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-semibold text-gray-700">
                                                        {
                                                            course.assessmentCount
                                                        }
                                                    </span>
                                                </td>

                                                {/* Trainees with Results */}
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-semibold text-gray-700">
                                                        {
                                                            course.traineesWithResults
                                                        }
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewBatches(
                                                                course
                                                            )
                                                        }
                                                        className="rounded-lg bg-[#002f86] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001f5c]"
                                                    >
                                                        View Batches
                                                    </button>
                                                </td>

                                            </tr>
                                        )
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
