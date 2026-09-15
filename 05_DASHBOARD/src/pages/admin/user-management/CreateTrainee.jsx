import { useEffect, useState } from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";

import { supabase } from "../../../supabaseClient";


function CreateTrainee() {
    const navigate = useNavigate();
    const location = useLocation();

    // ============================================================
    // DATA FROM PREVIOUS STEPS
    // ============================================================

    const traineeData =
        location.state?.traineeData;

    const trainingData =
        location.state?.trainingData;

    const photoFile =
        location.state?.photoFile;


    // ============================================================
    // STATE
    // ============================================================

    const [
        processing,
        setProcessing,
    ] = useState(true);

    const [
        completed,
        setCompleted,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");


    // ============================================================
    // ROUTE GUARD
    // ============================================================

    useEffect(() => {
        if (
            !traineeData ||
            !trainingData ||
            !photoFile
        ) {
            navigate(
                "/admin/user-management/add-trainee",
                {
                    replace: true,
                }
            );
        }
    }, [
        traineeData,
        trainingData,
        photoFile,
        navigate,
    ]);


    // ============================================================
    // CREATE TRAINEE
    // ============================================================

    useEffect(() => {
        if (
            !traineeData ||
            !trainingData ||
            !photoFile
        ) {
            return;
        }

        let isMounted = true;

        const createTrainee = async () => {
            try {
                setProcessing(true);
                setErrorMessage("");


                // ========================================================
                // 1. CHECK CURRENT ADMIN SESSION
                // ========================================================

                const {
                    data: {
                        session,
                    },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (!session) {
                    throw new Error(
                        "Your admin session has expired. Please log in again."
                    );
                }


                // ========================================================
                // 2. CREATE TRAINEE ACCOUNT + DATABASE RECORDS
                //
                // IMPORTANT:
                // This calls the backend Edge Function.
                //
                // We do NOT use auth.signUp() here because this is an
                // admin creating another user's account.
                // ========================================================

                const {
                    data: createResult,
                    error: createError,
                } = await supabase.functions.invoke(
                    "create-trainee",
                    {
                        body: {
                            traineeData,
                            trainingData,
                        },
                    }
                );


                if (createError) {
                    throw new Error(
                        createError.message ||
                        "Failed to create trainee account."
                    );
                }


                if (
                    !createResult?.success ||
                    !createResult?.user_id
                ) {
                    throw new Error(
                        createResult?.error ||
                        "Trainee account was not created correctly."
                    );
                }


                const traineeUserId =
                    createResult.user_id;


                // ========================================================
                // 3. UPLOAD PROFILE PHOTO
                // ========================================================

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
                    ].includes(fileExtension)
                        ? fileExtension
                        : "jpg";


                const storagePath =
                    `profile-photos/${traineeUserId}/profile-photo.${safeExtension}`;


                const {
                    error: uploadError,
                } = await supabase.storage
                    .from("trainee-documents")
                    .upload(
                        storagePath,
                        photoFile,
                        {
                            cacheControl: "3600",
                            upsert: true,
                            contentType:
                                photoFile.type,
                        }
                    );


                if (uploadError) {
                    throw new Error(
                        `Trainee account was created, but the profile photo could not be uploaded: ${uploadError.message}`
                    );
                }


                // ========================================================
                // 4. GET PUBLIC URL
                // ========================================================

                const {
                    data: publicUrlData,
                } = supabase.storage
                    .from("trainee-documents")
                    .getPublicUrl(
                        storagePath
                    );


                const profilePhotoUrl =
                    publicUrlData?.publicUrl;


                if (!profilePhotoUrl) {
                    throw new Error(
                        "The profile photo was uploaded, but its public URL could not be generated."
                    );
                }


                // ========================================================
                // 5. SAVE PHOTO URL
                // ========================================================

                const {
                    error: profilePhotoError,
                } = await supabase
                    .from("trainee_profiles")
                    .update({
                        profile_photo_url:
                            profilePhotoUrl,
                    })
                    .eq(
                        "user_id",
                        traineeUserId
                    );


                if (profilePhotoError) {
                    throw new Error(
                        `The profile photo was uploaded, but the trainee profile could not be updated: ${profilePhotoError.message}`
                    );
                }


                // ========================================================
                // 6. SUCCESS
                // ========================================================

                if (isMounted) {
                    setCompleted(true);
                    setProcessing(false);
                }


                // ========================================================
                // 7. REDIRECT
                // ========================================================

                setTimeout(() => {
                    if (!isMounted) {
                        return;
                    }

                    navigate(
                        "/admin/user-management/trainees",
                        {
                            replace: true,
                        }
                    );
                }, 1200);

            } catch (error) {
                console.error(
                    "Create trainee error:",
                    error
                );

                if (isMounted) {
                    setProcessing(false);

                    setErrorMessage(
                        error?.message ||
                        "Something went wrong while creating the trainee."
                    );
                }
            }
        };


        createTrainee();


        return () => {
            isMounted = false;
        };

    }, [
        traineeData,
        trainingData,
        photoFile,
        navigate,
    ]);


    // ============================================================
    // PREVENT RENDER WITHOUT REQUIRED DATA
    // ============================================================

    if (
        !traineeData ||
        !trainingData ||
        !photoFile
    ) {
        return null;
    }


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="flex min-h-full items-center justify-center bg-[#eef4f8] px-6 py-10">

            <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">

                {processing && (
                    <>
                        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-[#15294b]">
                            <Loader2
                                size={30}
                                className="animate-spin"
                            />
                        </div>

                        <h1 className="text-xl font-bold text-[#15294b]">
                            Creating Trainee Account
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Please wait while the trainee account,
                            profile, training information, and profile
                            photo are being saved.
                        </p>
                    </>
                )}


                {completed && (
                    <>
                        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-600">
                            <CheckCircle2
                                size={34}
                            />
                        </div>

                        <h1 className="text-xl font-bold text-[#15294b]">
                            Trainee Created Successfully
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            The trainee account and profile photo have
                            been saved successfully.
                        </p>

                        <p className="mt-4 text-xs font-medium text-gray-400">
                            Redirecting to Trainee Management...
                        </p>
                    </>
                )}


                {errorMessage && (
                    <>
                        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
                            <AlertCircle
                                size={34}
                            />
                        </div>

                        <h1 className="text-xl font-bold text-red-700">
                            Unable to Create Trainee
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                            {errorMessage}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/admin/user-management/add-trainee/verification",
                                    {
                                        state: {
                                            traineeData,
                                            trainingData,
                                        },
                                    }
                                )
                            }
                            className="mt-6 rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f1f3a]"
                        >
                            Back to Verification
                        </button>
                    </>
                )}

            </div>

        </div>
    );
}


export default CreateTrainee;