import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tesdaLogo from "../../assets/tesda1.png";
import brainIcon from "../../assets/brain.svg";
import { supabase } from "../../supabaseClient";

export default function AssessorPrivacy() {
    const [consent, setConsent] = useState(false);
    const [checkingPrivacy, setCheckingPrivacy] = useState(true);
    const [accepting, setAccepting] = useState(false);

    const navigate = useNavigate();

    /* ============================================================
       CHECK AUTHENTICATION
    ============================================================ */
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                if (!user) {
                    navigate("/", { replace: true });
                    return;
                }
            } catch (error) {
                console.error(
                    "Error checking assessor authentication:",
                    error
                );
            } finally {
                setCheckingPrivacy(false);
            }
        };

        checkAuthentication();
    }, [navigate]);

    /* ============================================================
       ACCEPT PRIVACY / CONFIDENTIALITY AGREEMENT
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

            if (!user) {
                navigate("/", { replace: true });
                return;
            }

            const { data: updatedProfile, error: updateError } =
                await supabase
                    .from("assessor_profiles")
                    .update({
                        privacy_accepted: true,
                        privacy_accepted_at: new Date().toISOString(),
                    })
                    .eq("user_id", user.id)
                    .select(
                        "user_id, privacy_accepted, privacy_accepted_at"
                    )
                    .maybeSingle();

            if (updateError) {
                throw updateError;
            }

            if (
                !updatedProfile ||
                updatedProfile.privacy_accepted !== true
            ) {
                throw new Error(
                    "Privacy agreement was not saved. No assessor profile was updated."
                );
            }

            console.log(
                "Assessor privacy agreement saved:",
                updatedProfile
            );

            navigate("/assessor", { replace: true });
        } catch (error) {
            console.error(
                "Error saving assessor privacy agreement:",
                error
            );

            alert(
                "Unable to save your agreement. Please try again."
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

    /* ============================================================
       LOADING
    ============================================================ */
    if (checkingPrivacy) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f2f2f2]">
                <div className="text-sm text-gray-600">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f2f2f2] flex flex-col overflow-hidden">

            {/* ====================================================
                HEADER
            ==================================================== */}
            <div className="w-full bg-white border-b shadow-md flex-shrink-0 z-50">

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

                        <span className="font-bold">
                            NOERION:
                        </span>{" "}

                        An AI-Driven Skill Evaluation System with EEG Integration

                    </h3>

                </div>

            </div>


            {/* ====================================================
                MAIN AREA
            ==================================================== */}
            <div className="flex-1 min-h-0 overflow-hidden">

                <div className="max-w-[820px] h-[calc(98vh-75px)] mx-auto mt-3 shadow-2xl">

                    {/* ====================================================
                        MAIN CONTAINER
                    ==================================================== */}
                    <div className="h-full bg-[#f7f7f7] border border-[#d7d7d7] rounded-[14px] p-3 shadow-lg flex flex-col overflow-hidden">


                        {/* ====================================================
                            FIXED TOP SECTION
                        ==================================================== */}
                        <div className="flex-shrink-0">

                            <h1 className="text-[18px] font-bold mb-2 text-[#111]">
                                Assessor Data Privacy and Confidentiality Agreement
                            </h1>

                            <p className="text-[14px] text-gray-900 mb-4 leading-relaxed">
                                As an assessor, you are authorized to access and review
                                trainee information within NOERION for the purpose of
                                assessment review and result validation. This information
                                may include personal information, assessment results,
                                AI-generated insights, and EEG-related data. Protecting
                                the privacy and confidentiality of trainee information
                                is a shared responsibility.
                            </p>

                        </div>


                        {/* ====================================================
                            CONTENT AREA

                            The outer area does NOT scroll.

                            Each white card has its OWN internal scrollbar.
                        ==================================================== */}
                        <div className="flex-1 min-h-0 flex flex-col gap-3">


                            {/* ====================================================
                                DATA PRIVACY CONTAINER

                                FIXED CONTAINER
                                SCROLLBAR IS INSIDE
                            ==================================================== */}
                            <div className="flex-1 min-h-0 bg-white border rounded-xl shadow-xl overflow-hidden">

                                {/* Container title */}
                                <div className="flex-shrink-0 p-3 pb-2">

                                    <h2 className="text-[15px] font-bold text-[#111]">
                                        Data Privacy and Confidentiality Notice
                                    </h2>

                                </div>


                                {/* INTERNAL SCROLL */}
                                <div className="h-[calc(100%-42px)] overflow-y-auto px-3 pb-3">

                                    {/* ====================================================
                                        DATA TYPES / PURPOSE
                                    ==================================================== */}
                                    <div className="grid grid-cols-2 gap-10">

                                        {/* TYPES OF TRAINEE DATA */}
                                        <div>

                                            <h3 className="font-semibold text-[14px] mb-2 text-gray-900">
                                                Types of Trainee Data You May Access
                                            </h3>

                                            <ul className="list-disc pl-5 text-[14px] text-gray-900">

                                                <li>
                                                    Personal Information (Name, Email)
                                                </li>

                                                <li>
                                                    Assessment Results and Scores
                                                </li>

                                                <li>
                                                    Assessment Responses and Item-Level Performance
                                                </li>

                                                <li>
                                                    AI-Generated Feedback, Insights, and Recommendations
                                                </li>

                                                <li>
                                                    EEG Brainwave Data and EEG-Derived Cognitive Information
                                                </li>

                                                <li>
                                                    Assessment Completion and Performance Information
                                                </li>

                                            </ul>

                                        </div>


                                        {/* PURPOSE OF ACCESS */}
                                        <div>

                                            <h3 className="font-semibold text-[14px] mb-2 text-gray-900">
                                                Purpose of Access
                                            </h3>

                                            <p className="text-[14px] text-gray-900 mb-2">
                                                Your access to trainee information is limited
                                                to authorized assessment-related purposes,
                                                including:
                                            </p>

                                            <ul className="list-disc pl-5 text-[14px] text-gray-900">

                                                <li>
                                                    Assessment Review and Validation
                                                </li>

                                                <li>
                                                    Verification of Assessment Results
                                                </li>

                                                <li>
                                                    Review of AI-Generated Insights and Recommendations
                                                </li>

                                                <li>
                                                    Review of Cognitive Analysis
                                                </li>

                                                <li>
                                                    Evaluation of Trainee Strengths and Areas for Improvement
                                                </li>

                                                <li>
                                                    Certification and Related Educational Purposes
                                                </li>

                                            </ul>

                                        </div>

                                    </div>


                                    {/* ====================================================
                                        SENSITIVE DATA NOTICE
                                    ==================================================== */}
                                    <div className="flex items-center gap-4 bg-[#dff2ff] border border-[#78bdf5] rounded-lg p-4 mt-4">

                                        <img
                                            src={brainIcon}
                                            className="w-10 h-10"
                                            alt="Brain icon"
                                        />

                                        <p className="text-[13px] text-gray-700">

                                            <strong>
                                                SENSITIVE DATA NOTICE:
                                            </strong>{" "}

                                            Trainee EEG data and related information must be
                                            handled with strict confidentiality and appropriate
                                            security measures. You may only access and use
                                            trainee information that is necessary for your
                                            authorized assessment responsibilities.

                                        </p>

                                    </div>


                                    {/* ====================================================
                                        ASSESSOR RESPONSIBILITIES
                                    ==================================================== */}
                                    <div className="mt-4">

                                        <h3 className="font-semibold mb-2 text-[14px] text-gray-900">
                                            Assessor Responsibilities
                                        </h3>

                                        <p className="text-[14px] text-gray-900 mb-2">
                                            As an authorized assessor, you agree to:
                                        </p>

                                        <ul className="list-disc pl-5 text-[14px] text-gray-900 space-y-1">

                                            <li>
                                                Access trainee information only for authorized
                                                assessment-related purposes.
                                            </li>

                                            <li>
                                                Keep all trainee personal, assessment, and
                                                EEG-related information confidential.
                                            </li>

                                            <li>
                                                Not disclose, share, copy, photograph, record,
                                                download, or distribute trainee information
                                                to unauthorized persons.
                                            </li>

                                            <li>
                                                Not use trainee information for personal,
                                                commercial, or unrelated purposes.
                                            </li>

                                            <li>
                                                Not access trainee records that are outside
                                                the scope of your assigned assessment
                                                responsibilities.
                                            </li>

                                            <li>
                                                Follow NOERION's data privacy, security,
                                                and access-control procedures.
                                            </li>

                                            <li>
                                                Immediately report any suspected unauthorized
                                                access, disclosure, loss, or security incident
                                                involving trainee information to the appropriate
                                                NOERION administrator or authorized personnel.
                                            </li>

                                            <li>
                                                Maintain confidentiality even after your role,
                                                assignment, or access to NOERION has ended.
                                            </li>

                                        </ul>

                                    </div>


                                    {/* ====================================================
                                        AUTHORIZED ACCESS
                                    ==================================================== */}
                                    <div className="mt-4">

                                        <h3 className="font-semibold mb-2 text-[14px] text-gray-900">
                                            Authorized Access
                                        </h3>

                                        <p className="text-[14px] text-gray-900 mb-2">
                                            Your access to trainee information is granted only
                                            to the extent necessary to perform your assigned
                                            assessment responsibilities.
                                        </p>

                                        <p className="text-[14px] text-gray-900">
                                            Access to trainee information may be monitored,
                                            restricted, or revoked when necessary to protect
                                            the confidentiality and security of the data.
                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* ====================================================
                                CONFIDENTIALITY AGREEMENT CONTAINER

                                FIXED CONTAINER
                                SCROLLBAR IS INSIDE
                            ==================================================== */}
                            <div className="flex-shrink-0 h-[90px] bg-white border border-gray-400 shadow-xl rounded-lg overflow-hidden">

                                <div className="h-full overflow-y-auto p-3 text-[13px] leading-relaxed">

                                    <p className="font-bold mb-2 text-gray-900">
                                        CONFIDENTIALITY AGREEMENT
                                    </p>

                                    <p className="mb-2 text-gray-900">
                                        By proceeding as an assessor in NOERION,
                                        you acknowledge that you may be given access
                                        to confidential trainee information,
                                        including assessment results and EEG-related
                                        data.
                                    </p>

                                    <p className="mb-2 text-gray-900">
                                        You agree to access, use, and handle such
                                        information only for authorized assessment
                                        review, result validation, certification,
                                        and related educational purposes. You further
                                        agree not to disclose or use trainee
                                        information for any unauthorized purpose
                                        and to maintain its confidentiality in
                                        accordance with applicable data privacy
                                        regulations and NOERION's security procedures.
                                    </p>

                                    <p className="mb-2 text-gray-900">
                                        You understand that unauthorized access,
                                        use, copying, disclosure, or sharing of
                                        trainee information may result in the
                                        restriction or removal of your system access
                                        and may be subject to applicable institutional
                                        policies and data privacy regulations.
                                    </p>

                                    <p className="text-gray-900">
                                        By checking the box below, you confirm that
                                        you have read, understood, and agreed to this
                                        Data Privacy and Confidentiality Agreement.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ====================================================
                            FIXED CONSENT + BUTTONS
                        ==================================================== */}
                        <div className="flex-shrink-0 bg-[#f7f7f7] pt-3">


                            {/* ====================================================
                                CONSENT CHECKBOX
                            ==================================================== */}
                            <div className="flex items-start gap-3">

                                <input
                                    id="privacy-consent"
                                    type="checkbox"
                                    className="w-5 h-5 mt-1 accent-blue-700 flex-shrink-0"
                                    checked={consent}
                                    onChange={(e) =>
                                        setConsent(e.target.checked)
                                    }
                                />

                                <label
                                    htmlFor="privacy-consent"
                                    className="text-[14px] text-gray-900 leading-relaxed"
                                >
                                    I have read and understood the data privacy and
                                    confidentiality notice. I agree to protect the
                                    confidentiality of trainee information, including
                                    assessment and EEG-related data, and to access and
                                    use such information only for authorized
                                    assessment-related purposes.
                                </label>

                            </div>


                            {/* ====================================================
                                ACTION BUTTONS
                            ==================================================== */}
                            <div className="flex justify-end gap-3 mt-3">

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

            </div>

        </div>
    );
}