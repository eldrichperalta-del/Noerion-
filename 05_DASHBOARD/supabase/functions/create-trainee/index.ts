import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ============================================================
// ENVIRONMENT
// ============================================================

const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const RESEND_API_KEY =
    Deno.env.get("RESEND_API_KEY") ?? "";

const EMAIL_FROM =
    Deno.env.get("EMAIL_FROM") ??
    "NOERION <onboarding@resend.dev>";


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
// CUSTOM PASSWORD-SETUP EMAIL
//
// IMPORTANT:
//
// Supabase's generateLink() ONLY GENERATES THE LINK.
//
// It does NOT send our custom email.
//
// This function sends the generated link through Resend.
//
// Required Edge Function secret:
//
// RESEND_API_KEY
//
// Optional Edge Function secret:
//
// EMAIL_FROM
//
// Example:
//
// EMAIL_FROM=NOERION <noreply@yourdomain.com>
// ============================================================

async function sendPasswordSetupEmail({
    email,
    firstName,
    passwordSetupLink,
}: {
    email: string;
    firstName: string;
    passwordSetupLink: string;
}) {

    // ----------------------------------------------------------
    // EMAIL PROVIDER CONFIGURATION CHECK
    // ----------------------------------------------------------

    if (!RESEND_API_KEY) {

        throw new Error(
            "RESEND_API_KEY is not configured. The trainee account was created, but the password-setup email could not be sent."
        );

    }


    // ----------------------------------------------------------
    // EMAIL CONTENT
    // ----------------------------------------------------------

    const subject =
        "Create Your NOERION Trainee Password";


    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Create Your NOERION Password</title>
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background: #eef4f8;
        font-family: Arial, Helvetica, sans-serif;
    "
>

    <div
        style="
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
        "
    >

        <div
            style="
                background: #001F5B;
                padding: 28px 32px;
                color: #ffffff;
            "
        >

            <h1
                style="
                    margin: 0;
                    font-size: 24px;
                "
            >
                NOERION
            </h1>

            <p
                style="
                    margin: 8px 0 0;
                    font-size: 14px;
                    opacity: 0.9;
                "
            >
                Trainee Account Setup
            </p>

        </div>


        <div
            style="
                padding: 32px;
                color: #1f2937;
            "
        >

            <h2
                style="
                    margin-top: 0;
                    color: #001F5B;
                "
            >
                Welcome, ${firstName}!
            </h2>


            <p
                style="
                    font-size: 15px;
                    line-height: 1.6;
                "
            >
                Your NOERION trainee account has been created by an
                administrator.
            </p>


            <p
                style="
                    font-size: 15px;
                    line-height: 1.6;
                "
            >
                Before you can sign in, you need to create your own
                password.
            </p>


            <div
                style="
                    text-align: center;
                    margin: 32px 0;
                "
            >

                <a
                    href="${passwordSetupLink}"
                    style="
                        display: inline-block;
                        background: #2563EB;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 14px 28px;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: bold;
                    "
                >
                    Create Your Password
                </a>

            </div>


            <p
                style="
                    font-size: 13px;
                    line-height: 1.6;
                    color: #6b7280;
                "
            >
                If the button above does not work, copy and paste the
                following link into your browser:
            </p>


            <p
                style="
                    font-size: 12px;
                    line-height: 1.5;
                    word-break: break-all;
                    color: #4b5563;
                "
            >
                ${passwordSetupLink}
            </p>


            <p
                style="
                    margin-top: 28px;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #6b7280;
                "
            >
                If you did not expect this account, please contact your
                training administrator.
            </p>

        </div>


        <div
            style="
                border-top: 1px solid #e5e7eb;
                padding: 20px 32px;
                color: #9ca3af;
                font-size: 12px;
                text-align: center;
            "
        >
            NOERION — AI-Driven Skill Evaluation System
        </div>

    </div>

</body>
</html>
`;


    // ----------------------------------------------------------
    // SEND THROUGH RESEND
    // ----------------------------------------------------------

    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",

            headers: {
                "Authorization":
                    `Bearer ${RESEND_API_KEY}`,

                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                from: EMAIL_FROM,

                to: [
                    email,
                ],

                subject,

                html,
            }),
        }
    );


    const responseBody =
        await response.text();


    if (!response.ok) {

        console.error(
            "RESEND EMAIL ERROR:",
            responseBody
        );

        throw new Error(
            `Password-setup email could not be sent: ${responseBody}`
        );

    }


    console.log(
        "PASSWORD-SETUP EMAIL SENT:",
        email
    );


    return true;
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
            // 9. CREATE AUTH USER
            //
            // IMPORTANT:
            //
            // We DO NOT use inviteUserByEmail().
            //
            // The account is created immediately.
            //
            // The trainee will receive our custom password-setup
            // email later in this function.
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
                "CREATING TRAINEE AUTH USER..."
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
                data: authUserData,

                error:
                    authUserError,

            } =
                await supabaseAdmin.auth.admin.createUser({

                    email,

                    email_confirm:
                        true,

                    user_metadata: {

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

                });


            if (
                authUserError
            ) {

                console.error(
                    "TRAINEE AUTH USER ERROR:",
                    authUserError
                );


                throw new Error(
                    `Unable to create trainee authentication account: ${authUserError.message}`
                );

            }


            const traineeUser =
                authUserData?.user;


            if (
                !traineeUser?.id
            ) {

                throw new Error(
                    "Trainee authentication account was created but no user ID was returned."
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

                        is_approved:
                            false,

                        registration_status:
                            "Pending",

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
            // 12. GENERATE PASSWORD-SETUP LINK
            //
            // IMPORTANT:
            //
            // This runs ONLY AFTER:
            //
            // - Auth user exists
            // - profiles exists
            // - trainee_profiles exists
            //
            // This is NOT inviteUserByEmail().
            //
            // The account already exists.
            //
            // generateLink() creates the recovery/password setup
            // action link that redirects to:
            //
            // /set-password
            // ========================================================

            console.log(
                "GENERATING TRAINEE PASSWORD SETUP LINK..."
            );


            const {
                data:
                    passwordLinkData,

                error:
                    passwordLinkError,

            } =
                await supabaseAdmin.auth.admin.generateLink({

                    type:
                        "recovery",

                    email,

                    options: {

                        redirectTo,

                    },

                });


            if (
                passwordLinkError
            ) {

                console.error(
                    "PASSWORD SETUP LINK ERROR:",
                    passwordLinkError
                );


                // ----------------------------------------------------
                // CLEAN UP ALL CREATED DATA
                // ----------------------------------------------------

                await supabaseAdmin

                    .from("trainee_profiles")

                    .delete()

                    .eq(
                        "user_id",
                        traineeUserId
                    );


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
                    `Unable to generate trainee password setup link: ${passwordLinkError.message}`
                );

            }


            const passwordSetupLink =
                passwordLinkData
                    ?.properties
                    ?.action_link;


            if (
                !passwordSetupLink
            ) {

                console.error(
                    "NO PASSWORD SETUP LINK RETURNED."
                );


                // ----------------------------------------------------
                // CLEAN UP ALL CREATED DATA
                // ----------------------------------------------------

                await supabaseAdmin

                    .from("trainee_profiles")

                    .delete()

                    .eq(
                        "user_id",
                        traineeUserId
                    );


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
                    "Trainee account was created but no password setup link was generated."
                );

            }


            console.log(
                "PASSWORD SETUP LINK GENERATED."
            );


            // ========================================================
            // SECURITY NOTE:
            //
            // Do NOT log the actual password setup link in production.
            //
            // The link contains a sensitive recovery token.
            // ========================================================

            console.log(
                "PASSWORD SETUP REDIRECT READY:",
                redirectTo
            );


            // ========================================================
            // 13. CUSTOM PASSWORD-SETUP EMAIL
            //
            // ========================================================
            //
            // THIS IS THE CUSTOM EMAIL SECTION.
            //
            // The passwordSetupLink generated above is passed to
            // the email function.
            //
            // The trainee receives:
            //
            // "Your NOERION trainee account has been created."
            //
            // followed by:
            //
            // [ Create Your Password ]
            //
            // The button opens the generated Supabase recovery link
            // and eventually redirects to:
            //
            // /set-password
            //
            // ========================================================

            console.log(
                "SENDING CUSTOM PASSWORD SETUP EMAIL..."
            );


            try {

                await sendPasswordSetupEmail({

                    email,

                    firstName,

                    passwordSetupLink,

                });

            }

            catch (emailError) {

                console.error(
                    "PASSWORD SETUP EMAIL ERROR:",
                    emailError
                );


                // ----------------------------------------------------
                // IMPORTANT:
                //
                // The Auth user and database records already exist.
                //
                // We do NOT silently claim the email was sent.
                //
                // For now, clean everything up so the administrator
                // does not end up with an account that was never given
                // its password setup email.
                // ----------------------------------------------------

                await supabaseAdmin

                    .from("trainee_profiles")

                    .delete()

                    .eq(
                        "user_id",
                        traineeUserId
                    );


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
                    emailError instanceof Error
                        ? emailError.message
                        : "The trainee account was created, but the password-setup email could not be sent."
                );

            }


            // ========================================================
            // 14. SUCCESS
            // ========================================================

            return jsonResponse(
                {

                    success:
                        true,

                    user_id:
                        traineeUserId,

                    email,

                    message:
                        "Trainee account and profile were created successfully. A password-setup email has been sent to the trainee.",

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

