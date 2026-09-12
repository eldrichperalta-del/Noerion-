
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import useNotifications from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

/*
 * ============================================================================
 * NOTIFICATION BELL
 * ============================================================================
 *
 * Responsibilities:
 * 1. Connect to useNotifications()
 * 2. Display the notification bell and unread badge
 * 3. Open / close the notification dropdown
 * 4. Close the dropdown when clicking outside
 * 5. Pass notification data and actions to NotificationDropdown
 *
 * Presentation of the notification list itself is handled by:
 * NotificationDropdown.jsx
 *
 * This keeps the notification architecture separated:
 *
 * NotificationBell
 *      ↓
 * useNotifications()
 *      ↓
 * NotificationDropdown
 */

function NotificationBell() {
    const {
        notifications = [],
        unreadCount = 0,
        isLoading = false,
        markingId = null,
        isMarkingAll = false,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);

    const dropdownRef = useRef(null);

    /*
     * =========================================================================
     * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
     * =========================================================================
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
            document.addEventListener(
                "mousedown",
                handleClickOutside
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [isOpen]);

    /*
     * =========================================================================
     * TOGGLE DROPDOWN
     * =========================================================================
     */
    const handleToggle = () => {
        setIsOpen((current) => !current);
    };

    /*
     * =========================================================================
     * MARK ONE NOTIFICATION AS READ
     * =========================================================================
     *
     * The database update is handled by useNotifications().
     */
    const handleMarkAsRead = async (notificationId) => {
        if (
            !notificationId ||
            typeof markAsRead !== "function"
        ) {
            return;
        }

        await markAsRead(notificationId);
    };

    /*
     * =========================================================================
     * MARK ALL NOTIFICATIONS AS READ
     * =========================================================================
     *
     * The database update is handled by useNotifications().
     */
    const handleMarkAllAsRead = async () => {
        if (
            unreadCount <= 0 ||
            typeof markAllAsRead !== "function"
        ) {
            return;
        }

        await markAllAsRead();
    };

    /*
     * =========================================================================
     * DISPLAYED NOTIFICATIONS
     * =========================================================================
     *
     * useNotifications() already controls the notification data and limit.
     * We only make sure the dropdown always receives an array.
     */
    const displayedNotifications = Array.isArray(
        notifications
    )
        ? notifications
        : [];

    return (
        <div
            ref={dropdownRef}
            className="relative"
        >
            {/* ================================================================
                NOTIFICATION BELL
                ================================================================ */}
            <button
                type="button"
                onClick={handleToggle}
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
                    className={
                        unreadCount > 0
                            ? "text-gray-700"
                            : "text-gray-600"
                    }
                />

                {/* ============================================================
                    UNREAD COUNT BADGE
                    ============================================================ */}
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
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* ================================================================
                NOTIFICATION DROPDOWN
                ================================================================ */}
            {isOpen && (
                <NotificationDropdown
                    notifications={displayedNotifications}
                    unreadCount={unreadCount}
                    isLoading={isLoading}
                    markingId={markingId}
                    isMarkingAll={isMarkingAll}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                />
            )}
        </div>
    );
}

export default NotificationBell;

