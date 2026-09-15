import {
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
    Navigate,
} from "react-router-dom";

import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    ImagePlus,
    X,
} from "lucide-react";

import {
    supabase,
} from "../../../supabaseClient";

import {
    notifyPendingApproval,
} from "../../../services/notificationService";

import {
    FunctionsFetchError as SupabaseFunctionsFetchError,
    FunctionsHttpError as SupabaseFunctionsHttpError,
    FunctionsRelayError as SupabaseFunctionsRelayError,
} from "@supabase/supabase-js";

import AddTraineeStepper from "./AddTraineeStepper";

import FormProgressSidebar from "./FormProgressSidebar";


// ============================================================
// STORAGE
// ============================================================

const STORAGE_BUCKET =
    "trainee-documents";


// ============================================================
// CREATE SAFE FILE NAME
// ============================================================

function createSafeFileName(file) {
    const fileName =
        file?.name || "profile-photo.jpg";

    const lastDot =
        fileName.lastIndexOf(".");

    const name =
        lastDot > -1
            ? fileName.substring(
                0,
                lastDot
            )
            : fileName;

    const extension =
        lastDot > -1
            ? fileName.substring(
                lastDot
            )
            : ".jpg";

    const safeName =
        name
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )
            .replace(
                /_+/g,
                "_"
            );

    return `${Date.now()}-${safeName}${extension}`;
}


// ============================================================
// COMPONENT
// ============================================================

function VerificationDocuments() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    // ============================================================
    // GET DATA FROM PREVIOUS STEPS
    // ============================================================

    const traineeData =
        location.state?.traineeData;

    const trainingData =
        location.state?.trainingData;


    // ============================================================
    // PROFILE PHOTO STATE
    // ============================================================

    const [
        photoFile,
        setPhotoFile,
    ] = useState(null);

    const [
        photoPreview,
        setPhotoPreview,
    ] = useState("");

    const [
        photoInputKey,
        setPhotoInputKey,
    ] = useState(0);


    // ============================================================
    // SUBMISSION STATE
    // ============================================================

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");


    // ============================================================
    // SUCCESS DIALOG
    // ============================================================

    const [
        showSuccessDialog,
        setShowSuccessDialog,
    ] = useState(false);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");


    // ============================================================
    // ROUTE GUARD
    // ============================================================

    if (
        !traineeData ||
        !trainingData
    ) {
        return (
            <Navigate
                to="/admin/user-management/add-trainee"
                replace
            />
        );
    }


    // ============================================================
    // CLEAN UP PHOTO PREVIEW
    // ============================================================

    useEffect(() => {

        return () => {

            if (
                photoPreview
            ) {
                URL.revokeObjectURL(
                    photoPreview
                );
            }

        };

    }, [
        photoPreview,
    ]);


    // ============================================================
    // PROFILE PHOTO CHANGE
    // ============================================================

    const handlePhotoChange =
        (event) => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }


            // --------------------------------------------------------
            // FILE TYPE
            // --------------------------------------------------------

            const allowedTypes = [
                "image/jpeg",
                "image/png",
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                setErrorMessage(
                    "Please upload a JPG or PNG image."
                );

                event.target.value =
                    "";

                return;
            }


            // --------------------------------------------------------
            // FILE SIZE
            // --------------------------------------------------------

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setErrorMessage(
                    "Profile photo must not exceed 5 MB."
                );

                event.target.value =
                    "";

                return;
            }


            // --------------------------------------------------------
            // CLEAN OLD PREVIEW
            // --------------------------------------------------------

            if (
                photoPreview
            ) {
                URL.revokeObjectURL(
                    photoPreview
                );
            }


            // --------------------------------------------------------
            // CREATE NEW PREVIEW
            // --------------------------------------------------------

            const previewUrl =
                URL.createObjectURL(
                    file
                );


            setErrorMessage("");

            setPhotoFile(
                file
            );

            setPhotoPreview(
                previewUrl
            );

        };


    // ============================================================
    // REMOVE PROFILE PHOTO
    // ============================================================

    const handleRemovePhoto =
        () => {

            if (
                photoPreview
            ) {
                URL.revokeObjectURL(
                    photoPreview
                );
            }


            setPhotoFile(
                null
            );

            setPhotoPreview(
                ""
            );


            setPhotoInputKey(
                (current) =>
                    current + 1
            );

        };


    // ============================================================
    // VALIDATION
    // ============================================================

    const hasProfilePhoto =
        Boolean(
            photoFile
        );

    const isStepThreeComplete =
        hasProfilePhoto;


    // ============================================================
    // BACK
    // ============================================================

    const handleBack =
        () => {

            if (isSubmitting) {
                return;
            }

            navigate(
                "/admin/user-management/add-trainee/training-information",
                {
                    state: {
                        traineeData,
                        trainingData,
                    },
                }
            );

        };


    // ============================================================
    // CANCEL
    // ============================================================

    const handleCancel =
        () => {

            if (isSubmitting) {
                return;
            }

            navigate(
                "/admin/user-management/trainees"
            );

        };


    // ============================================================
    // FINAL SUBMISSION
    //
    // THIS IS THE IMPORTANT FIX.
    //
    // Step 3 now submits directly instead of navigating to
    // /add-trainee/create.
    // ============================================================

    const handleSubmit =
        async () => {

            if (
                !isStepThreeComplete
            ) {

                setErrorMessage(
                    "Please upload the required profile photo before completing registration."
                );

                return;
            }


            try {

                setIsSubmitting(
                    true
                );

                setErrorMessage("");


                // ==================================================
                // 1. CHECK ADMIN SESSION
                // ==================================================

                console.log(
                    "========================================"
                );

                console.log(
                    "STARTING TRAINEE REGISTRATION"
                );

                console.log(
                    "========================================"
                );


                const {
                    data: {
                        session,
                    },
                    error:
                    sessionError,
                } =
                    await supabase
                        .auth
                        .getSession();


                if (
                    sessionError
                ) {
                    throw sessionError;
                }


                if (
                    !session
                ) {

                    throw new Error(
                        "No active admin session found. Please log out and log in again."
                    );

                }


                console.log(
                    "ADMIN SESSION VERIFIED"
                );


                // ==================================================
                // 2. CREATE TRAINEE ACCOUNT
                //
                // IMPORTANT:
                // The Edge Function creates the auth user and
                // trainee database records.
                // ==================================================

                console.log(
                    "CALLING create-trainee EDGE FUNCTION..."
                );

                console.log(
                    "TRAINEE DATA:",
                    traineeData
                );

                console.log(
                    "TRAINING DATA:",
                    trainingData
                );


                const {
                    data:
                    createResult,
                    error:
                    createError,
                } =
                    await supabase
                        .functions
                        .invoke(
                            "create-trainee",
                            {
                                body: {
                                    traineeData,
                                    trainingData,
                                },
                            }
                        );


                // ==================================================
                // 3. HANDLE EDGE FUNCTION ERROR
                // ==================================================

                if (
                    createError
                ) {

                    console.error(
                        "CREATE TRAINEE FUNCTION ERROR:",
                        createError
                    );


                    if (
                        createError instanceof
                        SupabaseFunctionsHttpError
                    ) {

                        let errorResponse =
                            null;


                        try {

                            if (
                                createError.context
                            ) {

                                errorResponse =
                                    await createError
                                        .context
                                        .json();

                            }

                        } catch (
                        responseReadError
                        ) {

                            console.error(
                                "FAILED TO READ EDGE FUNCTION ERROR BODY:",
                                responseReadError
                            );

                        }


                        throw new Error(
                            errorResponse?.message ||
                            errorResponse?.error ||
                            createError.message ||
                            "The server could not create the trainee."
                        );

                    }


                    if (
                        createError instanceof
                        SupabaseFunctionsRelayError
                    ) {

                        throw new Error(
                            createError.message ||
                            "Unable to communicate with the trainee creation service."
                        );

                    }


                    if (
                        createError instanceof
                        SupabaseFunctionsFetchError
                    ) {

                        throw new Error(
                            createError.message ||
                            "Unable to reach the trainee creation service."
                        );

                    }


                    throw new Error(
                        createError.message ||
                        "The server could not create the trainee."
                    );

                }


                // ==================================================
                // 4. VALIDATE EDGE FUNCTION RESPONSE
                // ==================================================

                console.log(
                    "CREATE TRAINEE RESPONSE:",
                    createResult
                );


                if (
                    !createResult
                ) {

                    throw new Error(
                        "The server returned an empty response."
                    );

                }


                if (
                    createResult.success ===
                    false
                ) {

                    throw new Error(
                        createResult.message ||
                        createResult.error ||
                        "Unable to create trainee."
                    );

                }


                if (
                    !createResult.user_id
                ) {

                    throw new Error(
                        "The trainee account was created, but the server did not return the trainee user ID."
                    );

                }


                const traineeUserId =
                    createResult.user_id;


                console.log(
                    "TRAINEE USER ID:",
                    traineeUserId
                );


                // ==================================================
                // 5. UPLOAD PROFILE PHOTO
                // ==================================================

                console.log(
                    "STARTING PROFILE PHOTO UPLOAD..."
                );


                const safeFileName =
                    createSafeFileName(
                        photoFile
                    );


                const fileExtension =
                    photoFile.name
                        ?.split(".")
                        .pop()
                        ?.toLowerCase() ||
                    "jpg";


                const safeExtension =
                    [
                        "jpg",
                        "jpeg",
                        "png",
                    ].includes(
                        fileExtension
                    )
                        ? fileExtension
                        : "jpg";


                const storagePath =
                    `profile-photos/${traineeUserId}/profile-photo.${safeExtension}`;


                console.log(
                    "PHOTO STORAGE PATH:",
                    storagePath
                );


                const {
                    data:
                    uploadData,
                    error:
                    uploadError,
                } =
                    await supabase
                        .storage
                        .from(
                            STORAGE_BUCKET
                        )
                        .upload(
                            storagePath,
                            photoFile,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    true,

                                contentType:
                                    photoFile.type,
                            }
                        );


                if (
                    uploadError
                ) {

                    console.error(
                        "PROFILE PHOTO UPLOAD ERROR:",
                        uploadError
                    );


                    throw new Error(
                        `Trainee account was created, but the profile photo could not be uploaded: ${uploadError.message}`
                    );

                }


                console.log(
                    "PROFILE PHOTO UPLOAD SUCCESS:",
                    uploadData
                );


                // ==================================================
                // 6. GET PUBLIC URL
                // ==================================================

                const {
                    data:
                    publicUrlData,
                } =
                    supabase
                        .storage
                        .from(
                            STORAGE_BUCKET
                        )
                        .getPublicUrl(
                            storagePath
                        );


                const profilePhotoUrl =
                    publicUrlData?.publicUrl;


                console.log(
                    "PROFILE PHOTO URL:",
                    profilePhotoUrl
                );


                if (
                    !profilePhotoUrl
                ) {

                    throw new Error(
                        "The profile photo was uploaded, but its public URL could not be generated."
                    );

                }


                // ============================================================
                // SAVE PROFILE PHOTO URL TO PROFILES
                // ============================================================

                console.log(
                    "========================================"
                );

                console.log(
                    "SAVING PROFILE PHOTO URL TO PROFILES..."
                );

                console.log(
                    "TRAINEE USER ID:",
                    traineeUserId
                );

                console.log(
                    "PROFILE PHOTO URL:",
                    profilePhotoUrl
                );

                console.log(
                    "========================================"
                );

                const {
                    data: updatedProfile,
                    error: profilePhotoError,
                } = await supabase
                    .from("profiles")
                    .update({
                        profile_photo_url:
                            profilePhotoUrl,
                    })
                    .eq(
                        "id",
                        traineeUserId
                    )

                    .select(
                        "id, email, profile_photo_url"
                    )
                    .single();

                if (profilePhotoError) {
                    throw new Error(
                        `The profile photo was uploaded, but the profile record could not be updated: ${profilePhotoError.message}`
                    );
                }

                if (
                    !updatedProfile ||
                    !updatedProfile.profile_photo_url
                ) {
                    throw new Error(
                        "The profile photo was uploaded, but the profile photo URL was not saved."
                    );
                }

                console.log(
                    "PROFILE PHOTO DATABASE UPDATE SUCCESS:",
                    updatedProfile
                );

                // ============================================================
                // SAVE PROFILE PHOTO URL TO TRAINEE_PROFILES
                // ============================================================

                console.log(
                    "========================================"
                );

                console.log(
                    "SAVING PROFILE PHOTO URL TO TRAINEE_PROFILES..."
                );

                console.log(
                    "TRAINEE USER ID:",
                    traineeUserId
                );

                console.log(
                    "PROFILE PHOTO URL:",
                    profilePhotoUrl
                );

                console.log(
                    "========================================"
                );


                // ============================================================
                // 1. VERIFY TRAINEE PROFILE ROW EXISTS
                // ============================================================

                const {
                    data: traineeProfileRow,
                    error: traineeProfileLookupError,
                } = await supabase
                    .from("trainee_profiles")
                    .select(
                        "user_id, profile_photo_url"
                    )
                    .eq(
                        "user_id",
                        traineeUserId
                    )
                    .maybeSingle();


                if (traineeProfileLookupError) {

                    console.error(
                        "TRAINEE PROFILE LOOKUP ERROR:",
                        traineeProfileLookupError
                    );

                    throw new Error(
                        `The profile photo was saved to profiles, but trainee_profiles could not be checked: ${traineeProfileLookupError.message}`
                    );
                }


                if (!traineeProfileRow) {

                    console.error(
                        "TRAINEE PROFILE ROW NOT FOUND:",
                        traineeUserId
                    );

                    throw new Error(
                        "The profile photo was saved to profiles, but no trainee_profiles record was found for the new trainee."
                    );
                }


                console.log(
                    "TRAINEE PROFILE ROW FOUND:",
                    traineeProfileRow
                );


                // ============================================================
                // 2. UPDATE TRAINEE PROFILE PHOTO
                // ============================================================

                const {
                    data: updatedTraineeProfile,
                    error: traineeProfilePhotoError,
                } = await supabase
                    .from("trainee_profiles")
                    .update({
                        profile_photo_url:
                            profilePhotoUrl,
                    })
                    .eq(
                        "user_id",
                        traineeUserId
                    )
                    .select(
                        "user_id, profile_photo_url"
                    )
                    .maybeSingle();


                if (traineeProfilePhotoError) {

                    console.error(
                        "TRAINEE PROFILE PHOTO DATABASE UPDATE ERROR:",
                        traineeProfilePhotoError
                    );

                    throw new Error(
                        `The profile photo was saved to profiles, but trainee_profiles could not be updated: ${traineeProfilePhotoError.message}`
                    );
                }


                // ============================================================
                // 3. VERIFY THE UPDATE ACTUALLY RETURNED A ROW
                // ============================================================

                if (!updatedTraineeProfile) {

                    console.error(
                        "TRAINEE PROFILE PHOTO UPDATE RETURNED NO ROW:",
                        {
                            traineeUserId,
                            profilePhotoUrl,
                        }
                    );

                    throw new Error(
                        "The profile photo was saved to profiles, but trainee_profiles was not updated."
                    );
                }


                // ============================================================
                // 4. VERIFY THE URL WAS SAVED
                // ============================================================

                if (
                    updatedTraineeProfile.profile_photo_url !==
                    profilePhotoUrl
                ) {

                    console.error(
                        "TRAINEE PROFILE PHOTO URL VERIFICATION FAILED:",
                        {
                            expected:
                                profilePhotoUrl,

                            actual:
                                updatedTraineeProfile.profile_photo_url,
                        }
                    );

                    throw new Error(
                        "The profile photo was saved to profiles, but the trainee_profiles photo URL could not be verified."
                    );
                }


                console.log(
                    "TRAINEE PROFILE PHOTO DATABASE UPDATE SUCCESS:",
                    updatedTraineeProfile
                );

                // ==================================================
                // SEND PENDING TRAINEE REGISTRATION NOTIFICATION
                //
                // The trainee has now been successfully created.
                // Notify Admin that the new trainee is pending review.
                //
                // IMPORTANT:
                // Do not use assignments.id or another bigint here.
                // traineeUserId is the auth/profile UUID and is safe
                // for notifications.related_id.
                // ==================================================

                // 7. NOTIFY ADMINS OF PENDING TRAINEE REGISTRATION
                try {
                    await notifyPendingApproval({
                        userId: traineeUserId,
                        userName:
                            `${traineeData.firstName || ""} ${traineeData.lastName || ""}`.trim(),
                        role: "trainee",
                    });
                } catch (notificationError) {
                    // Notification failure should not invalidate an already-created trainee.
                    console.error(
                        "Failed to send pending trainee registration notification:",
                        notificationError
                    );
                }
                // ==================================================
                // 8. SUCCESS
                // ==================================================

                console.log(
                    "========================================"
                );

                console.log(
                    "TRAINEE REGISTRATION COMPLETED"
                );

                console.log(
                    "========================================"
                );


                setSuccessMessage(
                    createResult.message ||
                    "The trainee account, profile, training information, and profile photo were saved successfully."
                );


                setShowSuccessDialog(
                    true
                );


            } catch (
            error
            ) {

                console.error(
                    "========================================"
                );

                console.error(
                    "TRAINEE REGISTRATION FAILED:"
                );

                console.error(
                    error
                );

                console.error(
                    "========================================"
                );


                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "An error occurred while creating the trainee."
                );

            } finally {

                setIsSubmitting(
                    false
                );

            }

        };


    // ============================================================
    // SUCCESS CONTINUE
    // ============================================================

    const handleSuccessContinue =
        () => {

            setShowSuccessDialog(
                false
            );

            navigate(
                "/admin/user-management/trainees",
                {
                    replace: true,
                }
            );

        };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="px-6 pt-4 pb-6">

            {/* ======================================================
                PAGE HEADER
            ====================================================== */}

            <div className="mb-4">

                <h1 className="text-2xl font-bold text-[#15294b]">
                    Add New Trainee
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    Upload the required document to complete the trainee
                    registration.
                </p>

            </div>


            {/* ======================================================
                STEPPER
            ====================================================== */}

            <AddTraineeStepper
                currentStep={3}
            />


            {/* ======================================================
                MAIN CONTENT
            ====================================================== */}

            <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-6">

                {/* ====================================================
                    VERIFICATION FORM
                ==================================================== */}

                <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    {/* ERROR */}

                    {errorMessage && (

                        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                            <AlertCircle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />

                            <div>
                                {errorMessage}
                            </div>

                        </div>

                    )}


                    {/* TITLE */}

                    <div className="mb-6">

                        <h2 className="text-lg font-bold text-[#15294b]">
                            Verification Documents
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Upload the required profile photo to complete
                            the trainee registration.
                        </p>

                    </div>


                    {/* ==================================================
                        PROFILE PHOTO
                    ================================================== */}

                    <div className="mb-8">

                        <div className="mb-3">

                            <h3 className="text-base font-semibold text-gray-800">

                                Profile Photo

                                <span className="ml-1 text-red-500">
                                    *
                                </span>

                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload a recent formal ID photo of the
                                trainee.
                            </p>

                        </div>


                        {photoPreview ? (

                            <div className="flex w-fit items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

                                <img
                                    src={photoPreview}
                                    alt="Profile preview"
                                    className="h-28 w-28 rounded-lg border border-gray-300 object-cover"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-gray-800">
                                        {photoFile?.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Profile photo selected successfully.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            handleRemovePhoto
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >

                                        <X
                                            size={14}
                                        />

                                        Remove Photo

                                    </button>

                                </div>

                            </div>

                        ) : (

                            <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-[#15294b] hover:bg-blue-50/30">

                                <input
                                    key={
                                        photoInputKey
                                    }
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={
                                        handlePhotoChange
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                    className="hidden"
                                />

                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#15294b]/10 text-[#15294b]">

                                    <ImagePlus
                                        size={24}
                                    />

                                </div>

                                <p className="text-sm font-semibold text-gray-800">
                                    Upload Profile Photo
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    JPG or PNG · Maximum file size: 5 MB
                                </p>

                            </label>

                        )}

                    </div>


                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={
                                    handleCancel
                                }
                                disabled={
                                    isSubmitting
                                }
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleBack
                                }
                                disabled={
                                    isSubmitting
                                }
                                className="rounded-lg border border-[#15294b] bg-white px-5 py-2.5 text-sm font-semibold text-[#15294b] transition hover:bg-blue-50 disabled:opacity-50"
                            >
                                Back
                            </button>

                        </div>


                        {/* ==================================================
                            COMPLETE REGISTRATION
                        ================================================== */}

                        <button
                            type="button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                !isStepThreeComplete ||
                                isSubmitting
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-[#15294b] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b] disabled:cursor-not-allowed disabled:opacity-40"
                        >

                            {isSubmitting ? (

                                <>

                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />

                                    Creating...

                                </>

                            ) : (

                                <>

                                    <CheckCircle2
                                        size={17}
                                    />

                                    Complete Registration

                                </>

                            )}

                        </button>

                    </div>

                </div>


                {/* ====================================================
                    PROGRESS SIDEBAR
                ==================================================== */}

                <FormProgressSidebar
                    currentStep={3}

                    hasProfilePhoto={
                        hasProfilePhoto
                    }
                />

            </div>


            {/* ======================================================
                SUCCESS DIALOG
            ====================================================== */}

            {showSuccessDialog && (

                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">

                            <CheckCircle2
                                size={36}
                                strokeWidth={2.5}
                            />

                        </div>


                        <h2 className="mt-5 text-center text-xl font-bold text-[#15294b]">
                            Trainee Created Successfully!
                        </h2>


                        <p className="mt-3 text-center text-sm leading-6 text-gray-600">
                            {successMessage}
                        </p>


                        {traineeData.email && (

                            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center">

                                <p className="break-all text-sm font-semibold text-[#15294b]">
                                    {traineeData.email}
                                </p>

                            </div>

                        )}


                        <button
                            type="button"
                            onClick={
                                handleSuccessContinue
                            }
                            className="mt-6 w-full rounded-lg bg-[#15294b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1f3b]"
                        >
                            Continue to Trainees
                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}


export default VerificationDocuments;

