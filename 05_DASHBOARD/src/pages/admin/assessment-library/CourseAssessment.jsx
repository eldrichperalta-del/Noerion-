import { useEffect, useMemo, useState } from "react";
import {
    Archive,
    Copy,
    MoreVertical,
    RotateCcw,
    Search,
    Trash2,
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
       CLOSE MENU
       ======================================================== */

    const closeMenu = () => {
        setOpenMenu(null);
    };

    /* ========================================================
       VIEW ASSESSMENT
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

    /* ========================================================
       DUPLICATE ASSESSMENT
       ======================================================== */

    const duplicateAssessment = async (
        assessment
    ) => {
        try {
            const source =
                assessment.raw || {};

            const {
                data: newAssessment,
                error,
            } = await supabase
                .from("assessments")
                .insert({
                    course_id:
                        source.course_id ||
                        courseId,

                    title:
                        `${assessment.title} - Copy`,

                    set_type:
                        source.set_type ||
                        "Written",

                    total_items:
                        Number(
                            source.total_items
                        ) || 0,

                    time_limit_minutes:
                        Number(
                            source.time_limit_minutes
                        ) || 30,

                    is_active: false,

                    status: "Draft",
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            await loadAssessments();

            alert(
                `Assessment "${newAssessment?.title ||
                "Copy"
                }" was created as a draft.`
            );
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
        const confirmed =
            window.confirm(
                "Delete this assessment? This action cannot be undone."
            );

        if (!confirmed) {
            closeMenu();
            return;
        }

        try {
            const {
                error,
            } = await supabase
                .from("assessments")
                .delete()
                .eq("id", assessmentId);

            if (error) {
                throw error;
            }

            setAssessments(
                (current) =>
                    current.filter(
                        (assessment) =>
                            assessment.id !==
                            assessmentId
                    )
            );
        } catch (error) {
            console.error(
                "Error deleting assessment:",
                error
            );

            alert(
                `Error deleting assessment: ${error?.message ||
                "Unknown error"
                }`
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
                            label="Duplicate"
                            Icon={Copy}
                            onClick={() =>
                                duplicateAssessment(
                                    assessment
                                )
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
                            onClick={() =>
                                removeAssessment(
                                    assessment.id
                                )
                            }
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

                                filteredAssessments.map(
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
            </section>

            {/* ====================================================
                SUMMARY
            ==================================================== */}

            {!loading &&
                filteredAssessments.length > 0 && (
                    <p className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-semibold text-gray-700">
                            {
                                filteredAssessments.length
                            }
                        </span>{" "}
                        assessment
                        {filteredAssessments.length !==
                            1
                            ? "s"
                            : ""}{" "}
                        for{" "}
                        <span className="font-semibold text-gray-700">
                            {course.title}
                        </span>
                        .
                    </p>
                )}
        </div>
    );
}