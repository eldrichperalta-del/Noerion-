import { useEffect, useMemo, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import DashboardPageHeader from "../../../components/common/DashboardPageHeader";
import { supabase } from "../../../supabaseClient";

import "../../../styles/ResultsMonitoring.css";

export default function Batches() {
    const { courseCode } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [batches, setBatches] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");

    const [assessmentTypeFilter, setAssessmentTypeFilter] =
        useState("");

    // ============================================================
    // LOAD COURSE + BATCHES
    // ============================================================

    useEffect(() => {
        if (!courseCode) {
            setError("Course code is missing.");
            setLoading(false);
            return;
        }

        loadBatches();
    }, [courseCode]);

    const loadBatches = async () => {
        setLoading(true);
        setError("");

        try {
            // ========================================================
            // 1. LOAD COURSE USING COURSE CODE
            //
            // The URL contains the course code instead of the UUID.
            // We still retrieve the UUID because assessments.course_id
            // uses the actual courses.id relationship.
            // ========================================================

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
                .eq("code", courseCode)
                .maybeSingle();

            if (courseError) {
                throw courseError;
            }

            if (!courseData) {
                throw new Error("Course not found.");
            }

            setCourse(courseData);

            const databaseCourseId = courseData.id;

            // ========================================================
            // 2. LOAD ASSESSMENTS FOR THIS COURSE
            // ========================================================

            const {
                data: assessmentData,
                error: assessmentError,
            } = await supabase
                .from("assessments")
                .select(`
                    id,
                    course_id,
                    title,
                    set_type,
                    total_items,
                    time_limit_minutes,
                    is_active,
                    created_at,
                    status
                `)
                .eq("course_id", databaseCourseId)
                .order("created_at", {
                    ascending: false,
                });

            if (assessmentError) {
                throw assessmentError;
            }

            const assessments = assessmentData || [];

            // ========================================================
            // 3. GET ASSESSMENT IDS
            // ========================================================

            const assessmentIds = assessments
                .map(
                    (assessment) =>
                        assessment.id
                )
                .filter(Boolean);

            // ========================================================
            // 4. LOAD ASSESSMENT BATCHES
            // ========================================================

            let batchData = [];

            if (assessmentIds.length > 0) {
                const {
                    data,
                    error: batchError,
                } = await supabase
                    .from("assessment_batches")
                    .select(`
                        id,
                        assessment_id,
                        assessor_id,
                        assessment_name,
                        qualification,
                        assessment_type,
                        assessment_date,
                        start_time,
                        end_time,
                        duration,
                        instructions,
                        status,
                        created_at,
                        batch_code,
                        batch_type
                    `)
                    .in(
                        "assessment_id",
                        assessmentIds
                    )
                    .order("created_at", {
                        ascending: false,
                    });

                if (batchError) {
                    throw batchError;
                }

                batchData = data || [];
            }

            // ========================================================
            // 5. CREATE BATCH MAP
            // ========================================================

            const batchMap = new Map();

            batchData.forEach((batch) => {
                if (
                    batch?.assessment_id &&
                    !batchMap.has(
                        String(batch.assessment_id)
                    )
                ) {
                    batchMap.set(
                        String(batch.assessment_id),
                        batch
                    );
                }
            });

            // ========================================================
            // 6. FORMAT DATA
            // ========================================================

            const formattedBatches =
                assessments.map(
                    (assessment) => {
                        const batch =
                            batchMap.get(
                                String(assessment.id)
                            );

                        return {
                            id:
                                assessment.id,

                            assessment:
                                assessment.title ||
                                batch?.assessment_name ||
                                "Untitled Assessment",

                            qualification:
                                batch?.qualification ||
                                courseData.qualification_level ||
                                "—",

                            assessmentType:
                                assessment.set_type ||
                                batch?.assessment_type ||
                                "—",

                            totalQuestions:
                                assessment.total_items ??
                                0,

                            timeLimit:
                                assessment.time_limit_minutes ??
                                null,

                            status:
                                assessment.status ||
                                "",

                            isActive:
                                assessment.is_active,

                            createdAt:
                                assessment.created_at,
                        };
                    }
                );

            setBatches(formattedBatches);

        } catch (err) {
            console.error(
                "Batches page error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load assessment batches."
            );

            setCourse(null);
            setBatches([]);

        } finally {
            setLoading(false);
        }
    };

    // =============================================================
    // SEARCH + ASSESSMENT TYPE FILTER
    // =============================================================

    const filteredBatches = useMemo(() => {
        const search =
            searchTerm
                .trim()
                .toLowerCase();

        return batches.filter(
            (batch) => {
                const matchesSearch =
                    !search ||
                    String(
                        batch.assessment || ""
                    )
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        batch.qualification || ""
                    )
                        .toLowerCase()
                        .includes(search);

                const matchesAssessmentType =
                    !assessmentTypeFilter ||
                    batch.assessmentType ===
                    assessmentTypeFilter;

                return (
                    matchesSearch &&
                    matchesAssessmentType
                );
            }
        );
    }, [
        batches,
        searchTerm,
        assessmentTypeFilter,
    ]);

    // =============================================================
    // VIEW RESULTS
    // =============================================================

    const handleViewResults = (
        batch
    ) => {
        navigate(
            `/admin/results/course/${courseCode}`,
            {
                state: {
                    courseCode:
                        courseCode,

                    courseName:
                        course?.title ||
                        "Course Results",

                    assessmentId:
                        batch.id,

                    assessmentName:
                        batch.assessment,
                },
            }
        );
    };

    // =============================================================
    // BACK
    // =============================================================

    const handleBack = () => {
        navigate(
            "/admin/results"
        );
    };

    // =============================================================
    // PAGE
    // =============================================================

    return (
        <div className="results-page">

            {/* ====================================================
                BREADCRUMB
            ===================================================== */}

            <nav className="-mt-5 mb-4 flex items-center gap-2 text-sm font-semibold">

                <button
                    type="button"
                    onClick={handleBack}
                    className="text-gray-500 transition hover:text-[#002f86] hover:underline"
                >
                    Results Monitoring
                </button>

                <span className="text-gray-400">
                    &gt;
                </span>

                <span className="text-[#002f86]">
                    Assessment Batches
                </span>

            </nav>

            {/* ====================================================
                HEADER
            ===================================================== */}

            <DashboardPageHeader
                title="Assessment Batches"
                subtitle={
                    course?.title
                        ? `View assessment batches for ${course.title}.`
                        : "View assessment batches for this course."
                }
            />

            {/* ====================================================
                CONTENT
            ===================================================== */}

            <div className="results-container">

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* ==================================================
                    SEARCH & FILTER CONTROLS
                ================================================== */}

                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="relative w-full sm:w-72">

                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">

                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />

                            </svg>

                        </span>

                        <input
                            type="text"
                            placeholder="Search assessment or qualification..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
                        />

                    </div>

                    <div className="w-full sm:w-48">

                        <select
                            value={
                                assessmentTypeFilter
                            }
                            onChange={(e) =>
                                setAssessmentTypeFilter(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
                        >

                            <option value="">
                                All Types
                            </option>

                            <option value="Set A">
                                Set A
                            </option>

                            <option value="Set B">
                                Set B
                            </option>

                            <option value="Set C">
                                Set C
                            </option>

                        </select>

                    </div>

                </div>

                {/* ==================================================
                    TABLE
                ================================================== */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1000px]">

                            {/* ==========================================
                                HEADER
                            =========================================== */}

                            <thead className="border-b border-gray-200 bg-gray-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Assessment
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Qualification
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Assessment Type
                                    </th>

                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Total Questions
                                    </th>

                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Time Limit
                                    </th>

                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            {/* ==========================================
                                BODY
                            =========================================== */}

                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            Loading batches...
                                        </td>

                                    </tr>

                                ) : filteredBatches.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            No assessment batches found for this course.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredBatches.map(
                                        (batch) => (

                                            <tr
                                                key={
                                                    batch.id
                                                }
                                                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                                            >

                                                {/* ==================================
                                                    ASSESSMENT
                                                =================================== */}

                                                <td className="px-6 py-5">

                                                    <div className="font-semibold text-gray-800">
                                                        {
                                                            batch.assessment
                                                        }
                                                    </div>

                                                </td>

                                                {/* ==================================
                                                    QUALIFICATION
                                                =================================== */}

                                                <td className="px-6 py-5">

                                                    <div className="text-sm text-gray-700">
                                                        {
                                                            batch.qualification
                                                        }
                                                    </div>

                                                </td>

                                                {/* ==================================
                                                    ASSESSMENT TYPE
                                                =================================== */}

                                                <td className="px-6 py-5">

                                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#002f86]">
                                                        {
                                                            batch.assessmentType
                                                        }
                                                    </span>

                                                </td>

                                                {/* ==================================
                                                    TOTAL QUESTIONS
                                                =================================== */}

                                                <td className="px-6 py-5 text-center">

                                                    <span className="font-semibold text-gray-700">
                                                        {
                                                            batch.totalQuestions
                                                        }
                                                    </span>

                                                </td>

                                                {/* ==================================
                                                    TIME LIMIT
                                                =================================== */}

                                                <td className="px-6 py-5 text-center">

                                                    <span className="text-sm font-medium text-gray-700">

                                                        {batch.timeLimit
                                                            ? `${batch.timeLimit} min`
                                                            : "—"}

                                                    </span>

                                                </td>

                                                {/* ==================================
                                                    ACTION
                                                =================================== */}

                                                <td className="px-6 py-5 text-center">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewResults(
                                                                batch
                                                            )
                                                        }
                                                        className="rounded-lg bg-[#002f86] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001f5c]"
                                                    >
                                                        View Results
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

