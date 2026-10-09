import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ============================================================
// ENVIRONMENT
// ============================================================

const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";


// ============================================================
// SUPABASE ADMIN CLIENT
// ============================================================

const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);


// ============================================================
// CORS
// ============================================================

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};


// ============================================================
// HELPERS
// ============================================================

function jsonResponse(
    body: Record<string, unknown>,
    status = 200
) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        }
    );
}


function cleanString(
    value: unknown
): string {
    return String(
        value ?? ""
    ).trim();
}


// ============================================================
// REQUEST HANDLER
// ============================================================

Deno.serve(
    async (request) => {

        // ==========================================================
        // CORS PREFLIGHT
        // ==========================================================

        if (
            request.method ===
            "OPTIONS"
        ) {

            return new Response(
                "ok",
                {
                    headers:
                        corsHeaders,
                }
            );

        }


        // ==========================================================
        // ONLY POST
        // ==========================================================

        if (
            request.method !==
            "POST"
        ) {

            return jsonResponse(
                {
                    success: false,
                    error:
                        "Method not allowed.",
                },
                405
            );

        }


        try {

            // ========================================================
            // 1. VERIFY ENVIRONMENT
            // ========================================================

            if (
                !SUPABASE_URL ||
                !SUPABASE_SERVICE_ROLE_KEY
            ) {

                throw new Error(
                    "Supabase server configuration is missing."
                );

            }


            // ========================================================
            // 2. AUTHENTICATE CALLING ADMIN
            // ========================================================

            const authorization =
                request.headers.get(
                    "Authorization"
                );


            if (
                !authorization
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Authorization header is required.",
                    },
                    401
                );

            }


            const token =
                authorization.replace(
                    /^Bearer\s+/i,
                    ""
                );


            if (!token) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Invalid authorization token.",
                    },
                    401
                );

            }


            // Use a normal authenticated client to
            // identify the caller.

            const supabaseUser =
                createClient(
                    SUPABASE_URL,

                    Deno.env.get(
                        "SUPABASE_ANON_KEY"
                    ) ?? "",

                    {
                        global: {
                            headers: {
                                Authorization:
                                    authorization,
                            },
                        },
                    }
                );


            const {
                data: {
                    user: caller,
                },

                error:
                callerError,

            } =
                await supabaseUser.auth.getUser(
                    token
                );


            if (
                callerError ||
                !caller
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Your session is invalid or expired.",
                    },
                    401
                );

            }


            // ========================================================
            // 3. CHECK CALLER PROFILE / ROLE
            // ========================================================

            const {
                data: callerProfile,

                error:
                callerProfileError,

            } =
                await supabaseAdmin

                    .from("profiles")

                    .select(
                        `
                            id,
                            role
                        `
                    )

                    .eq(
                        "id",
                        caller.id
                    )

                    .maybeSingle();


            if (
                callerProfileError
            ) {

                throw new Error(
                    `Unable to verify administrator permissions: ${callerProfileError.message}`
                );

            }


            const callerRole =
                String(
                    callerProfile?.role ??
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                callerRole !==
                "admin" &&
                callerRole !==
                "administrator"
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Only an administrator can create a trainee account.",
                    },
                    403
                );

            }


            // ========================================================
            // 4. READ REQUEST BODY
            // ========================================================

            const body =
                await request.json();


            const traineeData =
                body?.traineeData ?? {};


            const trainingData =
                body?.trainingData ?? {};


            // ========================================================
            // 5. NORMALIZE DATA
            // ========================================================

            const firstName =
                cleanString(
                    traineeData.firstName
                );


            const middleName =
                cleanString(
                    traineeData.middleName
                );


            const lastName =
                cleanString(
                    traineeData.lastName
                );


            const suffix =
                cleanString(
                    traineeData.suffix
                );


            const gender =
                cleanString(
                    traineeData.gender
                );


            const birthDate =
                cleanString(
                    traineeData.birthDate
                );


            const contactNumber =
                cleanString(
                    traineeData.contactNumber
                );


            const email =
                cleanString(
                    traineeData.email
                ).toLowerCase();


            const trainingCenter =
                cleanString(
                    trainingData.trainingCenter
                );


            const ncLevel =
                cleanString(
                    trainingData.ncLevel
                );


            const qualificationCourse =
                cleanString(
                    trainingData.qualificationCourse
                );


            const batch =
                cleanString(
                    trainingData.batch
                );


            // ========================================================
            // 6. REQUIRED FIELD VALIDATION
            // ========================================================

            if (
                !firstName ||
                !lastName ||
                !gender ||
                !birthDate ||
                !contactNumber ||
                !email
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "First name, last name, gender, birth date, contact number, and email are required.",
                    },
                    400
                );

            }


            if (
                !trainingCenter ||
                !ncLevel ||
                !qualificationCourse
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Training center, NC level, and qualification course are required.",
                    },
                    400
                );

            }


            // ========================================================
            // 7. BASIC EMAIL VALIDATION
            // ========================================================

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailRegex.test(email)
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "Please provide a valid email address.",
                    },
                    400
                );

            }


            // ========================================================
            // 8. CHECK EXISTING PROFILE
            // ========================================================

            const {
                data:
                existingProfile,

                error:
                existingProfileError,

            } =
                await supabaseAdmin

                    .from("profiles")

                    .select(
                        "id, email"
                    )

                    .eq(
                        "email",
                        email
                    )

                    .maybeSingle();


            if (
                existingProfileError
            ) {

                throw new Error(
                    `Unable to check existing trainee email: ${existingProfileError.message}`
                );

            }


            if (
                existingProfile
            ) {

                return jsonResponse(
                    {
                        success: false,
                        error:
                            "A user with this email address already exists.",
                    },
                    409
                );

            }


            // ========================================================
            // 9. CREATE AUTH USER + SEND SUPABASE INVITATION
            //
            // This follows the same mechanism used by Add Assessor.
            // Supabase Auth creates the account and sends the invitation
            // email automatically. No Resend API is used here.
            // ========================================================

            const appUrl =
                Deno.env.get(
                    "APP_URL"
                );

            if (!appUrl) {

                throw new Error(
                    "Server configuration error. APP_URL is missing."
                );

            }

            const redirectTo =
                `${appUrl.replace(/\/+$/, "")}/set-password`;

            console.log(
                "CREATING TRAINEE AUTH USER AND SENDING INVITATION..."
            );

            console.log(
                "TRAINEE EMAIL:",
                email
            );

            console.log(
                "PASSWORD SETUP REDIRECT:",
                redirectTo
            );

            const {
                data: invitationData,
                error:
                invitationError,

            } =
                await supabaseAdmin.auth.admin.inviteUserByEmail(
                    email,
                    {
                        data: {
                            first_name:
                                firstName,

                            middle_name:
                                middleName ||
                                null,

                            last_name:
                                lastName,

                            suffix:
                                suffix ||
                                null,

                            role:
                                "trainee",
                        },

                        redirectTo,
                    }
                );

            if (
                invitationError
            ) {

                console.error(
                    "TRAINEE INVITATION ERROR:",
                    invitationError
                );

                throw new Error(
                    `Unable to send trainee invitation: ${invitationError.message}`
                );

            }

            const traineeUser =
                invitationData?.user;

            if (
                !traineeUser?.id
            ) {

                throw new Error(
                    "Trainee invitation was sent but no user ID was returned."
                );

            }

            const traineeUserId =
                traineeUser.id;

            console.log(
                "TRAINEE AUTH USER CREATED."
            );

            console.log(
                "TRAINEE USER ID:",
                traineeUserId
            );


            // ========================================================
            // 10. CREATE / UPDATE PROFILE
            //
            // The database trigger creates the profiles row
            // automatically.
            //
            // Therefore we UPDATE it instead of INSERTING.
            // ========================================================

            const {
                data: savedProfile,

                error:
                profileError,

            } =
                await supabaseAdmin

                    .from("profiles")

                    .update({

                        email,

                        role:
                            "trainee",

                        first_name:
                            firstName,

                        middle_name:
                            middleName ||
                            null,

                        last_name:
                            lastName,

                        suffix:
                            suffix ||
                            null,

                        gender,

                        date_of_birth:
                            birthDate,

                        contact_number:
                            contactNumber,

                        is_approved: true,
                        registration_status: "Approved",

                        rejected_reason:
                            null,

                    })

                    .eq(
                        "id",
                        traineeUserId
                    )

                    .select("id")

                    .maybeSingle();


            // ========================================================
            // VERIFY PROFILE WAS SAVED
            // ========================================================

            if (
                profileError
            ) {

                await supabaseAdmin.auth.admin.deleteUser(
                    traineeUserId
                );


                throw new Error(
                    `Trainee authentication account was created, but the profile could not be saved: ${profileError.message}`
                );

            }


            if (
                !savedProfile
            ) {

                await supabaseAdmin.auth.admin.deleteUser(
                    traineeUserId
                );


                throw new Error(
                    "Trainee authentication account was created, but the automatically-created profile could not be found."
                );

            }


            // ========================================================
            // 11. CREATE TRAINEE PROFILE
            // ========================================================

            const {
                error:
                traineeProfileError,

            } =
                await supabaseAdmin

                    .from("trainee_profiles")

                    .insert({

                        user_id:
                            traineeUserId,

                        training_center:
                            trainingCenter,

                        nc_level:
                            ncLevel,

                        qualification_course:
                            qualificationCourse,

                        batch:
                            batch ||
                            null,

                        profile_photo_url:
                            null,

                    });


            // ========================================================
            // IMPORTANT:
            //
            // If trainee_profiles creation FAILS,
            // STOP HERE.
            //
            // DO NOT generate a password link.
            // ========================================================

            if (
                traineeProfileError
            ) {

                await supabaseAdmin

                    .from("profiles")

                    .delete()

                    .eq(
                        "id",
                        traineeUserId
                    );


                await supabaseAdmin.auth.admin.deleteUser(
                    traineeUserId
                );


                throw new Error(
                    `Trainee profile could not be created: ${traineeProfileError.message}`
                );

            }


            // ========================================================
            // 12. SUCCESS
            // ========================================================

            return jsonResponse(
                {

                    success:
                        true,

                    user_id:
                        traineeUserId,

                    email,

                    message:
                        "Trainee account and profile were created successfully. A password-setup invitation email has been sent to the trainee.",

                },

                200
            );

        }

        catch (error) {

            console.error(
                "create-trainee error:",
                error
            );


            return jsonResponse(
                {

                    success:
                        false,

                    error:
                        error instanceof Error

                            ? error.message

                            : "Unexpected error while creating trainee.",

                },

                500
            );

        }

    }
);

