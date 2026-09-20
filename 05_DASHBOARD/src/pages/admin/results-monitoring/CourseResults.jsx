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
    const { courseCode } = useParams();

    const location = useLocation();
    const navigate = useNavigate();

    // =============================================================
    // NAVIGATION DATA
    //
    // The URL now uses courseCode instead of the database UUID.
    //
    // Example:
    // /admin/results/course/CSS-NC2
    //
    // The actual database course ID is resolved internally from
    // the courses table.
    //
    // Batches.jsx may pass:
    // - courseCode
    // - courseId
    // - courseName
    // - assessmentId
    // - assessmentName
    //
    // courseId is only used internally when passed through state.
    // It is NOT exposed in the URL.
    // =============================================================

    const selectedAssessmentId =
        location.state?.assessmentId ||
        "";

    const [databaseCourseId, setDatabaseCourseId] =
        useState(
            location.state?.courseId ||
            ""
        );

    const [courseName, setCourseName] =
        useState(
            location.state?.courseName ||
            "Course Results"
        );

    const [assessmentName, setAssessmentName] =
        useState(
            location.state?.assessmentName ||
            ""
        );

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

    // =============================================================
    // FETCH COURSE INFORMATION
    //
    // IMPORTANT:
    // The URL contains the course CODE.
    //
    // We use that code to find the real database UUID.
    // =============================================================
    useEffect(() => {
        if (!courseCode) {
            setError("Course code is missing.");
            setLoading(false);
            return;
        }

        const fetchCourseInformation = async () => {
            try {
                setLoading(true);
                setError("");

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
                        "code",
                        courseCode
                    )
                    .maybeSingle();

                if (courseError) {
                    throw courseError;
                }

                if (!data) {
                    throw new Error(
                        "Course not found."
                    );
                }

                // Store the real database UUID internally.
                setDatabaseCourseId(
                    data.id
                );

                // Use the database course title for display.
                if (data.title) {
                    setCourseName(
                        data.title
                    );
                }
            } catch (err) {
                console.error(
                    "Course information error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to load course information."
                );

                setDatabaseCourseId("");
            } finally {
                setLoading(false);
            }
        };

        fetchCourseInformation();
    }, [courseCode]);

    // =============================================================
    // FETCH SELECTED ASSESSMENT INFORMATION
    //
    // This makes sure the assessment name is still available when
    // the page is refreshed.
    // =============================================================
    useEffect(() => {
        if (!selectedAssessmentId) {
            return;
        }

        const fetchAssessmentInformation =
            async () => {
                try {
                    const {
                        data,
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
                            status
                        `)
                        .eq(
                            "id",
                            selectedAssessmentId
                        )
                        .maybeSingle();

                    if (assessmentError) {
                        throw assessmentError;
                    }

                    if (data) {
                        setAssessmentName(
                            data.title ||
                            data.set_type ||
                            ""
                        );
                    }
                } catch (err) {
                    console.error(
                        "Assessment information error:",
                        err
                    );
                }
            };

        fetchAssessmentInformation();
    }, [selectedAssessmentId]);

    // =============================================================
    // FETCH RESULTS
    // =============================================================
    useEffect(() => {
        if (!databaseCourseId) {
            setResults([]);

            // Do not stop the initial course lookup from displaying
            // its loading state. Once the course is resolved,
            // this effect will run again.
            return;
        }

        fetchResults();
    }, [
        databaseCourseId,
        selectedAssessmentId,
    ]);

    const fetchResults = async () => {
        setLoading(true);
        setError("");

        try {
            // =====================================================
            // BASE RESULTS QUERY
            // =====================================================
            let query = supabase
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
                        set_type,
                        total_items,
                        time_limit_minutes,
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
                );

            // =====================================================
            // IMPORTANT:
            //
            // If CourseResults was opened from Batches, an
            // assessmentId is available.
            //
            // In that case, only retrieve submissions belonging
            // to that specific assessment/batch.
            // =====================================================
            if (selectedAssessmentId) {
                query = query.eq(
                    "assessment_id",
                    selectedAssessmentId
                );
            }

            const {
                data: submissionData,
                error: submissionError,
            } = await query.order(
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

            // =====================================================
            // GET TRAINEE IDS
            // =====================================================
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

            // =====================================================
            // FETCH TRAINEE PROFILES
            // =====================================================
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

            // =====================================================
            // CREATE PROFILE LOOKUP MAP
            // =====================================================
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

            // =====================================================
            // FORMAT RESULTS
            // =====================================================
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

                        const traineeName = [
                            profile?.first_name,
                            profile?.middle_name,
                            profile?.last_name,
                            profile?.suffix,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim();

                        const finalResult =
                            normalizeResult(
                                submission?.overall_result,
                                submission?.passed
                            );

                        return {
                            resultId:
                                submission?.id,

                            submissionId:
                                submission?.id,

                            assessmentId:
                                submission?.assessment_id,

                            assessmentName:
                                submission
                                    ?.assessments
                                    ?.title ||
                                "",

                            assessmentType:
                                submission
                                    ?.assessments
                                    ?.set_type ||
                                "",

                            traineeId:
                                traineeId ||
                                "-",

                            traineeName:
                                traineeName ||
                                profile?.email ||
                                "Unnamed Trainee",

                            finalResult,

                            dateCompleted:
                                submission?.updated_at ||
                                submission?.submitted_at ||
                                submission?.created_at ||
                                null,

                            writtenScore:
                                submission?.total_score ??
                                null,

                            totalItems:
                                submission
                                    ?.assessments
                                    ?.total_items ??
                                null,

                            timeLimit:
                                submission
                                    ?.assessments
                                    ?.time_limit_minutes ??
                                null,

                            status:
                                submission?.status ||
                                "",

                            passed:
                                submission?.passed ??
                                null,

                            overallResult:
                                submission?.overall_result ??
                                null,

                            course:
                                courseName,

                            courseId:
                                databaseCourseId,

                            courseCode:
                                courseCode,

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

    // =============================================================
    // FILTER RESULTS
    // =============================================================
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

                let matchesDate =
                    true;

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
                            `${dateFilter}T00:00:00`
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

    // =============================================================
    // RESULTS OVERVIEW
    // =============================================================
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

    // =============================================================
    // COMPLETION RATE DATA
    // =============================================================
    const completionRateData =
        useMemo(() => {
            return [...results]
                .filter(
                    (result) =>
                        result?.dateCompleted
                )
                .sort(
                    (a, b) =>
                        new Date(
                            a.dateCompleted
                        ).getTime() -
                        new Date(
                            b.dateCompleted
                        ).getTime()
                )
                .map(
                    (
                        result,
                        index
                    ) => {
                        const date =
                            new Date(
                                result.dateCompleted
                            );

                        return {
                            date:
                                date.toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "short",
                                        day: "numeric",
                                    }
                                ),

                            rate:
                                result.finalResult ===
                                    "Pass"
                                    ? 100
                                    : result.finalResult ===
                                        "Fail"
                                        ? 0
                                        : null,

                            result:
                                result.finalResult,

                            trainee:
                                result.traineeName ||
                                `Result ${index + 1}`,
                        };
                    }
                )
                .filter(
                    (item) =>
                        item.rate !==
                        null
                );
        }, [results]);

    // =============================================================
    // CLEAR FILTERS
    // =============================================================
    const handleClearFilters =
        () => {
            setSearchTerm("");
            setResultFilter("");
            setDateFilter("");
        };

    // =============================================================
    // BACK TO BATCHES
    //
    // IMPORTANT:
    // The URL now uses courseCode instead of courseId.
    // =============================================================
    const handleBack = () => {
        if (selectedAssessmentId) {
            navigate(
                `/admin/results/batches/${courseCode}`,
                {
                    state: {
                        courseName:
                            courseName,

                        courseId:
                            databaseCourseId,

                        courseCode:
                            courseCode,
                    },
                }
            );

            return;
        }

        navigate(
            "/admin/results"
        );
    };

    return (
        <div className="results-page">

            {/* =====================================================
                BREADCRUMB
            ====================================================== */}
            <header>

                <nav className="-mt-5 flex items-center gap-2 text-sm font-semibold">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/results"
                            )
                        }
                        className="text-gray-500 hover:text-[#002f86] hover:underline"
                    >
                        Results Monitoring
                    </button>

                    <span className="text-gray-400">
                        &gt;
                    </span>

                    {selectedAssessmentId ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/admin/results/batches/${courseCode}`,
                                        {
                                            state: {
                                                courseName:
                                                    courseName,

                                                courseId:
                                                    databaseCourseId,

                                                courseCode:
                                                    courseCode,
                                            },
                                        }
                                    )
                                }
                                className="text-gray-500 hover:text-[#002f86] hover:underline"
                            >
                                Assessment Batches
                            </button>

                            <span className="text-gray-400">
                                &gt;
                            </span>

                            <span className="text-[#002f86]">
                                {assessmentName ||
                                    courseName}
                            </span>
                        </>
                    ) : (
                        <span className="text-[#002f86]">
                            {courseName}
                        </span>
                    )}

                </nav>

                {/* =================================================
                    PAGE TITLE
                ================================================== */}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {assessmentName ||
                                courseName}
                        </h1>

                        <p className="mt-2 text-gray-600">
                            {selectedAssessmentId
                                ? `View trainee results for ${assessmentName || "this assessment"}.`
                                : "View assessment performance, completion outcomes, and trainee results."}
                        </p>
                    </div>

                </div>
            </header>

            {/* =====================================================
                OVERVIEW CARDS
            ====================================================== */}
            <ResultsOverviewCards
                stats={overviewData}
                completionRateData={
                    completionRateData
                }
                loading={loading}
            />

            <div className="results-container">

                {/* =================================================
                    SEARCH + FILTERS
                ================================================== */}
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                    {/* Search */}
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
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Search by Name or ID..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.40)] outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                        />

                    </label>

                    {/* Filters */}
                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

                        {/* Result Filter */}
                        <select
                            value={
                                resultFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setResultFilter(
                                    event
                                        .target
                                        .value
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

                        {/* Date Filter */}
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
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.40)] outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
                            />

                        </label>

                        {/* Clear */}
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

                {/* =================================================
                    ERROR
                ================================================== */}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* =================================================
                    RESULTS TABLE
                ================================================== */}
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

// =============================================================
// NORMALIZE RESULT
// =============================================================
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