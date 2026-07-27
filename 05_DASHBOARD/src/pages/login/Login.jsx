import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AnimatedWave from "./AnimatedWave";
import { supabase } from "../../supabaseClient"; // Imported your Supabase client

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Clear previous errors and start validation
        setError("");

        if (!email || email.trim() === "") {
            setError("Email is required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // 2. Call the Supabase auth method
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            // 3. If Supabase returns an auth error, catch it immediately
            if (authError) {
                throw new Error(authError.message);
            }

            const userId = data.user?.id;
            if (!userId) {
                throw new Error("Unable to authenticate user ID.");
            }

            /// 4. Fetch the user's status from public.profiles
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("registration_status, role")
  .eq("id", userId)
  .single();

if (profileError) {
  await supabase.auth.signOut();
  throw new Error("Could not retrieve profile status.");
}

const userStatus = (profile.registration_status || "Pending").toLowerCase();

// 5. Enforce approval check for non-admins
if (profile.role?.toLowerCase() !== "admin") {
  if (userStatus.includes("reject")) {
    await supabase.auth.signOut();
    throw new Error("Your registration request has been declined.");
  }

  if (!userStatus.includes("approved")) {
    await supabase.auth.signOut();
    throw new Error("Your account is currently pending approval by the TESDA Administrator.");
  }
}

            // 6. Success! Account is approved
            console.log("LOGIN SUCCESS:", data);
            navigate("/loading");
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040814] flex justify-center items-center overflow-hidden relative">

            {/* Background */}
            <AnimatedWave />

            {/* Ambient Glow */}
            <div className="absolute -top-40 -left-32 w-[500px] h-[500px] bg-cyan-400/20 blur-[180px]" />
            <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] bg-purple-500/20 blur-[180px]" />

            {/* Login Card */}
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
                    {/* Email */}
                    <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">
                        <Mail size={18} className="text-cyan-300 mr-3" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-white"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">
                        <Lock size={18} className="text-cyan-300 mr-3" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff size={18} className="text-cyan-300" />
                            ) : (
                                <Eye size={18} className="text-cyan-300" />
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            {error}
                        </p>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {/* Request Access */}
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="w-full h-12 rounded-2xl border border-cyan-400/40 text-cyan-300 bg-slate-900/30"
                    >
                        Register
                    </button>
                </form>

                <div className="text-center mt-5">
                    <a href="#" className="text-purple-400 text-sm">
                        Forgot Password?
                    </a>
                </div>
            </div>
        </div>
    );
}