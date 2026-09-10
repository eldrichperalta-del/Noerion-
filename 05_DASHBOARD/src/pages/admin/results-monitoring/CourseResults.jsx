import { useEffect, useMemo, useState } from "react";
import {
    useLocation,
    useParams,
    useNavigate,
} from "react-router-dom";

import {
    Calendar,
    Search,
} from "lucide-react";

import { supabase } from "../../../supabaseClient";

import ResultsOverviewCards from "../../../components/admin/results-monitoring/ResultsOverviewCards";
import ResultsTable from "../../../components/admin/results-monitoring/ResultsTable";
import DashboardPageHeader from "../../../components/common/DashboardPageHeader";

import "../../../styles/ResultsMonitoring.css";

export default function CourseResults() {
    const { courseId } = useParams();

    const location = useLocation();
    const navigate = useNavigate();

    // ============================================================
    // COURSE INFORMATION
    // ============================================================

    const [courseName, setCourseName] =
        useState(
            location.state?.courseName ||
            "Course Results"
        );

    const databaseCourseId =
        location.state?.courseId ||
        courseId;

    // ============================================================
    // STATE
    // ============================================================

    const [results, setResults] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [searchTerm, setSearchTerm] =
        useState("");

    const [resultFilter, setResultFilter] =
        useState("");

    const [dateFilter, setDateFilter] =
        useState("");

    // ============================================================
    // LOAD COURSE NAME
    // ============================================================

    useEffect(() => {
        if (!databaseCourseId) {
            return;
        }

        const fetchCourse = async () => {
            try {
                const {
                    data,
                    error: courseError,
                } = await supabase
                    .from("courses")
                    .select(`
                        id,
                        code,
                        title
                     `)
                    .eq(
                        "id",
                        databaseCourseId
                    )
                    .maybeSingle();

                if (courseError) {
                    throw courseError;
                }

                if (data?.title) {
                    setCourseName(
                        data.title
                    );
                }
            } catch (err) {
                console.error(
                    "Course information error:",
                    err
                );
            }
        };

        fetchCourse();
    }, [databaseCourseId]);

    // ============================================================
    // LOAD RESULTS
    // ============================================================

    useEffect(() => {
        if (!databaseCourseId) {
            setResults([]);
            setLoading(false);
            return;
        }

        fetchResults();
    }, [databaseCourseId]);

    const fetchResults = async () => {
        setLoading(true);
        setError("");

        try {
            // ======================================================
            // 1. GET SUBMISSIONS FOR SELECTED COURSE
            // ======================================================

            const {
                data: submissionData,
                error: submissionError,
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

    assessments!inner(
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
                .eq(
                    "assessments.course_id",
                    databaseCourseId
                )
                .order(
                    "updated_at",
                    {
                        ascending: false,
                    }
                );

            if (submissionError) {
                throw submissionError;
            }

            const submissions =
                submissionData || [];

            // ======================================================
            // 2. GET UNIQUE TRAINEE IDS
            // ======================================================

            const traineeIds = [
                ...new Set(
                    submissions
                        .map(
                            (submission) =>
                                submission?.trainee_id
                        )
                        .filter(Boolean)
                ),
            ];

            // ======================================================
            // 3. LOAD TRAINEE PROFILES
            //
            // trainee_id points to profiles.id
            // ======================================================

            let profiles = [];

            if (traineeIds.length > 0) {
                const {
                    data: profileData,
                    error: profileError,
                } = await supabase
                    .from("profiles")
                    .select(`
id,
    first_name,
    middle_name,
    last_name,
    suffix,
    email
        `)
                    .in(
                        "id",
                        traineeIds
                    );

                if (profileError) {
                    throw profileError;
                }

                profiles =
                    profileData || [];
            }

            // ======================================================
            // 4. CREATE PROFILE MAP
            // ======================================================

            const profileMap =
                new Map(
                    profiles.map(
                        (profile) => [
                            String(
                                profile.id
                            ),
                            profile,
                        ]
                    )
                );

            // ======================================================
            // 5. FORMAT RESULTS
            // ======================================================

            const formattedResults =
                submissions.map(
                    (submission) => {
                        const traineeId =
                            submission?.trainee_id;

                        const profile =
                            profileMap.get(
                                String(
                                    traineeId
                                )
                            );

                        // ------------------------------------------
                        // BUILD FULL NAME
                        // ------------------------------------------

                        const traineeName = [
                            profile?.first_name,
                            profile?.middle_name,
                            profile?.last_name,
                            profile?.suffix,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim();

                        // ------------------------------------------
                        // FINAL RESULT
                        // ------------------------------------------

                        const finalResult =
                            normalizeResult(
                                submission?.overall_result,
                                submission?.passed
                            );

                        return {
                            // --------------------------------------
                            // IDs
                            // --------------------------------------

                            resultId:
                                submission?.id,

                            submissionId:
                                submission?.id,

                            assessmentId:
                                submission?.assessment_id,

                            // --------------------------------------
                            // TRAINEE
                            // --------------------------------------

                            traineeId:
                                traineeId || "-",

                            traineeName:
                                traineeName ||
                                profile?.email ||
                                "Unnamed Trainee",

                            // --------------------------------------
                            // RESULT
                            // --------------------------------------

                            finalResult,

                            // --------------------------------------
                            // DATE
                            // --------------------------------------

                            dateCompleted:
                                submission?.updated_at ||
                                submission?.submitted_at ||
                                submission?.created_at ||
                                null,

                            // --------------------------------------
                            // SCORE
                            // --------------------------------------

                            writtenScore:
                                submission?.total_score ??
                                null,

                            totalItems:
                                submission
                                    ?.assessments
                                    ?.total_items ??
                                null,

                            // --------------------------------------
                            // STATUS
                            // --------------------------------------

                            status:
                                submission?.status ||
                                "",

                            passed:
                                submission?.passed ??
                                null,

                            overallResult:
                                submission?.overall_result ??
                                null,

                            // --------------------------------------
                            // COURSE
                            //
                            // Keep for existing actions/components,
                            // but do NOT display as a table column.
                            // --------------------------------------

                            course:
                                courseName,

                            courseId:
                                databaseCourseId,

                            // --------------------------------------
                            // OPTIONAL AI DATA
                            // --------------------------------------

                            aiSummary:
                                submission?.ai_summary ||
                                submission?.aiSummary ||
                                "",
                        };
                    }
                );

            setResults(
                formattedResults
            );

        } catch (err) {
            console.error(
                "Course Results error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load course results."
            );

            setResults([]);

        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FILTER RESULTS
    // ============================================================

    const filteredResults = useMemo(() => {
        const search =
            searchTerm
                .trim()
                .toLowerCase();

        return results.filter(
            (result) => {
                const traineeName =
                    String(
                        result?.traineeName ||
                        ""
                    ).toLowerCase();

                const traineeId =
                    String(
                        result?.traineeId ||
                        ""
                    ).toLowerCase();

                const matchesSearch =
                    !search ||
                    traineeName.includes(
                        search
                    ) ||
                    traineeId.includes(
                        search
                    );

                const matchesResult =
                    !resultFilter ||
                    result.finalResult ===
                    resultFilter;

                let matchesDate = true;

                if (
                    dateFilter &&
                    result.dateCompleted
                ) {
                    const resultDate =
                        new Date(
                            result.dateCompleted
                        );

                    const selectedDate =
                        new Date(
                            `${dateFilter} T00:00:00`
                        );

                    matchesDate =
                        resultDate.getFullYear() ===
                        selectedDate.getFullYear() &&
                        resultDate.getMonth() ===
                        selectedDate.getMonth() &&
                        resultDate.getDate() ===
                        selectedDate.getDate();
                }

                return (
                    matchesSearch &&
                    matchesResult &&
                    matchesDate
                );
            }
        );
    }, [
        results,
        searchTerm,
        resultFilter,
        dateFilter,
    ]);

    // ============================================================
    // OVERVIEW
    // ============================================================

    const overviewData = useMemo(() => {
        const totalAssessments =
            results.length;

        const totalPassed =
            results.filter(
                (result) =>
                    result.finalResult ===
                    "Pass"
            ).length;

        const totalFailed =
            results.filter(
                (result) =>
                    result.finalResult ===
                    "Fail"
            ).length;

        const passRate =
            totalAssessments > 0
                ? Math.round(
                    (totalPassed /
                        totalAssessments) *
                    100
                )
                : 0;

        return {
            totalAssessments,
            totalPassed,
            totalFailed,
            passRate,
        };
    }, [results]);

    // ============================================================
    // CLEAR FILTERS
    // ============================================================

    const handleClearFilters = () => {
        setSearchTerm("");
        setResultFilter("");
        setDateFilter("");
    };

    // ============================================================
    // BACK
    // ============================================================

    const handleBack = () => {
        navigate(
            "/admin/results"
        );
    };

    return (
        <div className="results-page">

            <header>
                <nav className="-mt-5 flex items-center gap-2 text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin/results")
                        }
                        className="text-gray-500 hover:text-[#002f86] hover:underline"
                    >
                        Results Monitoring
                    </button>

                    <span className="text-gray-400">
                        &gt;
                    </span>

                    <span className="text-[#002f86]">
                        {courseName}
                    </span>
                </nav>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {courseName}
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View assessment performance, completion outcomes, and trainee results.
                        </p>
                    </div>
                </div>
            </header>

            {/* ==================================================
                SUMMARY
            =================================================== */}

            <ResultsOverviewCards
                stats={overviewData}
                loading={loading}
            />

            {/* ==================================================
                CONTENT
            =================================================== */}

            <div className="results-container">

                {/* ==================================================
                    FILTERS
                =================================================== */}

                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                    {/* SEARCH */}

                    <label className="relative w-full lg:max-w-md">

                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={
                                searchTerm
                            }
                            onChange={(
                                event
                            ) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search by Name or ID..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.40)] outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                        />

                    </label>

                    {/* RIGHT FILTERS */}

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

                        {/* RESULT */}

                        <select
                            value={
                                resultFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setResultFilter(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.40)] outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100 sm:w-56"
                        >

                            <option value="">
                                All Results
                            </option>

                            <option value="Pass">
                                Competent
                            </option>

                            <option value="Fail">
                                Not Yet Competent
                            </option>

                            <option value="In Evaluation">
                                In Evaluation
                            </option>

                        </select>

                        {/* DATE */}

                        <label className="relative w-full sm:w-56">

                            <Calendar
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="date"
                                value={
                                    dateFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDateFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.40)] outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                            />

                        </label>

                        {/* CLEAR */}

                        {(searchTerm ||
                            resultFilter ||
                            dateFilter) && (

                                <button
                                    type="button"
                                    onClick={
                                        handleClearFilters
                                    }
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.40)] transition hover:bg-gray-50"
                                >
                                    Clear
                                </button>

                            )}

                    </div>

                </div>

                {/* ==================================================
                    ERROR
                =================================================== */}

                {error && (

                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>

                )}

                {/* ==================================================
                    TRAINEE RESULTS TABLE
                =================================================== */}

                <ResultsTable
                    results={
                        filteredResults
                    }
                    loading={
                        loading
                    }
                    error={
                        error
                    }
                />

            </div>

        </div>
    );
}

// ============================================================
// RESULT NORMALIZATION
// ============================================================

function normalizeResult(
    result,
    passed
) {
    const normalized = String(
        result || ""
    )
        .trim()
        .toLowerCase();

    if (
        normalized === "pass" ||
        normalized === "passed" ||
        normalized === "competent" ||
        passed === true
    ) {
        return "Pass";
    }

    if (
        normalized === "fail" ||
        normalized === "failed" ||
        normalized === "not competent" ||
        normalized === "not yet competent" ||
        passed === false
    ) {
        return "Fail";
    }

    return "In Evaluation";
}

