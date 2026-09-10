import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { supabase } from "../../supabaseClient";

function NotificationBell() {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [markingId, setMarkingId] = useState(null);

    const dropdownRef = useRef(null);

    /*
     * ------------------------------------------------------------
     * Get currently authenticated user
     * ------------------------------------------------------------
     */
    useEffect(() => {
        let isMounted = true;

        const getCurrentUser = async () => {
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error("Error getting authenticated user:", error);
                    return;
                }

                if (isMounted) {
                    setUser(user || null);
                }
            } catch (error) {
                console.error("Error getting authenticated user:", error);
            }
        };

        getCurrentUser();

        return () => {
            isMounted = false;
        };
    }, []);

    /*
     * ------------------------------------------------------------
     * Fetch notifications for the current user
     * ------------------------------------------------------------
     */
    useEffect(() => {
        if (!user?.id) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const fetchNotifications = async () => {
            setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from("notifications")
                    .select(
                        `
              id,
              recipient_id,
              type,
              title,
              message,
              is_read,
              related_id,
              related_type,
              created_at,
              read_at
            `
                    )
                    .eq("recipient_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) {
                    console.error("Error fetching notifications:", error);

                    if (isMounted) {
                        setNotifications([]);
                    }

                    return;
                }

                if (isMounted) {
                    setNotifications(data || []);
                }
            } catch (error) {
                console.error("Unexpected error fetching notifications:", error);

                if (isMounted) {
                    setNotifications([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchNotifications();

        return () => {
            isMounted = false;
        };
    }, [user]);

    /*
     * ------------------------------------------------------------
     * Supabase Realtime subscription
     * ------------------------------------------------------------
     *
     * Listens for INSERT / UPDATE / DELETE events that belong
     * to the currently authenticated user.
     * ------------------------------------------------------------
     */
    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    /*
                     * New notification
                     */
                    if (payload.eventType === "INSERT") {
                        setNotifications((currentNotifications) => {
                            const alreadyExists = currentNotifications.some(
                                (notification) => notification.id === payload.new.id
                            );

                            if (alreadyExists) {
                                return currentNotifications;
                            }

                            return [payload.new, ...currentNotifications].slice(0, 50);
                        });
                    }

                    /*
                     * Notification updated
                     */
                    if (payload.eventType === "UPDATE") {
                        setNotifications((currentNotifications) =>
                            currentNotifications.map((notification) =>
                                notification.id === payload.new.id
                                    ? payload.new
                                    : notification
                            )
                        );
                    }

                    /*
                     * Notification deleted
                     */
                    if (payload.eventType === "DELETE") {
                        setNotifications((currentNotifications) =>
                            currentNotifications.filter(
                                (notification) => notification.id !== payload.old.id
                            )
                        );
                    }
                }
            )
            .subscribe((status) => {
                if (status === "CHANNEL_ERROR") {
                    console.error("Notification Realtime channel error.");
                }

                if (status === "TIMED_OUT") {
                    console.error("Notification Realtime channel timed out.");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    /*
     * ------------------------------------------------------------
     * Close dropdown when clicking outside
     * ------------------------------------------------------------
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    /*
     * ------------------------------------------------------------
     * Mark one notification as read
     * ------------------------------------------------------------
     */
    const markAsRead = async (notificationId) => {
        if (!user?.id || !notificationId) {
            return;
        }

        setMarkingId(notificationId);

        try {
            const readAt = new Date().toISOString();

            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: readAt,
                })
                .eq("id", notificationId)
                .eq("recipient_id", user.id);

            if (error) {
                console.error("Error marking notification as read:", error);
                return;
            }

            setNotifications((currentNotifications) =>
                currentNotifications.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            is_read: true,
                            read_at: readAt,
                        }
                        : notification
                )
            );
        } catch (error) {
            console.error("Unexpected error marking notification as read:", error);
        } finally {
            setMarkingId(null);
        }
    };

    /*
     * ------------------------------------------------------------
     * Mark all notifications as read
     * ------------------------------------------------------------
     */
    const markAllAsRead = async () => {
        if (!user?.id || unreadCount === 0) {
            return;
        }

        try {
            const readAt = new Date().toISOString();

            const { error } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                    read_at: readAt,
                })
                .eq("recipient_id", user.id)
                .eq("is_read", false);

            if (error) {
                console.error(
                    "Error marking all notifications as read:",
                    error
                );
                return;
            }

            setNotifications((currentNotifications) =>
                currentNotifications.map((notification) => ({
                    ...notification,
                    is_read: true,
                    read_at: notification.read_at || readAt,
                }))
            );
        } catch (error) {
            console.error(
                "Unexpected error marking all notifications as read:",
                error
            );
        }
    };

    /*
     * ------------------------------------------------------------
     * Notification counts
     * ------------------------------------------------------------
     */
    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;

    /*
     * ------------------------------------------------------------
     * Only display the latest notifications.
     *
     * The dropdown itself has a fixed max height so that no more
     * than approximately 5 notification cards are visible before
     * vertical scrolling is required.
     * ------------------------------------------------------------
     */
    const displayedNotifications = notifications;

    /*
     * ------------------------------------------------------------
     * Format notification date/time
     * ------------------------------------------------------------
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
     * ------------------------------------------------------------
     * Get a small visual indicator based on notification type
     * ------------------------------------------------------------
     */
    const getNotificationTypeLabel = (type) => {
        if (!type) {
            return "Notification";
        }

        const typeMap = {
            assessment: "Assessment",
            assessment_created: "Assessment",
            assessment_updated: "Assessment",
            assessment_assignment: "Assessment",
            assessment_assigned: "Assessment",
            assessment_schedule: "Schedule",
            assessment_scheduled: "Schedule",
            assessment_completion: "Assessment",
            assessment_completed: "Assessment",
            schedule: "Schedule",
            schedule_change: "Schedule",
            results: "Results",
            result: "Results",
            certificate: "Certificate",
            certificate_issued: "Certificate",
            certificate_available: "Certificate",
            user_registration: "Registration",
            registration: "Registration",
            announcement: "Announcement",
            system_announcement: "Announcement",
            administrative_alert: "Administrative Alert",
            alert: "Alert",
            reminder: "Reminder",
            evaluation: "Evaluation",
            evaluation_reminder: "Evaluation",
        };

        return (
            typeMap[type.toLowerCase()] ||
            type.charAt(0).toUpperCase() + type.slice(1)
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ======================================================
          Notification Bell Button
          ====================================================== */}
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="
          relative
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-full
          text-gray-600
          hover:bg-gray-100
          hover:text-gray-800
          transition-colors
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
        "
                aria-label={
                    unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : "Notifications"
                }
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell
                    size={21}
                    strokeWidth={2}
                    className={unreadCount > 0 ? "text-gray-700" : "text-gray-600"}
                />

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span
                        className="
              absolute
              -top-0.5
              -right-0.5
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-red-500
              text-white
              text-[10px]
              font-bold
              flex
              items-center
              justify-center
              border-2
              border-white
            "
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ======================================================
          Notification Dropdown
          ====================================================== */}
            {isOpen && (
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
                >
                    {/* Header */}
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
                                onClick={markAllAsRead}
                                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  font-medium
                  text-blue-600
                  hover:text-blue-800
                  transition-colors
                "
                            >
                                <CheckCheck size={15} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[430px] overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-8 text-center">
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
                        ) : displayedNotifications.length === 0 ? (
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
                                    <Bell size={22} className="text-gray-400" />
                                </div>

                                <h3 className="text-sm font-medium text-gray-700 mt-3">
                                    No notifications
                                </h3>

                                <p className="text-xs text-gray-400 mt-1">
                                    You don't have any notifications yet.
                                </p>
                            </div>
                        ) : (
                            displayedNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`
                    relative
                    px-4
                    py-3
                    border-b
                    border-gray-100
                    transition-colors
                    ${notification.is_read
                                            ? "bg-white hover:bg-gray-50"
                                            : "bg-blue-50/50 hover:bg-blue-50"
                                        }
                  `}
                                >
                                    {/* Unread indicator */}
                                    {!notification.is_read && (
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
                                        />
                                    )}

                                    <div className="pl-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3
                                                    className={`
                            text-sm
                            leading-5
                            ${notification.is_read
                                                            ? "font-medium text-gray-700"
                                                            : "font-semibold text-gray-900"
                                                        }
                          `}
                                                >
                                                    {notification.title || "Notification"}
                                                </h3>

                                                <p className="text-xs text-gray-500 mt-1 leading-5">
                                                    {notification.message || ""}
                                                </p>
                                            </div>

                                            {!notification.is_read && (
                                                <span className="shrink-0 text-[10px] font-medium text-blue-600">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mt-2">
                                            <div className="flex items-center gap-2">
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
                          "
                                                >
                                                    {getNotificationTypeLabel(notification.type)}
                                                </span>

                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Clock size={11} />
                                                    {formatNotificationTime(notification.created_at)}
                                                </span>
                                            </div>

                                            {!notification.is_read && (
                                                <button
                                                    type="button"
                                                    onClick={() => markAsRead(notification.id)}
                                                    disabled={markingId === notification.id}
                                                    className="
                            flex
                            items-center
                            gap-1
                            text-[10px]
                            font-medium
                            text-blue-600
                            hover:text-blue-800
                            disabled:opacity-50
                          "
                                                >
                                                    <Check size={12} />
                                                    {markingId === notification.id
                                                        ? "Saving..."
                                                        : "Mark read"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
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
            )}
        </div>
    );
}

export default NotificationBell;