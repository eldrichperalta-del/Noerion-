import { supabase } from "../supabaseClient";

/*
|--------------------------------------------------------------------------
| NOTIFICATION SERVICE
|--------------------------------------------------------------------------
|
| Centralized notification creation and preference handling.
|
| Responsibilities:
| 1. Read notification preferences
| 2. Check notification type preference
| 3. Create notifications
| 4. Prevent accidental duplicates
| 5. Notify individual users
| 6. Notify users by role
| 7. Provide reusable event helpers
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| DEFAULT PREFERENCE
|--------------------------------------------------------------------------
*/

const DEFAULT_ENABLED = true;

/*
|--------------------------------------------------------------------------
| PREFERENCE COLUMN MAP
|--------------------------------------------------------------------------
*/

const PREFERENCE_MAP = {
    assessment: "assessment_notifications",
    assessment_created: "assessment_notifications",
    assessment_updated: "assessment_notifications",

    assessment_assignment: "assessment_assignment_notifications",
    assessment_assigned: "assessment_assignment_notifications",

    assessment_schedule: "assessment_schedule_notifications",
    assessment_scheduled: "assessment_schedule_notifications",

    assessment_schedule_change: "assessment_schedule_changes",
    schedule_change: "assessment_schedule_changes",

    assessment_completion: "assessment_completion_notifications",
    assessment_completed: "assessment_completed_notifications",

    upcoming_assessment: "upcoming_assessment_reminders",
    upcoming_assessment_reminder: "upcoming_assessment_reminders",

    assessment_reminder: "assessment_reminder_notifications",

    assessment_availability: "assessment_availability_notifications",

    results: "results_notifications",
    result: "results_notifications",

    result_available: "results_availability_notifications",
    results_available: "results_availability_notifications",

    results_related: "results_related_notifications",

    certificate: "certificate_notifications",
    certificate_issued: "certificate_related_notifications",

    certificate_available: "certificate_availability_notifications",
    certificate_earned: "certificate_availability_notifications",

    user_registration: "user_registration_notifications",
    registration: "user_registration_notifications",

    trainee_submission: "trainee_submission_notifications",

    evaluation: "evaluation_reminders",
    evaluation_reminder: "evaluation_reminders",

    administrative_alert: "administrative_alerts",
    alert: "administrative_alerts",

    system_announcement: "system_announcements",
    announcement: "system_announcements",
};

/*
|--------------------------------------------------------------------------
| NORMALIZE TYPE
|--------------------------------------------------------------------------
*/

function normalizeType(type) {
    return String(type || "system_announcement")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

/*
|--------------------------------------------------------------------------
| GET PREFERENCE COLUMN
|--------------------------------------------------------------------------
*/

function getPreferenceColumn(type) {
    const normalizedType = normalizeType(type);

    return PREFERENCE_MAP[normalizedType] || "system_announcements";
}

/*
|--------------------------------------------------------------------------
| GET AUTHENTICATED USER
|--------------------------------------------------------------------------
*/

export async function getAuthenticatedUser() {
    const {
        data,
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return data?.user || null;
}

/*
|--------------------------------------------------------------------------
| GET NOTIFICATION PREFERENCES
|--------------------------------------------------------------------------
*/

export async function getNotificationPreferences(userId) {
    console.log(
        "========== GET NOTIFICATION PREFERENCES =========="
    );

    console.log(
        "Checking preferences for user:",
        userId
    );

    if (!userId) {
        console.warn(
            "getNotificationPreferences: userId is missing."
        );

        return null;
    }

    const {
        data,
        error,
    } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    console.log(
        "NOTIFICATION PREFERENCES QUERY RESULT:",
        {
            userId,
            data,
            error,
        }
    );

    if (error) {
        console.error(
            "Error fetching notification preferences:",
            error
        );

        throw error;
    }

    if (!data) {
        console.warn(
            "NO NOTIFICATION PREFERENCE ROW FOUND.",
            {
                userId,
                defaultEnabled: DEFAULT_ENABLED,
            }
        );
    }

    return data || null;
}

/*
|--------------------------------------------------------------------------
| CHECK NOTIFICATION PREFERENCE
|--------------------------------------------------------------------------
*/

export async function isNotificationEnabled(userId, type) {
    console.log(
        "========== CHECK NOTIFICATION ENABLED =========="
    );

    console.log(
        "Preference check input:",
        {
            userId,
            type,
        }
    );

    if (!userId) {
        console.warn(
            "isNotificationEnabled: userId is missing."
        );

        return false;
    }

    const preferences =
        await getNotificationPreferences(userId);

    /*
     * No preference row means notifications are enabled.
     */
    if (!preferences) {
        console.log(
            "NO PREFERENCE ROW -> DEFAULT ENABLED:",
            DEFAULT_ENABLED
        );

        return DEFAULT_ENABLED;
    }

    const preferenceColumn =
        getPreferenceColumn(type);

    const enabled =
        preferences[preferenceColumn] !== false;

    console.log(
        "PREFERENCE CHECK RESULT:",
        {
            userId,
            type,
            normalizedType: normalizeType(type),
            preferenceColumn,
            preferenceValue:
                preferences[preferenceColumn],
            enabled,
        }
    );

    return enabled;
}

/*
|--------------------------------------------------------------------------
| UUID VALIDATION
|--------------------------------------------------------------------------
*/

function isValidUUID(value) {
    if (!value) {
        return false;
    }

    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(String(value));
}

/*
|--------------------------------------------------------------------------
| CHECK FOR EXISTING NOTIFICATION
|--------------------------------------------------------------------------
*/

async function hasRecentDuplicate({
    recipientId,
    type,
    relatedId = null,
    relatedType = null,
}) {
    console.log(
        "========== CHECK NOTIFICATION DUPLICATE =========="
    );

    console.log(
        "Duplicate check input:",
        {
            recipientId,
            type,
            relatedId,
            relatedType,
        }
    );

    if (!recipientId) {
        return false;
    }

    const normalizedType =
        normalizeType(type);

    if (relatedId && !isValidUUID(relatedId)) {
        console.warn(
            "Skipping notification duplicate check because relatedId is not a valid UUID:",
            relatedId
        );

        return false;
    }

    if (!relatedId) {
        console.log(
            "No relatedId -> duplicate check skipped."
        );

        return false;
    }

    const duplicateWindow =
        new Date(
            Date.now() - 60 * 1000
        ).toISOString();

    let query = supabase
        .from("notifications")
        .select("id")
        .eq(
            "recipient_id",
            recipientId
        )
        .eq(
            "type",
            normalizedType
        )
        .eq(
            "related_id",
            relatedId
        )
        .gte(
            "created_at",
            duplicateWindow
        )
        .limit(1);

    if (relatedType) {
        query = query.eq(
            "related_type",
            relatedType
        );
    }

    const {
        data,
        error,
    } = await query;

    console.log(
        "DUPLICATE QUERY RESULT:",
        {
            data,
            error,
        }
    );

    if (error) {
        console.warn(
            "Unable to check notification duplicate:",
            error
        );

        return false;
    }

    const duplicate =
        Array.isArray(data) &&
        data.length > 0;

    console.log(
        "DUPLICATE FOUND:",
        duplicate
    );

    return duplicate;
}

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
*/

export async function createNotification({
    recipientId,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    preventDuplicate = true,
}) {

    console.log(
        "=================================================="
    );

    console.log(
        "========== CREATE NOTIFICATION START =========="
    );

    console.log(
        "createNotification INPUT:",
        {
            recipientId,
            type,
            title,
            message,
            relatedId,
            relatedType,
            preventDuplicate,
        }
    );

    /*
     * Validate recipient.
     */
    if (!recipientId) {
        console.warn(
            "createNotification: recipientId is required."
        );

        return {
            success: false,
            skipped: true,
            reason: "missing_recipient",
        };
    }

    /*
     * Validate content.
     */
    if (!title && !message) {
        console.warn(
            "createNotification: title or message is required."
        );

        return {
            success: false,
            skipped: true,
            reason: "missing_content",
        };
    }

    const normalizedType =
        normalizeType(type);

    console.log(
        "NORMALIZED NOTIFICATION TYPE:",
        normalizedType
    );

    /*
     * notifications.related_id is UUID.
     */
    let safeRelatedId = null;

    if (relatedId) {
        if (isValidUUID(relatedId)) {
            safeRelatedId = relatedId;

            console.log(
                "VALID RELATED UUID:",
                safeRelatedId
            );

        } else {
            console.warn(
                "createNotification: invalid UUID relatedId received:",
                relatedId
            );

            safeRelatedId = null;
        }
    }

    try {

        /*
        |--------------------------------------------------------------------------
        | CHECK USER PREFERENCE
        |--------------------------------------------------------------------------
        */

        console.log(
            "STEP 1: CHECKING USER PREFERENCE..."
        );

        const enabled =
            await isNotificationEnabled(
                recipientId,
                normalizedType
            );

        console.log(
            "NOTIFICATION PREFERENCE RESULT:",
            {
                recipientId,
                normalizedType,
                enabled,
            }
        );

        if (!enabled) {

            console.warn(
                "NOTIFICATION STOPPED: DISABLED BY USER PREFERENCE."
            );

            return {
                success: true,
                skipped: true,
                reason: "disabled_by_preference",
            };
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE
        |--------------------------------------------------------------------------
        */

        if (preventDuplicate && safeRelatedId) {

            console.log(
                "STEP 2: CHECKING NOTIFICATION DUPLICATE..."
            );

            console.log(
                "CHECKING NOTIFICATION DUPLICATE:",
                {
                    recipientId,
                    type: normalizedType,
                    relatedId: safeRelatedId,
                    relatedType,
                }
            );

            const duplicate =
                await hasRecentDuplicate({
                    recipientId,
                    type: normalizedType,
                    relatedId: safeRelatedId,
                    relatedType,
                });

            console.log(
                "NOTIFICATION DUPLICATE RESULT:",
                duplicate
            );

            if (duplicate) {

                console.warn(
                    "NOTIFICATION STOPPED: DUPLICATE DETECTED."
                );

                return {
                    success: true,
                    skipped: true,
                    reason: "duplicate",
                };
            }

        } else {

            console.log(
                "STEP 2: DUPLICATE CHECK SKIPPED.",
                {
                    preventDuplicate,
                    safeRelatedId,
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT NOTIFICATION
        |--------------------------------------------------------------------------
        */

        const insertPayload = {

            recipient_id:
                recipientId,

            type:
                normalizedType,

            title:
                title || "Notification",

            message:
                message || "",

            is_read:
                false,

            related_id:
                safeRelatedId,

            related_type:
                relatedType,

        };

        console.log(
            "STEP 3: INSERTING NOTIFICATION..."
        );

        console.log(
            "INSERTING NOTIFICATION PAYLOAD:",
            insertPayload
        );

        const {
            error: insertError,
        } = await supabase
            .from("notifications")
            .insert(
                insertPayload
            );

        console.log(
            "NOTIFICATION INSERT FINISHED:",
            {
                insertError,
            }
        );

        if (insertError) {

            console.error(
                "NOTIFICATION INSERT FAILED:",
                insertError
            );

            console.error(
                "INSERT ERROR DETAILS:",
                {
                    message: insertError?.message,
                    details: insertError?.details,
                    hint: insertError?.hint,
                    code: insertError?.code,
                }
            );

            return {
                success: false,
                skipped: false,
                error: insertError,
            };
        }

        console.log(
            "=================================================="
        );

        console.log(
            "NOTIFICATION INSERT SUCCESSFUL."
        );

        console.log(
            "CREATE NOTIFICATION END"
        );

        console.log(
            "=================================================="
        );

        return {
            success: true,
            skipped: false,
            data: null,
        };

    } catch (error) {

        console.error(
            "UNEXPECTED NOTIFICATION SERVICE ERROR:",
            error
        );

        console.error(
            "ERROR DETAILS:",
            {
                message: error?.message,
                stack: error?.stack,
            }
        );

        return {
            success: false,
            skipped: false,
            error,
        };
    }
}

/*
|--------------------------------------------------------------------------
| CREATE MULTIPLE NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export async function createNotifications(
    notifications = []
) {
    if (!Array.isArray(notifications)) {
        return {
            success: false,
            created: [],
            skipped: [],
            failed: [],
        };
    }

    const results = [];

    for (const notification of notifications) {
        const result =
            await createNotification(
                notification
            );

        results.push(result);
    }

    return {
        success: results.every(
            (result) => result.success
        ),

        created:
            results.filter(
                (result) =>
                    result.success &&
                    !result.skipped
            ),

        skipped:
            results.filter(
                (result) =>
                    result.success &&
                    result.skipped
            ),

        failed:
            results.filter(
                (result) =>
                    !result.success
            ),
    };
}

/*
|--------------------------------------------------------------------------
| GET USERS BY ROLE
|--------------------------------------------------------------------------
*/

export async function getUsersByRole(role) {
    if (!role) {
        return [];
    }

    const normalizedRole =
        String(role)
            .trim()
            .toLowerCase();

    const {
        data,
        error,
    } = await supabase
        .from("profiles")
        .select("id, role")
        .eq(
            "role",
            normalizedRole
        );

    if (error) {
        console.error(
            "Error finding users by role:",
            error
        );

        return [];
    }

    return data || [];
}

/*
|--------------------------------------------------------------------------
| NOTIFY ROLE
|--------------------------------------------------------------------------
*/

export async function notifyRole({
    role,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    preventDuplicate = true,
}) {
    const users =
        await getUsersByRole(role);

    if (!users.length) {
        return {
            success: true,
            created: [],
            skipped: [],
            failed: [],
        };
    }

    const notifications =
        users.map((user) => ({
            recipientId: user.id,
            type,
            title,
            message,
            relatedId,
            relatedType,
            preventDuplicate,
        }));

    return createNotifications(
        notifications
    );
}

/*
|--------------------------------------------------------------------------
| NOTIFY ADMINS
|--------------------------------------------------------------------------
*/

export async function notifyAdmins({
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    preventDuplicate = true,
}) {
    return notifyRole({
        role: "admin",
        type,
        title,
        message,
        relatedId,
        relatedType,
        preventDuplicate,
    });
}

/*
|--------------------------------------------------------------------------
| NOTIFY ASSESSOR
|--------------------------------------------------------------------------
*/

export async function notifyAssessor({
    assessorId,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    preventDuplicate = true,
}) {
    return createNotification({
        recipientId: assessorId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        preventDuplicate,
    });
}

/*
|--------------------------------------------------------------------------
| NOTIFY TRAINEE
|--------------------------------------------------------------------------
*/

export async function notifyTrainee({
    traineeId,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    preventDuplicate = true,
}) {
    return createNotification({
        recipientId: traineeId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        preventDuplicate,
    });
}

/*
|--------------------------------------------------------------------------
| ADMIN NOTIFICATION EVENTS
|--------------------------------------------------------------------------
*/

export async function notifyPendingApproval({
    userId,
    userName,
    role = "trainee",
}) {
    return notifyAdmins({
        type: "user_registration",

        title: "Pending Approval",

        message:
            `${userName || "A user"} has submitted a new ${role} registration for approval.`,

        relatedId: userId,

        relatedType: "user_registration",
    });
}

/*
 * New assessment result
 */

export async function notifyAdminNewResult({
    submissionId,
    traineeName,
    assessmentTitle,
}) {
    return notifyAdmins({
        type: "results",

        title: "New Assessment Result",

        message:
            `${traineeName || "A trainee"} has a new result for ${assessmentTitle || "an assessment"}.`,

        relatedId: submissionId,

        relatedType: "assessment_submission",
    });
}

/*
|--------------------------------------------------------------------------
| ASSESSOR NOTIFICATION EVENTS
|--------------------------------------------------------------------------
*/

export async function notifyAssessmentAssigned({
    assessorId,
    assignmentId,
    assessmentTitle,
}) {
    return notifyAssessor({
        assessorId,

        type: "assessment_assigned",

        title: "New Assessment Assigned",

        message:
            `You have been assigned ${assessmentTitle || "a new assessment"}.`,

        relatedId: assignmentId,

        relatedType: "assignment",
    });
}

export async function notifyAssessorSchedule({
    assessorId,
    assignmentId = null,
    relatedId = null,
    assessmentTitle,
}) {
    return notifyAssessor({
        assessorId,

        type: "assessment_scheduled",

        title: "Assessment Scheduled",

        message:
            `${assessmentTitle || "An assessment"} has been scheduled for you.`,

        relatedId:
            relatedId || assignmentId,

        relatedType: "assessment_batch",
    });
}

export async function notifyEvaluationCompleted({
    assessorId,
    submissionId,
    traineeName,
}) {
    return notifyAssessor({
        assessorId,

        type: "evaluation",

        title: "Evaluation Completed",

        message:
            `The evaluation progress for ${traineeName || "a trainee"} has been completed.`,

        relatedId: submissionId,

        relatedType: "assessment_submission",
    });
}

/*
|--------------------------------------------------------------------------
| TRAINEE NOTIFICATION EVENTS
|--------------------------------------------------------------------------
*/

export async function notifyTraineeSchedule({
    traineeId,
    assignmentId = null,
    relatedId = null,
    assessmentTitle,
}) {
    return notifyTrainee({
        traineeId,

        type: "assessment_scheduled",

        title: "Assessment Scheduled",

        message:
            `${assessmentTitle || "An assessment"} has been scheduled for you.`,

        relatedId:
            relatedId || assignmentId,

        relatedType: "assessment_batch",
    });
}

/*
 * Assessment result available
 */

export async function notifyTraineeResult({
    traineeId,
    submissionId,
    assessmentTitle,
    result,
}) {

    console.log(
        "=================================================="
    );

    console.log(
        "========== NOTIFY TRAINEE RESULT START =========="
    );

    console.log(
        "notifyTraineeResult input:",
        {
            traineeId,
            submissionId,
            assessmentTitle,
            result,
        }
    );

    if (!traineeId) {

        console.error(
            "notifyTraineeResult STOPPED: traineeId is missing."
        );

        return {
            success: false,
            skipped: true,
            reason: "missing_trainee_id",
        };
    }

    if (!submissionId) {

        console.error(
            "notifyTraineeResult WARNING: submissionId is missing."
        );
    }

    const notificationPayload = {

        recipientId:
            traineeId,

        type:
            "results",

        title:
            "Assessment Result Available",

        message:
            `Your result for ${assessmentTitle || "your assessment"} is now available${result ? `: ${result}` : "."}`,

        relatedId:
            submissionId,

        relatedType:
            "assessment_submission",

    };

    console.log(
        "notifyTraineeResult calling createNotification with:",
        notificationPayload
    );

    try {

        const response =
            await createNotification(
                notificationPayload
            );

        console.log(
            "notifyTraineeResult createNotification response:",
            response
        );

        console.log(
            "========== NOTIFY TRAINEE RESULT END =========="
        );

        console.log(
            "=================================================="
        );

        return response;

    } catch (error) {

        console.error(
            "notifyTraineeResult ERROR:",
            error
        );

        console.log(
            "========== NOTIFY TRAINEE RESULT FAILED =========="
        );

        console.log(
            "=================================================="
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| CERTIFICATE EARNED
|--------------------------------------------------------------------------
*/

export async function notifyCertificateEarned({
    traineeId,
    certificateId,
    certificateTitle,
}) {
    return notifyTrainee({
        traineeId,

        type: "certificate_earned",

        title: "Certificate Earned",

        message:
            `Congratulations! Your ${certificateTitle || "certificate"} is now available.`,

        relatedId: certificateId,

        relatedType: "certificate",
    });
}


/*
|--------------------------------------------------------------------------
| TEST TRAINEE RESULT NOTIFICATION
|--------------------------------------------------------------------------
|
| THIS IS DEBUG/TEST CODE ONLY.
|
| It uses the real trainee and submission IDs you provided.
|
|--------------------------------------------------------------------------
*/

export async function testTraineeResultNotification() {

    console.log(
        "##################################################"
    );

    console.log(
        "### TEST TRAINEE RESULT NOTIFICATION START ###"
    );

    const testTraineeId =
        "73723d08-ac1e-4c77-84c3-9846deb6a8c1";

    const testSubmissionId =
        "14f35727-bf76-4796-b434-5e3d9d831743";

    const testAssessmentTitle =
        "Advanced Robotics Assembly NC III - Set A";

    const testResult =
        "Not Yet Competent";

    console.log(
        "TEST DATA:",
        {
            testTraineeId,
            testSubmissionId,
            testAssessmentTitle,
            testResult,
        }
    );

    try {

        const result =
            await notifyTraineeResult({

                traineeId:
                    testTraineeId,

                submissionId:
                    testSubmissionId,

                assessmentTitle:
                    testAssessmentTitle,

                result:
                    testResult,

            });

        console.log(
            "##################################################"
        );

        console.log(
            "### TEST TRAINEE RESULT NOTIFICATION RESULT ###"
        );

        console.log(
            result
        );

        console.log(
            "##################################################"
        );

        return result;

    } catch (error) {

        console.error(
            "### TEST TRAINEE RESULT NOTIFICATION ERROR ###",
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default {

    createNotification,
    createNotifications,

    getAuthenticatedUser,
    getNotificationPreferences,
    isNotificationEnabled,

    getUsersByRole,
    notifyRole,

    notifyAdmins,
    notifyAssessor,
    notifyTrainee,

    notifyPendingApproval,
    notifyAdminNewResult,

    notifyAssessmentAssigned,
    notifyAssessorSchedule,
    notifyEvaluationCompleted,

    notifyTraineeSchedule,
    notifyTraineeResult,
    notifyCertificateEarned,


    testTraineeResultNotification,
};