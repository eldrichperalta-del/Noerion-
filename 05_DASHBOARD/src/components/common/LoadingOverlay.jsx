import { useEffect, useState } from "react";
import tesdaLogo from "../../assets/tesda1.png";

/**
 * ==========================================================
 * LoadingOverlay
 * ==========================================================
 *
 * A reusable full-screen loading overlay.
 *
 * FEATURES
 * --------
 * ✓ Reusable across the application
 * ✓ Backend-ready
 * ✓ Accessible (ARIA)
 * ✓ Supports automatic and backend-controlled progress
 *
 * ----------------------------------------------------------
 * FRONTEND MODE (Automatic Progress)
 * ----------------------------------------------------------
 *
 * Do NOT pass the "progress" prop.
 *
 * Example:
 *
 * <LoadingOverlay />
 *
 * The progress bar will automatically animate
 * from 0% to 90% while waiting.
 *
 * ----------------------------------------------------------
 * BACKEND MODE (Controlled Progress)
 * ----------------------------------------------------------
 *
 * Pass a progress value (0-100).
 *
 * Example:
 *
 * <LoadingOverlay
 *      progress={uploadProgress}
 * />
 *
 * The parent component or backend controls the progress.
 *
 * Example:
 *
 * setUploadProgress(15);
 * setUploadProgress(50);
 * setUploadProgress(90);
 * setUploadProgress(100);
 *
 * When the request finishes:
 *
 * setLoading(false);
 *
 * ==========================================================
 */

export default function LoadingOverlay({
    title = "Loading...",
    message = "Please wait...",
    logo = tesdaLogo,

    // ======================================================
    // BACKEND
    // ======================================================
    //
    // Optional progress value (0-100).
    //
    // • Leave as null to use automatic progress.
    // • Pass a value from the backend or parent component
    //   for real-time progress updates.
    //
    // Examples:
    //
    // progress={45}
    // progress={uploadProgress}
    //
    // ======================================================
    progress = null,
}) {

    // Used only when backend progress is unavailable.
    const [internalProgress, setInternalProgress] = useState(0);

    useEffect(() => {

        // If backend supplies progress,
        // disable the automatic animation.
        if (progress !== null) return;

        setInternalProgress(0);

        const interval = setInterval(() => {

            setInternalProgress((prev) => {

                // Never automatically reach 100%.
                // Wait until the backend finishes.
                if (prev >= 90) return 90;

                return prev + 1;

            });

        }, 80);

        return () => clearInterval(interval);

    }, []);

    // Use backend progress when available.
    // Otherwise use the automatic progress.
    const currentProgress =
        progress !== null
            ? Math.max(0, Math.min(progress, 100))
            : internalProgress;

    return (

        <div
            className="fixed inset-0 z-[9999] bg-black/5 backdrop-blur-[1px] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loading-overlay-title"
            aria-live="polite"
        >

            <div className="flex flex-col items-center">

                {/* ==========================================
                    Spinner + Logo
                ========================================== */}

                <div className="relative w-28 h-28 flex items-center justify-center">

                    <div
                        className="
                            absolute
                            inset-0
                            rounded-full
                            border-8
                            border-blue-200
                            border-t-[#001F5B]
                            animate-spin
                        "
                    />

                    <img
                        src={logo}
                        alt="TESDA Logo"
                        className="w-14 h-14 object-contain"
                    />

                </div>

                {/* ==========================================
                    Title
                ========================================== */}

                <h2
                    id="loading-overlay-title"
                    className="mt-6 text-xl font-semibold text-[#001F5B]"
                >
                    {title}
                </h2>

                {/* ==========================================
                    Message
                ========================================== */}

                <p className="mt-2 text-gray-700 text-center">
                    {message}
                </p>

                {/* ==========================================
                    Progress Bar
                ========================================== */}

                <div className="mt-6 w-72">

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div
                            className="h-full bg-[#001F5B] transition-all duration-200 ease-linear"
                            style={{
                                width: `${currentProgress}%`,
                            }}
                        />

                    </div>

                    {/* Progress Percentage */}

                    <div className="mt-2 text-right text-sm font-semibold text-[#001F5B]">

                        {Math.round(currentProgress)}%

                    </div>

                </div>

            </div>

        </div>

    );

}