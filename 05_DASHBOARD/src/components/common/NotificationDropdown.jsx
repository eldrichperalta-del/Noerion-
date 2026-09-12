import { Bell, Check, CheckCheck, Clock } from "lucide-react";

/*
 * ============================================================================
 * NOTIFICATION DROPDOWN
 * ============================================================================
 *
 * Presentation component only.
 *
 * Notification data and actions come from useNotifications.js and are passed
 * into this component by NotificationBell.jsx.
 *
 * Expected props:
 *
 * notifications
 * unreadCount
 * isLoading
 * markingId
 * onMarkAsRead
 * onMarkAllAsRead
 * ============================================================================
 */

function NotificationDropdown({
    notifications = [],
    unreadCount = 0,
    isLoading = false,
    markingId = null,
    onMarkAsRead,
    onMarkAllAsRead,
}) {
    /*
     * ------------------------------------------------------------------------
     * Format notification date/time
     * ------------------------------------------------------------------------
     */
    const formatNotificationTime = (createdAt) => {
        if (!createdAt) {
            return "";
        }

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const now = new Date();

        const differenceInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        );

        if (differenceInSeconds < 0) {
            return "Just now";
        }

        if (differenceInSeconds < 60) {
            return "Just now";
        }

        if (differenceInSeconds < 3600) {
            const minutes = Math.floor(differenceInSeconds / 60);

            return `${minutes}m ago`;
        }

        if (differenceInSeconds < 86400) {
            const hours = Math.floor(differenceInSeconds / 3600);

            return `${hours}h ago`;
        }

        if (differenceInSeconds < 604800) {
            const days = Math.floor(differenceInSeconds / 86400);

            return `${days}d ago`;
        }

        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    /*
     * ------------------------------------------------------------------------
     * Notification type label
     * ------------------------------------------------------------------------
     *
     * These names cover the notification types that will be generated across
     * Admin, Assessor, and Trainee workflows.
     * ------------------------------------------------------------------------
     */
    const getNotificationTypeLabel = (type) => {
        if (!type) {
            return "Notification";
        }

        const normalizedType = String(type).toLowerCase();

        const typeMap = {
            assessment: "Assessment",
            assessment_created: "Assessment",
            assessment_updated: "Assessment",
            assessment_assignment: "Assessment",
            assessment_assigned: "Assessment",
            assessment_available: "Assessment",
            assessment_availability: "Assessment",

            assessment_schedule: "Schedule",
            assessment_scheduled: "Schedule",
            assessment_schedule_change: "Schedule",
            assessment_schedule_changed: "Schedule",
            assessment_schedule_reminder: "Schedule",
            assessment_reminder: "Reminder",
            upcoming_assessment: "Reminder",
            upcoming_assessment_reminder: "Reminder",

            schedule: "Schedule",
            schedule_change: "Schedule",
            schedule_changed: "Schedule",

            assessment_completion: "Assessment",
            assessment_completed: "Assessment",
            assessment_completion_reminder: "Assessment",

            results: "Results",
            result: "Results",
            result_available: "Results",
            results_available: "Results",
            results_updated: "Results",
            result_updated: "Results",

            certificate: "Certificate",
            certificate_issued: "Certificate",
            certificate_available: "Certificate",
            certificate_earned: "Certificate",
            certificate_received: "Certificate",

            user_registration: "Registration",
            registration: "Registration",
            pending_approval: "Registration",
            user_approval: "Registration",

            announcement: "Announcement",
            system_announcement: "Announcement",

            administrative_alert: "Administrative Alert",
            administrative: "Administrative Alert",
            alert: "Alert",

            reminder: "Reminder",
            evaluation: "Evaluation",
            evaluation_reminder: "Evaluation",
            evaluation_completed: "Evaluation",
            trainee_submission: "Evaluation",
            trainee_submission_received: "Evaluation",

            system: "System",
        };

        if (typeMap[normalizedType]) {
            return typeMap[normalizedType];
        }

        return normalizedType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    };

    /*
     * ------------------------------------------------------------------------
     * Notification click handler
     * ------------------------------------------------------------------------
     *
     * Phase 1 does not force navigation because related_id / related_type
     * routing will be connected to the actual pages in the next integration
     * phase.
     *
     * Clicking the notification still marks it as read.
     * ------------------------------------------------------------------------
     */
    const handleNotificationClick = (notification) => {
        if (
            !notification?.is_read &&
            notification?.id &&
            typeof onMarkAsRead === "function"
        ) {
            onMarkAsRead(notification.id);
        }
    };

    /*
     * =========================================================================
     * RENDER
     * =========================================================================
     */

    return (
        <div
            className="
                absolute
                right-0
                top-12
                w-[380px]
                max-w-[calc(100vw-32px)]
                bg-white
                rounded-xl
                border
                border-gray-200
                shadow-xl
                z-[100]
                overflow-hidden
            "
            role="dialog"
            aria-label="Notifications"
        >
            {/* =================================================================
                HEADER
            ================================================================== */}

            <div
                className="
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3
                    border-b
                    border-gray-100
                "
            >
                <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                        Notifications
                    </h2>

                    <p className="text-xs text-gray-400 mt-0.5">
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"
                            }`
                            : "You're all caught up"}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={onMarkAllAsRead}
                        className="
                            flex
                            items-center
                            gap-1
                            text-xs
                            font-medium
                            text-blue-600
                            hover:text-blue-800
                            transition-colors
                            focus:outline-none
                            focus:ring-2
                            focus:ring-blue-100
                            rounded
                        "
                    >
                        <CheckCheck size={15} />

                        Mark all read
                    </button>
                )}
            </div>

            {/* =================================================================
                NOTIFICATION LIST
            ================================================================== */}

            <div className="max-h-[430px] overflow-y-auto">
                {/* =============================================================
                    LOADING
                ============================================================== */}

                {isLoading ? (
                    <div className="px-4 py-10 text-center">
                        <div
                            className="
                                mx-auto
                                w-6
                                h-6
                                rounded-full
                                border-2
                                border-gray-200
                                border-t-blue-600
                                animate-spin
                            "
                        />

                        <p className="text-xs text-gray-400 mt-3">
                            Loading notifications...
                        </p>
                    </div>
                ) : notifications.length === 0 ? (
                    /* =========================================================
                       EMPTY STATE
                    ========================================================== */

                    <div className="px-4 py-10 text-center">
                        <div
                            className="
                                mx-auto
                                w-12
                                h-12
                                rounded-full
                                bg-gray-100
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <Bell
                                size={22}
                                className="text-gray-400"
                            />
                        </div>

                        <h3 className="text-sm font-medium text-gray-700 mt-3">
                            No notifications
                        </h3>

                        <p className="text-xs text-gray-400 mt-1">
                            You don't have any notifications yet.
                        </p>
                    </div>
                ) : (
                    /* =========================================================
                       NOTIFICATIONS
                    ========================================================== */

                    notifications.map((notification) => {
                        const isUnread = !notification.is_read;

                        return (
                            <div
                                key={notification.id}
                                onClick={() =>
                                    handleNotificationClick(notification)
                                }
                                className={`
                                    relative
                                    px-4
                                    py-3
                                    border-b
                                    border-gray-100
                                    transition-colors
                                    ${isUnread
                                        ? "bg-blue-50/50 hover:bg-blue-50"
                                        : "bg-white hover:bg-gray-50"
                                    }
                                    ${isUnread
                                        ? "cursor-pointer"
                                        : "cursor-default"
                                    }
                                `}
                            >
                                {/* =================================================
                                    UNREAD INDICATOR
                                ================================================== */}

                                {isUnread && (
                                    <span
                                        className="
                                            absolute
                                            left-2
                                            top-4
                                            w-2
                                            h-2
                                            rounded-full
                                            bg-blue-600
                                        "
                                        aria-label="Unread"
                                    />
                                )}

                                <div className="pl-2">
                                    {/* =============================================
                                        TITLE + NEW
                                    ============================================== */}

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3
                                                className={`
                                                    text-sm
                                                    leading-5
                                                    ${isUnread
                                                        ? "font-semibold text-gray-900"
                                                        : "font-medium text-gray-700"
                                                    }
                                                `}
                                            >
                                                {notification.title ||
                                                    "Notification"}
                                            </h3>

                                            <p className="text-xs text-gray-500 mt-1 leading-5">
                                                {notification.message || ""}
                                            </p>
                                        </div>

                                        {isUnread && (
                                            <span
                                                className="
                                                    shrink-0
                                                    text-[10px]
                                                    font-medium
                                                    text-blue-600
                                                "
                                            >
                                                NEW
                                            </span>
                                        )}
                                    </div>

                                    {/* =============================================
                                        TYPE + TIME + ACTION
                                    ============================================== */}

                                    <div className="flex items-center justify-between gap-3 mt-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    rounded-full
                                                    bg-gray-100
                                                    px-2
                                                    py-0.5
                                                    text-[10px]
                                                    font-medium
                                                    text-gray-500
                                                    whitespace-nowrap
                                                "
                                            >
                                                {getNotificationTypeLabel(
                                                    notification.type
                                                )}
                                            </span>

                                            <span
                                                className="
                                                    flex
                                                    items-center
                                                    gap-1
                                                    text-[10px]
                                                    text-gray-400
                                                    whitespace-nowrap
                                                "
                                            >
                                                <Clock size={11} />

                                                {formatNotificationTime(
                                                    notification.created_at
                                                )}
                                            </span>
                                        </div>

                                        {isUnread && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (
                                                        typeof onMarkAsRead ===
                                                        "function"
                                                    ) {
                                                        onMarkAsRead(
                                                            notification.id
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    markingId ===
                                                    notification.id
                                                }
                                                className="
                                                    shrink-0
                                                    flex
                                                    items-center
                                                    gap-1
                                                    text-[10px]
                                                    font-medium
                                                    text-blue-600
                                                    hover:text-blue-800
                                                    disabled:opacity-50
                                                    transition-colors
                                                    focus:outline-none
                                                    focus:ring-2
                                                    focus:ring-blue-100
                                                    rounded
                                                "
                                            >
                                                <Check size={12} />

                                                {markingId ===
                                                    notification.id
                                                    ? "Saving..."
                                                    : "Mark read"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* =================================================================
                FOOTER
            ================================================================== */}

            {!isLoading && notifications.length > 0 && (
                <div
                    className="
                        px-4
                        py-2.5
                        border-t
                        border-gray-100
                        bg-gray-50
                    "
                >
                    <p className="text-[10px] text-center text-gray-400">
                        Showing your latest notifications
                    </p>
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;