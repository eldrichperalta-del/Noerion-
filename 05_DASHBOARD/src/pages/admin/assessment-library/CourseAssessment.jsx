import { useEffect, useMemo, useState } from "react";
import {
    Archive,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Copy,
    MoreVertical,
    RotateCcw,
    Search,
    Trash2,
    X,
} from "lucide-react";
import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import { supabase } from "../../../supabaseClient";

/* ============================================================
   HELPERS
   ============================================================ */

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatStatus = (value, isActive = false) => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();

    if (normalized === "active") {
        return "Active";
    }

    if (
        normalized === "archived" ||
        normalized === "archive"
    ) {
        return "Archived";
    }

    if (normalized === "completed") {
        return "Completed";
    }

    if (normalized === "draft") {
        return "Draft";
    }

    /*
     * If status is empty but is_active is true,
     * treat the assessment as Active.
     */
    if (isActive) {
        return "Active";
    }

    return "Draft";
};

const getStatusClasses = (status) => {
    switch (status) {
        case "Active":
            return "bg-green-100 text-green-700";

        case "Completed":
            return "bg-amber-100 text-amber-800";

        case "Archived":
            return "bg-gray-100 text-gray-700";

        case "Draft":
        default:
            return "bg-blue-100 text-blue-800";
    }
};

const getQualification = (course) => {
    if (course?.qualification_level) {
        return course.qualification_level;
    }

    const match = String(course?.title || "").match(
        /NC\s+(?:I{1,3}|IV)/i
    );

    return match
        ? match[0].toUpperCase()
        : "—";
};

/* ============================================================
   ACTION MENU ITEM
   ============================================================ */

function MenuItem({
    label,
    Icon,
    onClick,
    destructive = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${destructive
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50"
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                status
            )}`}
        >
            {status}
        </span>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function CourseAssessment() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const location = useLocation();

    /* ========================================================
       STATE
       ======================================================== */

    const [course, setCourse] = useState(null);

    const [assessments, setAssessments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [courseLoading, setCourseLoading] =
        useState(true);

    const [search, setSearch] = useState("");

    const [openMenu, setOpenMenu] = useState(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [duplicatingId, setDuplicatingId] =
        useState(null);

    const rowsPerPage = 5;

    /* ========================================================
       LOAD COURSE
       ======================================================== */

    const loadCourse = async () => {
        if (!courseId) {
            setCourse(null);
            setCourseLoading(false);
            return;
        }

        setCourseLoading(true);

        try {
            const {
                data,
                error,
            } = await supabase
                .from("courses")
                .select(
                    `
                    id,
                    code,
                    title,
                    qualification_level,
                    description,
                    created_at
                    `
                )
                .eq("id", courseId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            /*
             * The course must come from the courses table.
             */
            if (data) {
                setCourse(data);
                return;
            }

            /*
             * Fallback to navigation state if available.
             */
            if (location.state?.courseName) {
                setCourse({
                    id: courseId,
                    code:
                        location.state?.courseCode ||
                        "",
                    title:
                        location.state?.courseName ||
                        "Course Assessments",
                    qualification_level:
                        location.state
                            ?.qualificationLevel ||
                        "",
                });
            } else {
                setCourse(null);
            }
        } catch (error) {
            console.error(
                "Error loading course:",
                error
            );

            /*
             * Keep the page usable if navigation state
             * contains the course information.
             */
            if (location.state?.courseName) {
                setCourse({
                    id: courseId,
                    code:
                        location.state?.courseCode ||
                        "",
                    title:
                        location.state?.courseName ||
                        "Course Assessments",
                    qualification_level:
                        location.state
                            ?.qualificationLevel ||
                        "",
                });
            } else {
                setCourse(null);
            }
        } finally {
            setCourseLoading(false);
        }
    };

    /* ========================================================
       LOAD ASSESSMENTS
       
       IMPORTANT:
       
       This uses:
       
       assessments.course_id
                ↓
       courses.id
       
       NOT assessment_rows.
       ======================================================== */

    const loadAssessments = async () => {
        if (!courseId) {
            setAssessments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            const {
                data,
                error,
            } = await supabase
                .from("assessments")
                .select(
                    `
                    id,
                    course_id,
                    title,
                    set_type,
                    total_items,
                    time_limit_minutes,
                    is_active,
                    status,
                    created_at
                    `
                )
                .eq("course_id", courseId)
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                throw error;
            }

            const formatted =
                (data || []).map(
                    (assessment) => {
                        const status =
                            formatStatus(
                                assessment.status,
                                assessment.is_active
                            );

                        return {
                            id: assessment.id,

                            courseId:
                                assessment.course_id,

                            title:
                                assessment.title ||
                                "Untitled Assessment",

                            type:
                                assessment.set_type ||
                                "Written",

                            questions:
                                Number(
                                    assessment.total_items
                                ) || 0,

                            timeLimit:
                                assessment
                                    .time_limit_minutes
                                    ? `${assessment.time_limit_minutes} minutes`
                                    : "N/A",

                            status,

                            isActive:
                                Boolean(
                                    assessment.is_active
                                ),

                            createdAt:
                                assessment.created_at,

                            updated:
                                formatDate(
                                    assessment.created_at
                                ),

                            raw: assessment,
                        };
                    }
                );

            setAssessments(formatted);
        } catch (error) {
            console.error(
                "Error loading course assessments:",
                error
            );

            setAssessments([]);

            setErrorMessage(
                error?.message ||
                "Unable to load assessments for this course."
            );
        } finally {
            setLoading(false);
        }
    };

    /* ========================================================
       INITIAL LOAD
       ======================================================== */

    useEffect(() => {
        loadCourse();
        loadAssessments();
    }, [courseId]);


    /* ========================================================
       SEARCH
       ======================================================== */

    const filteredAssessments = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return assessments;
        }

        return assessments.filter(
            (assessment) =>
                assessment.title
                    .toLowerCase()
                    .includes(query) ||
                assessment.type
                    .toLowerCase()
                    .includes(query) ||
                assessment.status
                    .toLowerCase()
                    .includes(query)
        );
    }, [assessments, search]);


    /* ========================================================
       PAGINATION
       ======================================================== */

    const totalPages =
        Math.max(
            Math.ceil(
                filteredAssessments.length /
                rowsPerPage
            ),
            1
        );

    const startIndex =
        (currentPage - 1) *
        rowsPerPage;

    const endIndex =
        startIndex +
        rowsPerPage;

    const paginatedAssessments =
        filteredAssessments.slice(
            startIndex,
            endIndex
        );

    const showingStart =
        filteredAssessments.length === 0
            ? 0
            : startIndex + 1;

    const showingEnd =
        Math.min(
            endIndex,
            filteredAssessments.length
        );

    /* ========================================================
       CLOSE MENU
       ======================================================== */

    const closeMenu = () => {
        setOpenMenu(null);
    };

    /* ========================================================
       const filteredAssessments
       ======================================================== */

    const handleViewAssessment = (
        assessmentId
    ) => {
        closeMenu();

        navigate(
            `/admin/assessments/${assessmentId}`
        );
    };

    /* ========================================================
       CHANGE STATUS
       ======================================================== */

    const changeStatus = async (
        assessmentId,
        nextStatus
    ) => {
        try {
            const isActive =
                nextStatus === "Active";

            const {
                error,
            } = await supabase
                .from("assessments")
                .update({
                    status: nextStatus,
                    is_active: isActive,
                })
                .eq("id", assessmentId);

            if (error) {
                throw error;
            }

            setAssessments(
                (current) =>
                    current.map(
                        (assessment) =>
                            assessment.id ===
                                assessmentId
                                ? {
                                    ...assessment,

                                    status:
                                        formatStatus(
                                            nextStatus,
                                            isActive
                                        ),

                                    isActive,

                                    updated:
                                        formatDate(
                                            new Date()
                                        ),
                                }
                                : assessment
                    )
            );
        } catch (error) {
            console.error(
                "Unable to update assessment status:",
                error
            );

            alert(
                `Unable to update assessment status: ${error?.message ||
                "Unknown error"
                }`
            );
        } finally {
            closeMenu();
        }
    };

    const duplicateAssessment = async (assessment) => {
        try {
            const source = assessment.raw || {};
            const originalAssessmentId = assessment.id;

            /*
             * ========================================================
             * 1. DETERMINE THE BASE TITLE
             * ========================================================
             *
             * Examples:
             *
             * Assessment
             * Assessment - Copy 1
             * Assessment - Copy 2
             *
             * All of these use:
             *
             * Assessment
             *
             * as the base title.
             */
            const baseTitle = assessment.title
                .replace(
                    /(?:\s*-\s*Copy(?:\s+\d+)?)+$/i,
                    ""
                )
                .trim();

            /*
             * ========================================================
             * 2. FIND THE NEXT COPY NUMBER
             * ========================================================
             */
            const escapedBaseTitle = baseTitle.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const copyPattern = new RegExp(
                `^${escapedBaseTitle}\\s+-\\s+Copy\\s+(\\d+)$`,
                "i"
            );

            const existingCopyNumbers = assessments
                .map((item) => {
                    const match = item.title.match(copyPattern);

                    return match
                        ? Number(match[1])
                        : null;
                })
                .filter((number) =>
                    Number.isInteger(number)
                );

            const nextCopyNumber =
                existingCopyNumbers.length > 0
                    ? Math.max(
                        ...existingCopyNumbers
                    ) + 1
                    : 1;

            const newTitle =
                `${baseTitle} - Copy ${nextCopyNumber}`;

            /*
             * ========================================================
             * 3. CREATE THE NEW ASSESSMENT
             * ========================================================
             */
            const {
                data: newAssessment,
                error: assessmentError,
            } = await supabase
                .from("assessments")
                .insert({
                    course_id:
                        source.course_id ||
                        courseId,

                    title: newTitle,

                    set_type:
                        source.set_type ||
                        "Written",

                    total_items:
                        Number(source.total_items) || 0,

                    time_limit_minutes:
                        Number(
                            source.time_limit_minutes
                        ) || 30,

                    is_active: false,

                    status: "Draft",
                })
                .select()
                .single();

            if (assessmentError) {
                throw assessmentError;
            }

            if (!newAssessment?.id) {
                throw new Error(
                    "The duplicate assessment was created, but its ID could not be retrieved."
                );
            }

            const newAssessmentId = newAssessment.id;

            /*
             * ========================================================
             * 4. GET ORIGINAL QUESTIONS
             * ========================================================
             */
            const {
                data: originalQuestions,
                error: questionsFetchError,
            } = await supabase
                .from("questions")
                .select(`
                id,
                item_number,
                test_section,
                question_text,
                column_b_match,
                question_type,
                max_points,
                cognitive_level,
                tesda_difficulty
            `)
                .eq(
                    "assessment_id",
                    originalAssessmentId
                )
                .order("item_number", {
                    ascending: true,
                });

            if (questionsFetchError) {
                throw questionsFetchError;
            }

            /*
             * ========================================================
             * 5. COPY EACH QUESTION
             * ========================================================
             *
             * We create a NEW question ID.
             *
             * Original:
             * question.id = OLD_ID
             *
             * Duplicate:
             * question.id = NEW_ID
             *
             * This is important because question_options and
             * answer_keys reference question_id.
             */
            if (
                originalQuestions &&
                originalQuestions.length > 0
            ) {
                for (const originalQuestion of originalQuestions) {
                    /*
                     * ------------------------------------------------
                     * CREATE NEW QUESTION
                     * ------------------------------------------------
                     */
                    const {
                        data: newQuestion,
                        error: questionInsertError,
                    } = await supabase
                        .from("questions")
                        .insert({
                            assessment_id:
                                newAssessmentId,

                            item_number:
                                originalQuestion.item_number,

                            test_section:
                                originalQuestion.test_section,

                            question_text:
                                originalQuestion.question_text,

                            column_b_match:
                                originalQuestion.column_b_match,

                            question_type:
                                originalQuestion.question_type,

                            max_points:
                                originalQuestion.max_points,

                            cognitive_level:
                                originalQuestion.cognitive_level,

                            tesda_difficulty:
                                originalQuestion.tesda_difficulty,
                        })
                        .select()
                        .single();

                    if (questionInsertError) {
                        throw questionInsertError;
                    }

                    if (!newQuestion?.id) {
                        throw new Error(
                            `Could not create the duplicated question for item ${originalQuestion.item_number}.`
                        );
                    }

                    const newQuestionId = newQuestion.id;

                    /*
                     * ------------------------------------------------
                     * GET ORIGINAL OPTIONS
                     * ------------------------------------------------
                     */
                    const {
                        data: originalOptions,
                        error: optionsFetchError,
                    } = await supabase
                        .from("question_options")
                        .select(`
                        option_letter,
                        option_text
                    `)
                        .eq(
                            "question_id",
                            originalQuestion.id
                        )
                        .order("option_letter", {
                            ascending: true,
                        });

                    if (optionsFetchError) {
                        throw optionsFetchError;
                    }

                    /*
                     * ------------------------------------------------
                     * COPY OPTIONS
                     * ------------------------------------------------
                     */
                    if (
                        originalOptions &&
                        originalOptions.length > 0
                    ) {
                        const copiedOptions =
                            originalOptions.map(
                                (option) => ({
                                    question_id:
                                        newQuestionId,

                                    option_letter:
                                        option.option_letter,

                                    option_text:
                                        option.option_text,
                                })
                            );

                        const {
                            error: optionsInsertError,
                        } = await supabase
                            .from("question_options")
                            .insert(copiedOptions);

                        if (optionsInsertError) {
                            throw optionsInsertError;
                        }
                    }

                    /*
                     * ------------------------------------------------
                     * GET ORIGINAL ANSWER KEY
                     * ------------------------------------------------
                     */
                    const {
                        data: originalAnswerKey,
                        error: answerKeyFetchError,
                    } = await supabase
                        .from("answer_keys")
                        .select(`
                        correct_answer,
                        explanation
                    `)
                        .eq(
                            "question_id",
                            originalQuestion.id
                        )
                        .maybeSingle();

                    if (answerKeyFetchError) {
                        throw answerKeyFetchError;
                    }

                    /*
                     * ------------------------------------------------
                     * COPY ANSWER KEY
                     * ------------------------------------------------
                     */
                    if (originalAnswerKey) {
                        const {
                            error: answerKeyInsertError,
                        } = await supabase
                            .from("answer_keys")
                            .insert({
                                question_id:
                                    newQuestionId,

                                correct_answer:
                                    originalAnswerKey.correct_answer,

                                explanation:
                                    originalAnswerKey.explanation,
                            });

                        if (answerKeyInsertError) {
                            throw answerKeyInsertError;
                        }
                    }
                }
            }

            /*
             * ========================================================
             * 6. RELOAD ASSESSMENT LIST
             * ========================================================
             */
            await loadAssessments();

            /*
             * ========================================================
             * 7. SUCCESS
             * ========================================================
             */
            await loadAssessments();
            closeMenu();
        } catch (error) {
            console.error(
                "Error duplicating assessment:",
                error
            );

            alert(
                `Error duplicating assessment: ${error?.message ||
                "Unknown error"
                }`
            );
        } finally {
            closeMenu();
        }
    };
    /* ========================================================
       DELETE ASSESSMENT
       ======================================================== */

    const removeAssessment = async (
        assessmentId
    ) => {
        if (!assessmentId) {
            console.error(
                "Delete failed: assessment ID is missing."
            );

            return;
        }

        try {
            /*
             * ----------------------------------------------------
             * DELETE FROM SUPABASE
             *
             * .select("id") makes Supabase return the deleted row.
             * This lets us verify that the database actually
             * deleted something.
             * ----------------------------------------------------
             */

            const {
                data: deletedAssessment,
                error,
            } = await supabase
                .from("assessments")
                .delete()
                .eq("id", assessmentId)
                .select("id")
                .maybeSingle();

            if (error) {
                throw error;
            }

            /*
             * ----------------------------------------------------
             * VERIFY DATABASE DELETE
             *
             * If no row was returned, the assessment was not
             * actually deleted from the database.
             * ----------------------------------------------------
             */

            if (!deletedAssessment) {
                throw new Error(
                    "The assessment could not be deleted from the database. Check your Supabase DELETE policy (RLS)."
                );
            }

            /*
             * ----------------------------------------------------
             * REMOVE FROM LOCAL STATE ONLY AFTER DATABASE DELETE
             * HAS BEEN CONFIRMED.
             * ----------------------------------------------------
             */

            setAssessments(
                (current) =>
                    current.filter(
                        (assessment) =>
                            assessment.id !==
                            assessmentId
                    )
            );

            /*
             * Close modal after successful deletion.
             */

            setDeleteTarget(null);

        } catch (error) {

            console.error(
                "Error deleting assessment:",
                error
            );

            alert(
                `Unable to delete assessment: ${error?.message ||
                "Unknown error"
                } `
            );

        } finally {

            closeMenu();

        }
    };



    /* ========================================================
       ACTION MENU
       ======================================================== */

    const renderActions = (assessment) => {
        const isOpen =
            openMenu === assessment.id;

        return (
            <div className="relative inline-block">
                <button
                    type="button"
                    onClick={() =>
                        setOpenMenu(
                            isOpen
                                ? null
                                : assessment.id
                        )
                    }
                    aria-label={`Actions for ${assessment.title}`}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                    <MoreVertical size={20} />
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                        <MenuItem
                            label="View Assessment"
                            Icon={Search}
                            onClick={() =>
                                handleViewAssessment(
                                    assessment.id
                                )
                            }
                        />

                        <MenuItem
                            label={
                                duplicatingId === assessment.id
                                    ? "Duplicating..."
                                    : "Duplicate"
                            }
                            Icon={Copy}
                            onClick={() =>
                                duplicateAssessment(assessment)
                            }
                        />

                        {assessment.status ===
                            "Archived" ? (
                            <MenuItem
                                label="Restore"
                                Icon={RotateCcw}
                                onClick={() =>
                                    changeStatus(
                                        assessment.id,
                                        "Active"
                                    )
                                }
                            />
                        ) : (
                            <MenuItem
                                label="Archive"
                                Icon={Archive}
                                onClick={() =>
                                    changeStatus(
                                        assessment.id,
                                        "Archived"
                                    )
                                }
                            />
                        )}

                        <MenuItem
                            label="Delete"
                            Icon={Trash2}
                            destructive
                            onClick={() => {
                                setDeleteTarget(assessment);
                                closeMenu();
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    /* ========================================================
       LOADING COURSE
       ======================================================== */

    if (courseLoading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                Loading course...
            </div>
        );
    }

    /* ========================================================
       COURSE NOT FOUND
       ======================================================== */

    if (!course) {
        return (
            <div className="space-y-6">
                <nav className="flex items-center gap-2 text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/assessments"
                            )
                        }
                        className="text-gray-500 hover:text-[#002f86] hover:underline"
                    >
                        Assessment Library
                    </button>

                    <span className="text-gray-400">
                        &gt;
                    </span>

                    <span className="text-[#002f86]">
                        Course
                    </span>
                </nav>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                    <p className="font-semibold text-red-700">
                        Course not found.
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                        The selected course could not
                        be found in the courses table.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/assessments"
                            )
                        }
                        className="mt-5 rounded-lg bg-[#002f86] px-5 py-2.5 font-semibold text-white hover:bg-[#001f59]"
                    >
                        Back to Assessment Library
                    </button>
                </div>
            </div>
        );
    }

    /* ========================================================
       PAGE
       ======================================================== */

    return (
        <div className="space-y-6">
            {/* ====================================================
                HEADER
            ==================================================== */}

            <header>
                <nav className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/assessments"
                            )
                        }
                        className="text-gray-500 hover:text-[#002f86] hover:underline"
                    >
                        Assessment Library
                    </button>

                    <span className="text-gray-400">
                        &gt;
                    </span>

                    <span className="text-[#002f86]">
                        {course.title}
                    </span>
                </nav>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {course.title}
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Manage reusable assessment
                            templates for this course.
                        </p>
                    </div>

                </div>
            </header>

            {/* ====================================================
                SEARCH
            ==================================================== */}

            <div className="relative max-w-xl">
                <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                    placeholder="Search assessments..."
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-[#002f86]/10"
                />
            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* ====================================================
                TABLE
            ==================================================== */}

            <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left">
                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Assessment
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Qualification
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Assessment Type
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Total Questions
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Time Limit
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Last Updated
                                </th>

                                <th className="px-5 py-4 text-sm font-semibold text-gray-600">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* LOADING */}

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center text-gray-500"
                                    >
                                        Loading assessments...
                                    </td>
                                </tr>
                            ) : filteredAssessments.length ===
                                0 ? (
                                /* EMPTY */

                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="mb-3 rounded-full bg-gray-100 p-3">
                                                <Search
                                                    size={
                                                        22
                                                    }
                                                    className="text-gray-400"
                                                />
                                            </div>

                                            <p className="font-semibold text-gray-700">
                                                {search
                                                    ? "No assessments found"
                                                    : "No assessments yet"}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {search
                                                    ? "Try a different search term."
                                                    : "There are no assessment templates for this course."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                /* DATA */

                                paginatedAssessments.map(
                                    (assessment) => (
                                        <tr
                                            key={
                                                assessment.id
                                            }
                                            className="border-b border-gray-100 transition hover:bg-gray-50"
                                        >
                                            {/* ASSESSMENT */}

                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleViewAssessment(
                                                            assessment.id
                                                        )
                                                    }
                                                    className="text-left font-semibold text-gray-900 hover:text-[#002f86] hover:underline"
                                                >
                                                    {
                                                        assessment.title
                                                    }
                                                </button>
                                            </td>

                                            {/* QUALIFICATION */}

                                            <td className="px-5 py-4 text-gray-700">
                                                {getQualification(
                                                    course
                                                )}
                                            </td>

                                            {/* TYPE */}

                                            <td className="px-5 py-4 text-gray-700">
                                                {
                                                    assessment.type
                                                }
                                            </td>

                                            {/* QUESTIONS */}

                                            <td className="px-5 py-4 text-gray-700">
                                                {
                                                    assessment.questions
                                                }
                                            </td>

                                            {/* TIME */}

                                            <td className="px-5 py-4 text-gray-700">
                                                {
                                                    assessment.timeLimit
                                                }
                                            </td>

                                            {/* UPDATED */}

                                            <td className="px-5 py-4 text-gray-700">
                                                {
                                                    assessment.updated
                                                }
                                            </td>

                                            {/* STATUS */}

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        assessment.status
                                                    }
                                                />
                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-5 py-4 text-center">
                                                {renderActions(
                                                    assessment
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
                {/* ====================================================
    PAGINATION
==================================================== */}

                {!loading &&
                    filteredAssessments.length > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

                            <p className="font-medium text-gray-700">

                                Showing {showingStart}-
                                {showingEnd} of{" "}
                                {filteredAssessments.length}{" "}
                                assessments

                            </p>

                            <div className="flex items-center gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.max(
                                                    page - 1,
                                                    1
                                                )
                                        )
                                    }
                                    disabled={
                                        currentPage === 1
                                    }
                                    className="flex items-center gap-1 text-gray-500 transition hover:text-[#002f86] disabled:cursor-not-allowed disabled:opacity-40"
                                >

                                    <ChevronLeft
                                        size={16}
                                    />

                                    Prev

                                </button>

                                <span className="rounded-lg border border-gray-200 px-3 py-2 font-semibold text-[#002f86] shadow-sm">

                                    {currentPage}

                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.min(
                                                    page + 1,
                                                    totalPages
                                                )
                                        )
                                    }
                                    disabled={
                                        currentPage >=
                                        totalPages
                                    }
                                    className="flex items-center gap-1 text-gray-500 transition hover:text-[#002f86] disabled:cursor-not-allowed disabled:opacity-40"
                                >

                                    Next

                                    <ChevronRight
                                        size={16}
                                    />

                                </button>

                            </div>

                        </div>
                    )}
            </section>

            {/* =====================================================
    CUSTOM DELETE ASSESSMENT MODAL
===================================================== */}

            {deleteTarget && (
                <div
                    className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
        "
                >
                    <div
                        className="
                w-full
                max-w-md
                overflow-hidden
                rounded-xl
                bg-white
                shadow-2xl
            "
                    >
                        {/* ==========================================
                MODAL HEADER
            =========================================== */}

                        <div
                            className="
                    flex
                    items-center
                    justify-between
                    bg-[#15294b]
                    px-6
                    py-4
                    text-white
                "
                        >
                            <div
                                className="
                        flex
                        items-center
                        gap-3
                    "
                            >
                                <AlertTriangle
                                    size={20}
                                    className="text-white"
                                />

                                <h2
                                    className="
                            text-lg
                            font-semibold
                        "
                                >
                                    Confirmation
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteTarget(null)
                                }
                                className="
                        transition
                        hover:text-red-300
                    "
                                aria-label="Close confirmation dialog"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ==========================================
                MODAL CONTENT
            =========================================== */}

                        <div
                            className="
                    px-6
                    py-6
                "
                        >
                            <h3
                                className="
                        text-lg
                        font-bold
                        text-gray-900
                    "
                            >
                                Delete Assessment?
                            </h3>

                            <p
                                className="
                        mt-2
                        text-sm
                        leading-6
                        text-gray-600
                    "
                            >
                                This assessment will be permanently
                                deleted and can no longer be restored.
                            </p>

                            {/* ASSESSMENT DETAILS */}

                            <div
                                className="
                        mt-5
                        rounded-lg
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                    "
                            >
                                <p
                                    className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wider
                            text-gray-500
                        "
                                >
                                    Assessment
                                </p>

                                <p
                                    className="
                            mt-1
                            font-semibold
                            text-gray-900
                        "
                                >
                                    {deleteTarget.title}
                                </p>

                                <p
                                    className="
                            mt-1
                            text-sm
                            text-gray-600
                        "
                                >
                                    {deleteTarget.type || "Written"} Assessment
                                </p>
                            </div>

                            {/* ==========================================
                    MODAL ACTIONS
                =========================================== */}

                            <div
                                className="
                        mt-6
                        flex
                        justify-end
                        gap-3
                        border-t
                        border-gray-200
                        pt-5
                    "
                            >
                                {/* CANCEL */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteTarget(null)
                                    }
                                    className="
                            rounded-lg
                            border
                            border-gray-300
                            bg-white
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            text-gray-700
                            shadow-sm
                            transition
                            hover:bg-gray-100
                        "
                                >
                                    Cancel
                                </button>

                                {/* CONFIRM DELETE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeAssessment(
                                            deleteTarget.id
                                        )
                                    }
                                    className="
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-red-600
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-red-700
                        "
                                >
                                    <Trash2 size={16} />

                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}