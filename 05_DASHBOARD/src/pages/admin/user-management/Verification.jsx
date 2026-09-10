import {
    useEffect,
    useState,
} from "react";

import {
    Navigate,
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    CheckCircle2,
    FileText,
    ImagePlus,
    Loader2,
    Upload,
    User,
    X,
} from "lucide-react";

// ============================================================
// SUPABASE
// ============================================================

import {
    supabase,
} from "../../../supabaseClient";

// ============================================================
// SUPABASE FUNCTION ERRORS
// ============================================================

import {
    FunctionsFetchError as SupabaseFunctionsFetchError,
    FunctionsHttpError as SupabaseFunctionsHttpError,
    FunctionsRelayError as SupabaseFunctionsRelayError,
} from "@supabase/supabase-js";

// ============================================================
// COMPONENTS
// ============================================================

import AddAssessorStepper from "../../../components/admin/add-assessor/AddAssessorStepper";

import FormProgressSidebar from "../../../components/admin/add-assessor/FormProgressSidebar";

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_BUCKET =
    "assessor-documents";

// ============================================================
// HELPER: CREATE SAFE EMAIL FOLDER
// ============================================================

function createSafeEmailFolder(
    email
) {
    return email
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            "_"
        );
}

// ============================================================
// HELPER: CREATE SAFE FILE NAME
// ============================================================

function createSafeFileName(
    file
) {
    const fileName =
        file.name;

    const lastDot =
        fileName.lastIndexOf(
            "."
        );

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
            : "";

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
// HELPER: UPLOAD FILE
// ============================================================

async function uploadAssessorFile(
    file,
    folder,
    email
) {
    if (
        !file
    ) {
        return null;
    }

    const safeEmail =
        createSafeEmailFolder(
            email
        );

    const safeFileName =
        createSafeFileName(
            file
        );

    const filePath =
        `${folder}/${safeEmail}/${safeFileName}`;

    console.log(
        "========================================"
    );

    console.log(
        "UPLOADING FILE:"
    );

    console.log(
        "BUCKET:",
        STORAGE_BUCKET
    );

    console.log(
        "PATH:",
        filePath
    );

    console.log(
        "FILE:",
        file.name
    );

    console.log(
        "========================================"
    );

    const {
        data,
        error,
    } =
        await supabase
            .storage
            .from(
                STORAGE_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type,
                }
            );

    if (
        error
    ) {
        console.error(
            "STORAGE UPLOAD ERROR:",
            error
        );

        throw new Error(
            `Unable to upload ${file.name}: ${error.message}`
        );
    }

    console.log(
        "STORAGE UPLOAD SUCCESS:",
        data
    );

    // ========================================================
    // RETURN STORAGE PATH
    //
    // Example:
    //
    // profile-photos/email/file.png
    // ========================================================

    return data.path;
}

// ============================================================
// COMPONENT
// ============================================================

function Verification() {

    const navigate =
        useNavigate();

    const location =
        useLocation();

    // ========================================================
    // GET DATA FROM PREVIOUS STEPS
    // ========================================================

    const assessorData =
        location.state?.assessorData;

    const professionalData =
        location.state?.professionalData;

    // ========================================================
    // FILE STATES
    // ========================================================

    const [
        profilePhoto,
        setProfilePhoto,
    ] =
        useState(
            null
        );

    const [
        profilePreview,
        setProfilePreview,
    ] =
        useState(
            ""
        );

    const [
        accreditationCertificate,
        setAccreditationCertificate,
    ] =
        useState(
            null
        );

    const [
        governmentId,
        setGovernmentId,
    ] =
        useState(
            null
        );

    // ========================================================
    // SUBMISSION STATE
    // ========================================================

    const [
        isSubmitting,
        setIsSubmitting,
    ] =
        useState(
            false
        );

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState(
            ""
        );

    // ========================================================
    // SUCCESS DIALOG STATE
    // ========================================================

    const [
        showSuccessDialog,
        setShowSuccessDialog,
    ] =
        useState(
            false
        );

    const [
        successMessage,
        setSuccessMessage,
    ] =
        useState(
            ""
        );

    // ========================================================
    // CLEAN UP PROFILE PREVIEW
    // ========================================================

    useEffect(
        () => {

            return () => {

                if (
                    profilePreview
                ) {
                    URL.revokeObjectURL(
                        profilePreview
                    );
                }

            };

        },
        [
            profilePreview,
        ]
    );

    // ========================================================
    // PROTECT PAGE FROM DIRECT ACCESS
    // ========================================================

    if (
        !assessorData ||
        !professionalData
    ) {
        return (
            <Navigate
                to="/admin/user-management/add-assessor"
                replace
            />
        );
    }

    // ========================================================
    // HANDLE PROFILE PHOTO
    // ========================================================

    const handleProfilePhotoChange =
        (
            event
        ) => {

            const file =
                event.target.files?.[0];

            if (
                !file
            ) {
                return;
            }

            if (
                file.type !==
                    "image/jpeg" &&
                file.type !==
                    "image/png"
            ) {
                setErrorMessage(
                    "Profile photo must be a JPG or PNG image."
                );

                event.target.value =
                    "";

                return;
            }

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

            if (
                profilePreview
            ) {
                URL.revokeObjectURL(
                    profilePreview
                );
            }

            const previewUrl =
                URL.createObjectURL(
                    file
                );

            setErrorMessage(
                ""
            );

            setProfilePhoto(
                file
            );

            setProfilePreview(
                previewUrl
            );

        };

    // ========================================================
    // REMOVE PROFILE PHOTO
    // ========================================================

    const handleRemoveProfilePhoto =
        () => {

            if (
                profilePreview
            ) {
                URL.revokeObjectURL(
                    profilePreview
                );
            }

            setProfilePhoto(
                null
            );

            setProfilePreview(
                ""
            );

        };

    // ========================================================
    // HANDLE ACCREDITATION CERTIFICATE
    // ========================================================

    const handleAccreditationChange =
        (
            event
        ) => {

            const file =
                event.target.files?.[0];

            if (
                !file
            ) {
                return;
            }

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {
                setErrorMessage(
                    "Accreditation certificate must be PDF, JPG, or PNG."
                );

                event.target.value =
                    "";

                return;
            }

            if (
                file.size >
                10 * 1024 * 1024
            ) {
                setErrorMessage(
                    "Accreditation certificate must not exceed 10 MB."
                );

                event.target.value =
                    "";

                return;
            }

            setErrorMessage(
                ""
            );

            setAccreditationCertificate(
                file
            );

        };

    // ========================================================
    // HANDLE GOVERNMENT ID
    // ========================================================

    const handleGovernmentIdChange =
        (
            event
        ) => {

            const file =
                event.target.files?.[0];

            if (
                !file
            ) {
                return;
            }

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {
                setErrorMessage(
                    "Government ID must be PDF, JPG, or PNG."
                );

                event.target.value =
                    "";

                return;
            }

            if (
                file.size >
                10 * 1024 * 1024
            ) {
                setErrorMessage(
                    "Government ID must not exceed 10 MB."
                );

                event.target.value =
                    "";

                return;
            }

            setErrorMessage(
                ""
            );

            setGovernmentId(
                file
            );

        };

    // ========================================================
    // VALIDATION
    // ========================================================

    const isProfilePhotoCompleted =
        profilePhoto !==
        null;

    const isAccreditationCompleted =
        accreditationCertificate !==
        null;

    const isStepThreeComplete =
        isProfilePhotoCompleted &&
        isAccreditationCompleted;

    // ========================================================
    // BACK
    // ========================================================

    const handleBack =
        () => {

            navigate(
                "/admin/user-management/add-assessor/account-setup",
                {
                    state: {
                        assessorData,
                        professionalData,
                    },
                }
            );

        };

    // ========================================================
    // CANCEL
    // ========================================================

    const handleCancel =
        () => {

            navigate(
                "/admin/user-management/assessors"
            );

        };

    // ========================================================
    // CLOSE SUCCESS DIALOG
    // ========================================================

    const handleSuccessContinue =
        () => {

            setShowSuccessDialog(
                false
            );

            navigate(
                "/admin/user-management/assessors",
                {
                    replace:
                        true,
                }
            );

        };

    // ========================================================
    // FINAL SUBMISSION
    // ========================================================

    const handleSubmit =
        async () => {

            if (
                !isStepThreeComplete
            ) {
                setErrorMessage(
                    "Please upload all required documents before submitting."
                );

                return;
            }

            try {

                setIsSubmitting(
                    true
                );

                setErrorMessage(
                    ""
                );

                // ==================================================
                // CHECK SESSION
                // ==================================================

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

                // ==================================================
                // UPLOAD FILES FIRST
                // ==================================================

                console.log(
                    "STARTING FILE UPLOADS..."
                );

                const [
                    profilePhotoUrl,
                    accreditationCertificateUrl,
                    governmentIdUrl,
                ] =
                    await Promise.all(
                        [

                            uploadAssessorFile(
                                profilePhoto,
                                "profile-photos",
                                assessorData.email
                            ),

                            uploadAssessorFile(
                                accreditationCertificate,
                                "accreditation-certificates",
                                assessorData.email
                            ),

                            governmentId
                                ? uploadAssessorFile(
                                    governmentId,
                                    "government-ids",
                                    assessorData.email
                                )
                                : Promise.resolve(
                                    null
                                ),

                        ]
                    );

                console.log(
                    "========================================"
                );

                console.log(
                    "FILE UPLOADS COMPLETED"
                );

                console.log(
                    "PROFILE PHOTO PATH:",
                    profilePhotoUrl
                );

                console.log(
                    "ACCREDITATION PATH:",
                    accreditationCertificateUrl
                );

                console.log(
                    "GOVERNMENT ID PATH:",
                    governmentIdUrl
                );

                console.log(
                    "========================================"
                );

                // ==================================================
                // FUNCTION PAYLOAD
                //
                // IMPORTANT:
                //
                // accreditationCertUrl MUST EXACTLY MATCH
                // THE EDGE FUNCTION FIELD NAME.
                // ==================================================

                const payload = {

                    // STEP 1

                    firstName:
                        assessorData.firstName,

                    middleName:
                        assessorData.middleName ||
                        "",

                    lastName:
                        assessorData.lastName,

                    suffix:
                        assessorData.suffix ||
                        "",

                    gender:
                        assessorData.gender,

                    birthDate:
                        assessorData.birthDate,

                    contactNumber:
                        assessorData.contactNumber,

                    email:
                        assessorData.email,

                    // STEP 2

                    assessorId:
                        professionalData.assessorId,

                    assessmentCenter:
                        professionalData.assessmentCenter,

                    specialization:
                        professionalData.specialization,

                    experience:
                        professionalData.experience ||
                        "",

                    // STEP 3
                    // STORAGE PATHS

                    profilePhotoUrl:
                        profilePhotoUrl,

                    // IMPORTANT FIX:
                    // Edge Function expects
                    // body.accreditationCertUrl

                    accreditationCertUrl:
                        accreditationCertificateUrl,

                    governmentIdUrl:
                        governmentIdUrl,

                };

                console.log(
                    "========================================"
                );

                console.log(
                    "CREATE ASSESSOR PAYLOAD:"
                );

                console.log(
                    payload
                );

                console.log(
                    "========================================"
                );

                // ==================================================
                // CALL EDGE FUNCTION
                // ==================================================

                const {
                    data,
                    error,
                } =
                    await supabase
                        .functions
                        .invoke(
                            "create-assessor",
                            {
                                body:
                                    payload,
                            }
                        );

                // ==================================================
                // HANDLE FUNCTION ERROR
                // ==================================================

                if (
                    error
                ) {

                    console.error(
                        "CREATE ASSESSOR FUNCTION ERROR:",
                        error
                    );

                    if (
                        error instanceof
                        SupabaseFunctionsHttpError
                    ) {

                        let errorResponse =
                            null;

                        try {

                            errorResponse =
                                await error
                                    .context
                                    .json();

                            console.error(
                                "EDGE FUNCTION ERROR BODY:",
                                errorResponse
                            );

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
                            error.message ||
                            "The server could not create the assessor."
                        );

                    }

                    if (
                        error instanceof
                        SupabaseFunctionsRelayError
                    ) {

                        throw new Error(
                            error.message ||
                            "Unable to communicate with the Supabase Edge Function."
                        );

                    }

                    if (
                        error instanceof
                        SupabaseFunctionsFetchError
                    ) {

                        throw new Error(
                            error.message ||
                            "Unable to reach the assessor creation service."
                        );

                    }

                    throw new Error(
                        error.message ||
                        "The server could not create the assessor."
                    );

                }

                // ==================================================
                // VALIDATE RESPONSE
                // ==================================================

                if (
                    !data
                ) {
                    throw new Error(
                        "The server returned an empty response."
                    );
                }

                if (
                    data.success ===
                    false
                ) {
                    throw new Error(
                        data.message ||
                        "Unable to create assessor."
                    );
                }

                // ==================================================
                // SUCCESS
                // ==================================================

                setSuccessMessage(
                    data.message ||
                    (
                        data.resubmission
                            ? "The previously rejected assessor registration has been resubmitted successfully and is now pending review."
                            : "Assessor invitation created successfully."
                    )
                );

                setShowSuccessDialog(
                    true
                );

            } catch (
                error
            ) {

                console.error(
                    "ASSESSOR CREATION FAILED:",
                    error
                );

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "An error occurred while creating the assessor."
                );

            } finally {

                setIsSubmitting(
                    false
                );

            }

        };

    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="h-full overflow-y-auto px-6 pt-4 pb-6">

            <div className="mb-4">

                <h1 className="text-2xl font-bold text-[#15294b]">
                    Add New Assessor
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                    Review the assessor information and upload the
                    required verification documents before completing
                    registration.
                </p>

            </div>

            <AddAssessorStepper
                currentStep={3}
            />

            <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-6">

                <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    {errorMessage && (

                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                            {errorMessage}

                        </div>

                    )}

                    <div className="mb-6">

                        <h2 className="text-lg font-bold text-[#15294b]">
                            Verification Documents
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Upload the required documents to complete
                            the assessor registration.
                        </p>

                    </div>

                    {/* PROFILE PHOTO */}

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
                                assessor.
                            </p>

                        </div>

                        {profilePreview ? (

                            <div className="flex w-fit items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

                                <img
                                    src={profilePreview}
                                    alt="Profile preview"
                                    className="h-28 w-28 rounded-lg border border-gray-300 object-cover"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-gray-800">
                                        {profilePhoto?.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Profile photo selected successfully.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleRemoveProfilePhoto}
                                        disabled={isSubmitting}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >

                                        <X size={14} />

                                        Remove Photo

                                    </button>

                                </div>

                            </div>

                        ) : (

                            <label className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-[#15294b] hover:bg-blue-50/30">

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleProfilePhotoChange}
                                    disabled={isSubmitting}
                                    className="hidden"
                                />

                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#15294b]/10 text-[#15294b]">

                                    <ImagePlus size={24} />

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

                    {/* ACCREDITATION CERTIFICATE */}

                    <div className="mb-8 border-t border-gray-200 pt-6">

                        <div className="mb-3">

                            <h3 className="text-base font-semibold text-gray-800">

                                TESDA Assessor Accreditation Certificate

                                <span className="ml-1 text-red-500">
                                    *
                                </span>

                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload the assessor's TESDA accreditation
                                certificate.
                            </p>

                        </div>

                        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-[#15294b] hover:bg-blue-50/30">

                            <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                onChange={handleAccreditationChange}
                                disabled={isSubmitting}
                                className="hidden"
                            />

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#15294b]/10 text-[#15294b]">

                                <FileText size={21} />

                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="truncate text-sm font-semibold text-gray-800">

                                    {accreditationCertificate
                                        ? accreditationCertificate.name
                                        : "Choose Accreditation Certificate"}

                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    PDF, JPG, or PNG · Maximum 10 MB
                                </p>

                            </div>

                            <Upload
                                size={20}
                                className="shrink-0 text-gray-500"
                            />

                        </label>

                    </div>

                    {/* GOVERNMENT ID */}

                    <div className="mb-8 border-t border-gray-200 pt-6">

                        <div className="mb-3">

                            <h3 className="text-base font-semibold text-gray-800">

                                Government-issued ID

                                <span className="ml-2 text-xs font-normal text-gray-400">
                                    (Optional)
                                </span>

                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload a valid government-issued
                                identification card.
                            </p>

                        </div>

                        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 transition hover:border-[#15294b] hover:bg-blue-50/30">

                            <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                onChange={handleGovernmentIdChange}
                                disabled={isSubmitting}
                                className="hidden"
                            />

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#15294b]/10 text-[#15294b]">

                                <User size={21} />

                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="truncate text-sm font-semibold text-gray-800">

                                    {governmentId
                                        ? governmentId.name
                                        : "Choose Government-issued ID"}

                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    PDF, JPG, or PNG · Maximum 10 MB
                                </p>

                            </div>

                            <Upload
                                size={20}
                                className="shrink-0 text-gray-500"
                            />

                        </label>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="rounded-lg border border-[#15294b] bg-white px-5 py-2.5 text-sm font-semibold text-[#15294b] transition hover:bg-blue-50 disabled:opacity-50"
                            >
                                Back
                            </button>

                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
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

                <FormProgressSidebar
                    currentStep={3}
                    stepType="professional"

                    isAssessorIdCompleted={
                        Boolean(
                            professionalData.assessorId
                        )
                    }

                    isAssessmentCenterCompleted={
                        Boolean(
                            professionalData.assessmentCenter
                        )
                    }

                    isSpecializationCompleted={
                        Boolean(
                            professionalData.specialization
                        )
                    }

                    hasProfilePhoto={
                        profilePhoto !== null
                    }

                    hasAccreditation={
                        accreditationCertificate !== null
                    }

                    hasGovernmentId={
                        governmentId !== null
                    }
                />

            </div>

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

                            {successMessage.includes(
                                "resubmitted"
                            )
                                ? "Registration Resubmitted Successfully!"
                                : "Assessor Created Successfully!"}

                        </h2>

                        <p className="mt-3 text-center text-sm leading-6 text-gray-600">

                            {successMessage}

                        </p>

                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center">

                            <p className="break-all text-sm font-semibold text-[#15294b]">

                                {assessorData.email}

                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={handleSuccessContinue}
                            className="mt-6 w-full rounded-lg bg-[#15294b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1f3b]"
                        >
                            Continue to Assessors
                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}

export default Verification;
