import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, X, CheckCircle2 } from "lucide-react";
import AnimatedWave from "./AnimatedWave.jsx";
import { supabase } from "../../supabaseClient.js";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Forgot Password Modal States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);

    // =========================================================
    // LISTEN FOR SUPABASE INVITATION & PASSWORD RESET TOKENS
    // =========================================================
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("access_token="))) {
            // Forward the token directly to the set-password route
            navigate(`/set-password${hash}`, { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // Clean input strings by trimming whitespace
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail) {
            setError("Email and Password is required");
            return;
        }

        if (cleanPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // ==========================================
            // SUPABASE LOGIN
            // ==========================================

            const {
                data: authData,
                error: authError,
            } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
            });

            if (authError) {
                throw new Error(authError.message);
            }

            const user = authData?.user;

            if (!user?.id) {
                throw new Error(
                    "Login succeeded but no Supabase user was returned."
                );
            }

            console.log(
                "SUPABASE LOGIN SUCCESS:",
                user.id
            );

            // ==========================================
            // VERIFY SESSION
            // ==========================================

            const {
                data: sessionData,
                error: sessionError,
            } = await supabase.auth.getSession();

            console.log(
                "SUPABASE SESSION AFTER LOGIN:",
                sessionData?.session
            );

            if (sessionError) {
                throw new Error(
                    sessionError.message
                );
            }

            if (!sessionData?.session) {
                throw new Error(
                    "Login succeeded but no Supabase session was created."
                );
            }

            // ==========================================
            // LOAD USER PROFILE
            // ==========================================

            const {
                data: profile,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select(
                    "registration_status, role, rejected_reason"
                )
                .eq("id", user.id)
                .single();

            console.log(
                "PROFILE DATA:",
                profile
            );

            console.log(
                "PROFILE ERROR:",
                profileError
            );

            if (profileError) {
                console.error(
                    "Profile lookup failed:",
                    profileError
                );

                throw new Error(
                    `Could not retrieve your profile. ${profileError.message}`
                );
            }

            if (!profile) {
                throw new Error(
                    "No profile was found for this account."
                );
            }

            const userRole =
                profile.role
                    ?.toLowerCase()
                    .trim();

            const userStatus =
                (
                    profile.registration_status ||
                    "Pending"
                )
                    .toLowerCase()
                    .trim();

            console.log(
                "USER ROLE:",
                userRole
            );

            console.log(
                "USER STATUS:",
                userStatus
            );

            // ==========================================
            // ADMIN ACCESS
            // ==========================================

            if (userRole === "admin") {
                console.log(
                    "ADMIN LOGIN SUCCESS"
                );

                navigate("/loading");

                return;
            }

            // ==========================================
            // NON-ADMIN ACCESS CONTROL
            // ==========================================

            if (
                userStatus === "rejected" ||
                userStatus.includes("reject")
            ) {
                await supabase.auth.signOut();

                const reasonMsg =
                    profile.rejected_reason
                        ? ` Reason: ${profile.rejected_reason}`
                        : "";

                throw new Error(
                    `Your registration request has been rejected.${reasonMsg}`
                );
            }

            if (userStatus === "inactive") {
                await supabase.auth.signOut();

                throw new Error(
                    "Your account is currently deactivated. Please contact the administrator."
                );
            }

            if (userStatus === "pending") {
                await supabase.auth.signOut();

                throw new Error(
                    "Your account is currently pending approval by the TESDA Administrator."
                );
            }

            if (
                userStatus !== "active" &&
                userStatus !== "approved"
            ) {
                await supabase.auth.signOut();

                throw new Error(
                    "Your account is not active. Please contact support."
                );
            }

            // ==========================================
            // NORMAL USER LOGIN SUCCESS
            // ==========================================

            console.log(
                "USER LOGIN SUCCESS"
            );

            navigate("/loading");

        } catch (err) {
            console.error(
                "LOGIN ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // HANDLE FORGOT PASSWORD RESET REQUEST
    // =========================================================
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError("");
        setResetSuccess(false);

        const cleanResetEmail = resetEmail.trim().toLowerCase();
        if (!cleanResetEmail) {
            setResetError("Please enter your email address.");
            return;
        }

        setResetLoading(true);

        try {
            const appUrl = window.location.origin;

            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanResetEmail, {
                redirectTo: `${appUrl}/set-password`,
            });

            if (resetErr) {
                throw new Error(resetErr.message);
            }

            setResetSuccess(true);
        } catch (err) {
            console.error("RESET PASSWORD ERROR:", err);
            setResetError(err?.message || "Failed to send password reset link.");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040814] flex justify-center items-center overflow-hidden relative">

            <AnimatedWave />

            <div className="absolute -top-40 -left-32 w-[500px] h-[500px] bg-cyan-400/20 blur-[180px]" />

            <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] bg-purple-500/20 blur-[180px]" />

            <div className="relative z-10 w-[420px] p-8 rounded-[28px] bg-slate-950/75 backdrop-blur-[30px] border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,255,.35),0_0_60px_rgba(0,242,255,.25),0_0_120px_rgba(0,242,255,.35)]">

                <h1 className="text-center text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white mb-3">
                    NOERION
                </h1>

                <h3 className="text-center text-white font-bold text-lg">
                    Welcome Back to NOERION
                </h3>

                <p className="text-center text-slate-400 text-sm mb-6">
                    Access your cognitive evaluation system.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-3"
                >
                    {/* EMAIL */}

                    <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">

                        <Mail
                            size={18}
                            className="text-cyan-300 mr-3"
                        />

                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input flex-1 bg-transparent outline-none text-white"
                        />

                    </div>

                    {/* PASSWORD */}

                    <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">

                        <Lock
                            size={18}
                            className="text-cyan-300 mr-3"
                        />

                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input flex-1 bg-transparent outline-none text-white"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={18}
                                    className="text-cyan-300"
                                />
                            ) : (
                                <Eye
                                    size={18}
                                    className="text-cyan-300"
                                />
                            )}
                        </button>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            {error}
                        </p>
                    )}

                    {/* LOGIN */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500"
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                    {/* REGISTER */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register")
                        }
                        className="w-full h-12 rounded-2xl border border-cyan-400/40 text-cyan-300 bg-slate-900/30"
                    >
                        Register
                    </button>

                </form>

                <div className="text-center mt-5">
                    <button
                        type="button"
                        onClick={() => {
                            setResetEmail(email.trim());
                            setResetError("");
                            setResetSuccess(false);
                            setShowForgotModal(true);
                        }}
                        className="text-purple-400 text-sm hover:underline focus:outline-none"
                    >
                        Forgot Password?
                    </button>
                </div>

            </div>

            {/* FORGOT PASSWORD MODAL */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-950/90 border border-cyan-400/50 shadow-[0_0_30px_rgba(0,242,255,.3)]">
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            Reset Your Password
                        </h3>
                        <p className="text-slate-400 text-xs text-center mb-6">
                            Enter your registered email address and we will send you a link to reset your password.
                        </p>

                        {resetSuccess ? (
                            <div className="text-center py-4 space-y-3">
                                <CheckCircle2 size={48} className="text-cyan-400 mx-auto animate-bounce" />
                                <h4 className="text-white font-bold text-base">Reset Link Sent!</h4>
                                <p className="text-slate-400 text-xs">
                                    Check your inbox at <span className="text-cyan-300 font-semibold">{resetEmail}</span> for instructions to reset your password.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/60 border border-cyan-400/40">
                                    <Mail size={18} className="text-cyan-300 mr-3" />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-white text-sm"
                                        required
                                    />
                                </div>

                                {resetError && (
                                    <p className="text-red-400 text-xs text-center bg-red-950/40 py-2 rounded-xl border border-red-500/30">
                                        {resetError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 shadow-lg hover:opacity-95 transition disabled:opacity-40"
                                >
                                    {resetLoading ? "Sending Link..." : "Send Reset Link"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}