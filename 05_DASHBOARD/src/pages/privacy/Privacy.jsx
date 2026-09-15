import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tesdaLogo from "../../assets/tesda1.png";
import brainIcon from "../../assets/brain.svg";
import { supabase } from "../../supabaseClient";

export default function Privacy() {
    const [consent, setConsent] = useState(false);
    const [checkingPrivacy, setCheckingPrivacy] = useState(true);
    const [accepting, setAccepting] = useState(false);

    const navigate = useNavigate();


    /* ============================================================
       CHECK PRIVACY CONSENT
       ============================================================ */
    useEffect(() => {
        const checkPrivacyConsent = async () => {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                // No authenticated user.
                if (!user) {
                    navigate("/", { replace: true });
                    return;
                }

                /* --------------------------------------------------------
                   Get the trainee's privacy consent from trainee_profiles.
                   trainee_profiles.user_id references the authenticated
                   user's ID.
                   -------------------------------------------------------- */
                const {
                    data: traineeProfile,
                    error: traineeProfileError,
                } = await supabase
                    .from("trainee_profiles")
                    .select("privacy_accepted")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (traineeProfileError) {
                    throw traineeProfileError;
                }

                // Privacy already accepted → go through Loading.
                if (traineeProfile?.privacy_accepted === true) {
                    navigate("/trainee", { replace: true });
                    return;
                }
            } catch (error) {
                console.error(
                    "Error checking privacy consent:",
                    error
                );
            } finally {
                setCheckingPrivacy(false);
            }
        };

        checkPrivacyConsent();
    }, [navigate]);


    /* ============================================================
       ACCEPT PRIVACY NOTICE
       ============================================================ */
    const handleAccept = async () => {
        if (!consent || accepting) return;

        setAccepting(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            // User must be authenticated.
            if (!user) {
                navigate("/", { replace: true });
                return;
            }

            /* --------------------------------------------------------
               Save the trainee's privacy consent.
               -------------------------------------------------------- */
            const { data: updatedProfile, error: updateError } = await supabase
                .from("trainee_profiles")
                .update({
                    privacy_accepted: true,
                    privacy_accepted_at: new Date().toISOString(),
                })
                .eq("user_id", user.id)
                .select("user_id, privacy_accepted, privacy_accepted_at")
                .maybeSingle();

            if (updateError) {
                throw updateError;
            }

            if (
                !updatedProfile ||
                updatedProfile.privacy_accepted !== true
            ) {
                throw new Error(
                    "Privacy consent was not saved. No trainee profile was updated."
                );
            }

            console.log("Privacy consent saved:", updatedProfile);

            // Only navigate after the database update is confirmed.
            navigate("/trainee", { replace: true });
        } catch (error) {
            console.error(
                "Error saving privacy consent:",
                error
            );

            alert(
                "Unable to save your consent. Please try again."
            );
        } finally {
            setAccepting(false);
        }
    };

    /* ============================================================
       DECLINE
       ============================================================ */
    const handleDecline = () => {
        navigate("/");
    };



    return (
        <div className="min-h-screen bg-[#f2f2f2]">
            {/* HEADER */}
            <div className="w-full bg-white border-b shadow-md">
                <div className="max-w-[1100px] mx-auto flex items-center justify-center gap-4 px-4 py-2">
                    <div className="flex items-center gap-3">
                        <img
                            src={tesdaLogo}
                            className="w-[45px]"
                            alt="TESDA Logo"
                        />

                        <div className="flex flex-col leading-tight">
                            <h1 className="text-[20px] font-bold text-[#333]">
                                TESDA
                            </h1>

                            <p className="text-[13px] text-gray-600">
                                Assessment System
                            </p>
                        </div>
                    </div>

                    <div className="w-[2px] h-[45px] bg-gray-300" />

                    <h3 className="max-w-[450px] text-[15px] text-[#222] leading-snug text-center">
                        <span className="font-bold">NOERION:</span>{" "}
                        An AI-Driven Skill Evaluation System with EEG Integration
                    </h3>
                </div>
            </div>

            {/* CONTAINER */}
            <div className="max-w-[820px] mx-auto mt-3 shadow-2xl">
                <div className="bg-[#f7f7f7] border border-[#d7d7d7] rounded-[14px] p-3 shadow-lg">
                    <h1 className="text-[18px] font-bold mb-2 text-[#111]">
                        Data Privacy and User Consent
                    </h1>

                    <p className="text-[14px] text-gray-900 mb-4 leading-relaxed">
                        This system collects and processes personal and physiological data,
                        including EEG signals, to support skill evaluation.
                        Your privacy and data security are our priority.
                    </p>

                    <div className="bg-white border rounded-xl p-3 shadow-xl">
                        <h2 className="text-[15px] font-bold mb-2 text-[#111]">
                            Data Privacy Notice
                        </h2>

                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <h3 className="font-semibold text-[14px] mb-2 text-gray-900">
                                    Types of Data Collected
                                </h3>

                                <ul className="list-disc pl-5 text-[14px] text-gray-900">
                                    <li>Personal Information (Name, Email)</li>
                                    <li>Assessment Results</li>
                                    <li>EEG Brainwave Data</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-[14px] mb-2 text-gray-900">
                                    Purpose of Data Collection
                                </h3>

                                <ul className="list-disc pl-5 text-[14px] text-gray-900">
                                    <li>Skill Evaluation</li>
                                    <li>Cognitive Engagement Analysis</li>
                                    <li>Certification</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-[#dff2ff] border border-[#78bdf5] rounded-lg p-4 mt-4">
                            <img
                                src={brainIcon}
                                className="w-10 h-10"
                                alt="Brain icon"
                            />

                            <p className="text-[13px] text-gray-700">
                                <strong>SENSITIVE DATA NOTICE:</strong> EEG data is
                                considered sensitive personal information. It reflects brain activity
                                and will be handled with strict confidentiality and security measures.
                            </p>
                        </div>

                        <div className="mt-4">
                            <h3 className="font-semibold mb-3 text-[14px] text-gray-900">
                                User Rights Section
                            </h3>

                            <div className="grid grid-cols-2 gap-6 text-[14px] text-gray-900">
                                <ul className="list-disc pl-5">
                                    <li>Right to be Informed</li>
                                    <li>Right to Access Your Data</li>
                                </ul>

                                <ul className="list-disc pl-5">
                                    <li>Right to Withdraw Consent</li>
                                    <li>Right to Data Protection</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="h-[90px] overflow-y-auto bg-white border border-gray-400 shadow-xl rounded-lg p-3 text-[13px] leading-relaxed">
                            <p className="font-bold mb-2 text-gray-900">
                                CONSENT AGREEMENT
                            </p>

                            <p className="mb-2 text-gray-900">
                                By proceeding with this assessment, you voluntarily consent
                                to the collection, processing, storage, and analysis of
                                your personal information and EEG brainwave data solely
                                for skill evaluation, cognitive engagement analysis,
                                certification, and related educational purposes.
                            </p>

                            <p className="mb-2 text-gray-900">
                                Your information will be handled securely and confidentially
                                in accordance with applicable data privacy regulations.
                                You may withdraw your consent at any time, subject to the
                                limitations of assessment processing requirements.
                            </p>

                            <p className="mb-2 text-gray-900">
                                By checking the box below, you confirm that you have read,
                                understood, and agreed to this Privacy Notice and Consent
                                Agreement.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 mt-4">
                        <input
                            id="privacy-consent"
                            type="checkbox"
                            className="w-5 h-5 mt-1 accent-blue-700"
                            checked={consent}
                            onChange={(e) =>
                                setConsent(e.target.checked)
                            }
                        />

                        <label
                            htmlFor="privacy-consent"
                            className="text-[14px] text-gray-900"
                        >
                            I have read and understood the data privacy notice and consent
                            to the collection and processing of my data, including EEG data.
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 -mt-2">
                        <button
                            onClick={handleAccept}
                            disabled={!consent || accepting}
                            className={`px-4 py-2 rounded text-white text-sm ${consent && !accepting
                                ? "bg-blue-700 hover:bg-blue-800"
                                : "bg-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {accepting
                                ? "Saving..."
                                : "Accept and Continue"}
                        </button>

                        <button
                            onClick={handleDecline}
                            disabled={accepting}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

