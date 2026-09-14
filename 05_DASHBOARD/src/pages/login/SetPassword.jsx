import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AnimatedWave from "./AnimatedWave.jsx";
import { supabase } from "../../supabaseClient.js";

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [targetUserEmail, setTargetUserEmail] = useState("");

  useEffect(() => {
    const initializeInviteSession = async () => {
      try {
        const hash = window.location.hash;

        // Option A: Extract token directly from URL hash if present
        if (hash && hash.includes("access_token=")) {
          const hashParams = new URLSearchParams(hash.replace("#", "?"));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || "";

          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!sessionError && sessionData?.session) {
              setTargetUserEmail(sessionData.session.user.email);
              return;
            }
          }
        }

        // Option B: Fallback to active session if Supabase auto-parsed token
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setTargetUserEmail(userData.user.email);
          return;
        }

        setError("No invitation token found. Please open the link directly from your email.");
      } catch (err) {
        console.error("INVITE SESSION ERROR:", err);
        setError(err?.message || "Invalid or expired invitation link.");
      }
    };

    initializeInviteSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Trim whitespace to handle pasted text cleanly
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Update user password using trimmed value
      const { data: authData, error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      const userId = authData?.user?.id;

      if (userId) {
        // 2. Mark profile as active and approved
        await supabase
          .from("profiles")
          .update({
            registration_status: "active",
            is_approved: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      // 3. Clean sign out so user logs in fresh with new credentials
      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("SET PASSWORD ERROR:", err);
      setError(err?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040814] flex justify-center items-center overflow-hidden relative">
      <AnimatedWave />

      <div className="absolute -top-40 -left-32 w-[500px] h-[500px] bg-cyan-400/20 blur-[180px]" />
      <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] bg-purple-500/20 blur-[180px]" />

      <div className="relative z-10 w-[420px] p-8 rounded-[28px] bg-slate-950/75 backdrop-blur-[30px] border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,255,.35),0_0_60px_rgba(0,242,255,.25),0_0_120px_rgba(0,242,255,.35)]">
        <h1 className="text-center text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white mb-2">
          NOERION
        </h1>

        <h3 className="text-center text-white font-bold text-lg mb-1">
          Complete Your Account Setup
        </h3>

        {targetUserEmail ? (
          <p className="text-center text-cyan-300 text-xs font-semibold mb-4 bg-cyan-950/50 py-1.5 px-3 rounded-lg border border-cyan-400/30">
            Setting password for: <span className="text-white font-bold">{targetUserEmail}</span>
          </p>
        ) : (
          <p className="text-center text-slate-400 text-sm mb-6">
            Set a secure password for your Assessor account.
          </p>
        )}

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={56} className="text-cyan-400 mx-auto animate-bounce" />
            <h4 className="text-white font-bold text-lg">Password Set Successfully!</h4>
            <p className="text-slate-400 text-sm">Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NEW PASSWORD */}
            <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">
              <Lock size={18} className="text-cyan-300 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-cyan-300 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="flex items-center h-12 px-4 rounded-2xl bg-slate-900/50 border border-cyan-400/40">
              <Lock size={18} className="text-cyan-300 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm"
                required
              />
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-950/40 py-2 rounded-xl border border-red-500/30">
                {error}
              </p>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || !targetUserEmail}
              className="w-full h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 shadow-lg hover:opacity-95 transition disabled:opacity-40"
            >
              {loading ? "Saving Password..." : "Set Password & Access Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}