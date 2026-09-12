
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const MAX_NOTIFICATIONS = 50;

function useNotifications() {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [markingId, setMarkingId] = useState(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    /*
     * ------------------------------------------------------------
     * AUTHENTICATED USER
     * ------------------------------------------------------------
     * Get the currently authenticated Supabase user and keep the
     * hook synchronized when authentication changes.
     */
    useEffect(() => {
        let isMounted = true;

        const loadAuthenticatedUser = async () => {
            try {
                const {
                    data: { user: authenticatedUser },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error(
                        "[useNotifications] Error getting authenticated user:",
                        error
                    );

                    if (isMounted) {
                        setUser(null);
                    }

                    return;
                }

                if (isMounted) {
                    setUser(authenticatedUser || null);
                }
            } catch (error) {
                console.error(
                    "[useNotifications] Unexpected authentication error:",
                    error
                );

                if (isMounted) {
                    setUser(null);
                }
            }
        };

        loadAuthenticatedUser();

        const {
            data: authListener,
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!isMounted) {
                    return;
                }

                setUser(session?.user || null);
            }
        );

        return () => {
            isMounted = false;

            authListener?.subscription?.unsubscribe();
        };
    }, []);

    /*
     * ------------------------------------------------------------
     * FETCH NOTIFICATIONS
     * ------------------------------------------------------------
     * This function can be reused by components when they need to
     * manually refresh the notification list.
     */
    const fetchNotifications = useCallback(
        async ({ silent = false } = {}) => {
            if (!user?.id) {
                setNotifications([]);

                if (!silent) {
                    setIsLoading(false);
                }

                return;
            }

            if (!silent) {
                setIsLoading(true);
            }

            try {
                const {
                    data,
                    error,
                } = await supabase
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
                    .order("created_at", {
                        ascending: false,
                    })
                    .limit(MAX_NOTIFICATIONS);

                if (error) {
                    console.error(
                        "[useNotifications] Error fetching notifications:",
                        error
                    );

                    if (!silent) {
                        setNotifications([]);
                    }

                    return;
                }

                setNotifications(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (error) {
                console.error(
                    "[useNotifications] Unexpected notification fetch error:",
                    error
                );

                if (!silent) {
                    setNotifications([]);
                }
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        },
        [user?.id]
    );

    /*
     * ------------------------------------------------------------
     * INITIAL NOTIFICATION LOAD
     * ------------------------------------------------------------
     */
    useEffect(() => {
        let isMounted = true;

        const loadNotifications = async () => {
            if (!user?.id) {
                if (isMounted) {
                    setNotifications([]);
                    setIsLoading(false);
                }

                return;
            }

            if (isMounted) {
                setIsLoading(true);
            }

            try {
                const {
                    data,
                    error,
                } = await supabase
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
                    .order("created_at", {
                        ascending: false,
                    })
                    .limit(MAX_NOTIFICATIONS);

                if (error) {
                    console.error(
                        "[useNotifications] Error loading notifications:",
                        error
                    );

                    if (isMounted) {
                        setNotifications([]);
                    }

                    return;
                }

                if (isMounted) {
                    setNotifications(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "[useNotifications] Unexpected notification loading error:",
                    error
                );

                if (isMounted) {
                    setNotifications([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadNotifications();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    /*
     * ------------------------------------------------------------
     * REALTIME NOTIFICATIONS
     * ------------------------------------------------------------
     * Automatically update the notification list when:
     *
     * INSERT -> new notification arrives
     * UPDATE -> notification is read/changed
     * DELETE -> notification is removed
     */
    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        const channelName =
            `notifications-user-${user.id}`;

        const channel = supabase
            .channel(channelName)

            // New notification
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification =
                        payload?.new;

                    if (!newNotification?.id) {
                        return;
                    }

                    setNotifications(
                        (currentNotifications) => {
                            const alreadyExists =
                                currentNotifications.some(
                                    (notification) =>
                                        notification.id ===
                                        newNotification.id
                                );

                            if (alreadyExists) {
                                return currentNotifications;
                            }

                            return [
                                newNotification,
                                ...currentNotifications,
                            ].slice(
                                0,
                                MAX_NOTIFICATIONS
                            );
                        }
                    );
                }
            )

            // Notification updated
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const updatedNotification =
                        payload?.new;

                    if (!updatedNotification?.id) {
                        return;
                    }

                    setNotifications(
                        (currentNotifications) =>
                            currentNotifications.map(
                                (notification) =>
                                    notification.id ===
                                    updatedNotification.id
                                        ? updatedNotification
                                        : notification
                            )
                    );
                }
            )

            // Notification deleted
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const deletedNotification =
                        payload?.old;

                    if (!deletedNotification?.id) {
                        return;
                    }

                    setNotifications(
                        (currentNotifications) =>
                            currentNotifications.filter(
                                (notification) =>
                                    notification.id !==
                                    deletedNotification.id
                            )
                    );
                }
            )

            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.info(
                        "[useNotifications] Realtime subscription active."
                    );
                }

                if (status === "CHANNEL_ERROR") {
                    console.error(
                        "[useNotifications] Realtime channel error."
                    );
                }

                if (status === "TIMED_OUT") {
                    console.error(
                        "[useNotifications] Realtime channel timed out."
                    );
                }

                if (status === "CLOSED") {
                    console.info(
                        "[useNotifications] Realtime channel closed."
                    );
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    /*
     * ------------------------------------------------------------
     * UNREAD COUNT
     * ------------------------------------------------------------
     */
    const unreadCount = useMemo(
        () =>
            notifications.filter(
                (notification) =>
                    notification?.is_read === false
            ).length,
        [notifications]
    );

    /*
     * ------------------------------------------------------------
     * MARK ONE NOTIFICATION AS READ
     * ------------------------------------------------------------
     */
    const markAsRead = useCallback(
        async (notificationId) => {
            if (!user?.id || !notificationId) {
                return {
                    success: false,
                    error: "Missing user or notification ID.",
                };
            }

            setMarkingId(notificationId);

            try {
                const readAt =
                    new Date().toISOString();

                const {
                    data,
                    error,
                } = await supabase
                    .from("notifications")
                    .update({
                        is_read: true,
                        read_at: readAt,
                    })
                    .eq("id", notificationId)
                    .eq("recipient_id", user.id)
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
                    .maybeSingle();

                if (error) {
                    console.error(
                        "[useNotifications] Error marking notification as read:",
                        error
                    );

                    return {
                        success: false,
                        error,
                    };
                }

                setNotifications(
                    (currentNotifications) =>
                        currentNotifications.map(
                            (notification) =>
                                notification.id ===
                                notificationId
                                    ? {
                                          ...notification,
                                          ...(data || {}),
                                          is_read: true,
                                          read_at: readAt,
                                      }
                                    : notification
                        )
                );

                return {
                    success: true,
                    data,
                };
            } catch (error) {
                console.error(
                    "[useNotifications] Unexpected mark-as-read error:",
                    error
                );

                return {
                    success: false,
                    error,
                };
            } finally {
                setMarkingId(null);
            }
        },
        [user?.id]
    );

    /*
     * ------------------------------------------------------------
     * MARK ALL NOTIFICATIONS AS READ
     * ------------------------------------------------------------
     */
    const markAllAsRead = useCallback(
        async () => {
            if (!user?.id || unreadCount === 0) {
                return {
                    success: false,
                    error:
                        "There are no unread notifications.",
                };
            }

            setIsMarkingAll(true);

            try {
                const readAt =
                    new Date().toISOString();

                const {
                    error,
                } = await supabase
                    .from("notifications")
                    .update({
                        is_read: true,
                        read_at: readAt,
                    })
                    .eq("recipient_id", user.id)
                    .eq("is_read", false);

                if (error) {
                    console.error(
                        "[useNotifications] Error marking all notifications as read:",
                        error
                    );

                    return {
                        success: false,
                        error,
                    };
                }

                setNotifications(
                    (currentNotifications) =>
                        currentNotifications.map(
                            (notification) => ({
                                ...notification,
                                is_read: true,
                                read_at:
                                    notification.read_at ||
                                    readAt,
                            })
                        )
                );

                return {
                    success: true,
                };
            } catch (error) {
                console.error(
                    "[useNotifications] Unexpected mark-all-as-read error:",
                    error
                );

                return {
                    success: false,
                    error,
                };
            } finally {
                setIsMarkingAll(false);
            }
        },
        [user?.id, unreadCount]
    );

    /*
     * ------------------------------------------------------------
     * HOOK API
     * ------------------------------------------------------------
     */
    return {
        user,
        notifications,
        unreadCount,
        isLoading,
        markingId,
        isMarkingAll,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}

export default useNotifications;

