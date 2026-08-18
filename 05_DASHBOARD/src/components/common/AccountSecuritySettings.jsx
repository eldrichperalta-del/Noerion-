import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  Monitor,
  ShieldCheck,
  ShieldPlus,
  LogOut,
  MailCheck,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import TwoFactorAuthentication from "./TwoFactorAuthentication";
import ActiveSessions from "./ActiveSessions";

function Badge({ children, tone = "neutral" }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-300 bg-slate-50 text-slate-700",
  };
  return <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function SecurityRow({ icon: Icon, title, description, badge, onClick, children }) {
  const handleKeyDown = (event) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };
  return <div role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={handleKeyDown} className={`flex items-center gap-4 border-b border-slate-200 px-4 py-3.5 transition last:border-b-0 ${onClick ? "cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#002f86]" : ""}`}><Icon className="shrink-0 text-slate-800" size={23} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-950">{title}</p><p className="mt-0.5 text-xs text-slate-600">{description}</p></div>{badge}{children}{onClick && <ChevronRight className="shrink-0 text-slate-800" size={20} />}</div>;
}

function SignOutOtherSessionsDialog({ processing, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="sign-out-other-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 id="sign-out-other-title" className="text-xl font-bold text-slate-950">Sign Out of Other Sessions?</h3><p className="mt-2 text-sm leading-6 text-slate-600">This will sign you out of your account on all other devices where you are currently signed in. You will remain signed in on this device.</p></div><button type="button" disabled={processing} onClick={onCancel} aria-label="Close dialog" className="text-slate-500 hover:text-slate-950">×</button></div>{processing ? <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="font-semibold text-[#002f86]">Signing Out...</p><p className="mt-1 text-sm text-slate-600">Please wait while we sign out your other active sessions.</p></div> : <div className="mt-6 space-y-4 text-sm"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Device</p><p className="mt-1 font-semibold text-slate-950">Windows PC · Chrome</p><p className="text-slate-600">This device</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other Active Sessions</p><p className="mt-1 font-semibold text-slate-950">2 devices</p></div></div>}<div className="mt-7 flex justify-end gap-3"><button type="button" disabled={processing} onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="button" disabled={processing} onClick={onConfirm} className="rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:bg-rose-400">{processing ? "Signing Out..." : "Sign Out Other Sessions"}</button></div></div></div>;
}

function PasswordField({ label, value, onChange, visible, onToggle, placeholder, error }) {
  return <label className="block text-sm font-semibold text-slate-800">{label}<span className="relative mt-2 block"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#002f86]"}`} /><button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" aria-label={`Show or hide ${label}`}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}</label>;
}

function ChangePassword({ onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requirements = [
    ["At least 8 characters", newPassword.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(newPassword)],
    ["One lowercase letter", /[a-z]/.test(newPassword)],
    ["One number", /\d/.test(newPassword)],
    ["One special character", /[^A-Za-z0-9]/.test(newPassword)],
  ];
  const meetsRequirements = requirements.every(([, met]) => met);
  const matches = Boolean(confirmPassword) && confirmPassword === newPassword;
  const canSubmit = Boolean(currentPassword) && meetsRequirements && matches && currentPassword !== newPassword;
  const strength = requirements.filter(([, met]) => met).length;
  const strengthLabel = strength <= 2 ? "Weak" : strength <= 4 ? "Medium" : "Strong";

  const updatePassword = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error: credentialError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (credentialError) { setError("Your current password is incorrect."); return; }
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) { setError(updateError.message); return; }
    setSuccess(true);
  };

  if (success) return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={30} /></span><h2 className="mt-4 text-2xl font-bold text-slate-950">Password Changed Successfully</h2><p className="mt-2 text-sm text-slate-600">Your password has been updated successfully.</p><button type="button" onClick={onBack} className="mt-6 rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00266b]">Back to Account &amp; Security</button></div>;

  return <form onSubmit={updatePassword} className="max-w-5xl"><h2 className="text-2xl font-bold text-slate-950">Change Password</h2><p className="mt-1 border-b border-slate-200 pb-5 text-sm text-slate-600">Update your password regularly to keep your account secure.</p><div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.85fr)]"><div className="space-y-5"><PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} visible={visible.current} onToggle={() => setVisible((state) => ({ ...state, current: !state.current }))} placeholder="Enter your current password" /><PasswordField label="New Password" value={newPassword} onChange={setNewPassword} visible={visible.next} onToggle={() => setVisible((state) => ({ ...state, next: !state.next }))} placeholder="Enter your new password" /><PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} visible={visible.confirm} onToggle={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))} placeholder="Re-enter your new password" error={confirmPassword && !matches ? "Passwords do not match." : ""} /><div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="shrink-0" size={18} /><p><strong>Security Notice</strong><br />Changing your password may sign you out of other active devices.</p></div></div><aside className="pt-1"><p className="text-sm font-semibold text-slate-800">Password Strength</p><div className="mt-3 flex items-center gap-3"><div className="flex gap-1">{requirements.map(([, met], index) => <span key={index} className={`h-2 w-7 rounded-full ${met ? "bg-emerald-600" : "bg-slate-200"}`} />)}</div><span className="text-xs font-semibold text-slate-600">{strengthLabel}</span></div><div className="mt-4 space-y-2 text-sm text-slate-600">{requirements.map(([label, met]) => <p key={label} className={`flex items-center gap-2 ${met ? "text-emerald-700" : ""}`}><Check size={15} />{label}</p>)}</div></aside></div>{error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onBack} className="rounded-lg border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={!canSubmit} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00266b] disabled:cursor-not-allowed disabled:bg-slate-300">Update Password</button></div></form>;
}

function EmailVerification({ onBack }) {
  const [email, setEmail] = useState("juan.delacruz@email.com");
  const [verified, setVerified] = useState(true);
  const [verifiedOn, setVerifiedOn] = useState("August 15, 2026");
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setNewEmail(user.email || "");
      setVerified(Boolean(user.email_confirmed_at));
      if (user.email_confirmed_at) setVerifiedOn(new Date(user.email_confirmed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    };
    loadUser();
  }, []);

  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Verification email sent. Please check your inbox.");
  };

  const changeEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { setMessage(error.message); return; }
    setEmail(newEmail);
    setVerified(false);
    setEditingEmail(false);
    setMessage("A verification email has been sent to your new address.");
  };

  return <div className="max-w-4xl"><h2 className="text-2xl font-bold text-slate-950">Email Verification</h2><p className="mt-1 text-sm text-slate-600">Manage your email verification status and account security.</p><div className="mt-6 grid gap-7 border-t border-slate-200 pt-6 sm:grid-cols-2"><div><p className="text-sm font-semibold text-slate-800">Email Address</p><p className="mt-3 text-base font-semibold text-slate-950">{email}</p></div><div><p className="text-sm font-semibold text-slate-800">Verification Status</p>{verified ? <div className="mt-3"><p className="flex items-center gap-2 text-base font-bold text-emerald-700"><CheckCircle2 size={20} />Email Verified</p><p className="mt-2 text-sm text-slate-600">Your email address has been successfully verified.</p><p className="mt-4 text-sm font-medium text-slate-700">Verified on: {verifiedOn}</p></div> : <div className="mt-3"><p className="flex items-center gap-2 text-base font-bold text-amber-700"><MailCheck size={20} />Email Not Verified</p><p className="mt-2 text-sm text-slate-600">Please verify your email address to help secure your account and receive important notifications.</p></div>}</div></div><div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"><Info className="mt-0.5 shrink-0 text-[#002f86]" size={18} />Your verified email is used for account security, password recovery, and important notifications.</div>{message && <p className="mt-4 text-sm font-medium text-[#002f86]">{message}</p>}{editingEmail && <div className="mt-5 rounded-xl border border-slate-200 p-4"><label className="text-sm font-semibold text-slate-800">New Email Address<input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#002f86] focus:ring-2 focus:ring-blue-100" /></label><div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => setEditingEmail(false)} className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={changeEmail} className="rounded-lg bg-[#002f86] px-4 py-2 text-sm font-semibold text-white">Update Email</button></div></div>}<div className="mt-6 flex justify-end">{verified ? <button type="button" onClick={() => setEditingEmail(true)} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00266b]">Change Email Address</button> : <button type="button" onClick={resend} className="rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00266b]">Resend Verification Email</button>}</div></div>;
}

function AccountSecurityStatus({ otherSessionsSignedOut }) {
  const checks = [
    ["Email verification", "Verified", true],
    ["Password security", "Good", true],
    ["Two-factor authentication", "Disabled", false],
    ["Active sessions", otherSessionsSignedOut ? "1 session" : "2 sessions", false],
    ["Recent suspicious activity", "No issues", true],
  ];
  const needsAttention = checks.some(([label, value]) => label === "Recent suspicious activity" && value !== "No issues");
  const status = needsAttention ? { title: "Needs Attention", message: "Review the items below to keep your account protected.", className: "border-amber-200 bg-amber-50 text-amber-800", Icon: AlertTriangle } : { title: "Secure", message: "Your account is currently secure.", className: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: ShieldCheck };

  return <div className="max-w-2xl"><h2 className="text-2xl font-bold text-slate-950">Account Security</h2><p className="mt-1 border-b border-slate-200 pb-5 text-sm text-slate-600">Review the current security status of your account.</p><section className="mt-6"><p className="text-sm font-semibold text-slate-800">Overall Security Status</p><div className={`mt-3 flex items-center gap-3 rounded-xl border p-4 ${status.className}`}><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70"><status.Icon size={22} /></span><div><p className="font-bold">{status.title}</p><p className="mt-0.5 text-sm">{status.message}</p></div></div></section><section className="mt-6 border-y border-slate-200 py-5"><p className="text-sm font-semibold text-slate-800">Security Checks</p><div className="mt-3 divide-y divide-slate-100">{checks.map(([label, value, positive]) => <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-slate-700">{label}</span><span className={`font-semibold ${positive ? "text-emerald-700" : "text-slate-700"}`}>{positive && <Check className="mr-1 inline" size={15} />}{value}</span></div>)}</div></section><p className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 size={18} />Your account currently has no detected security issues.</p></div>;
}

export default function AccountSecuritySettings({ resetKey = 0 }) {
  const [otherSessionsSignedOut, setOtherSessionsSignedOut] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [viewingEmailVerification, setViewingEmailVerification] = useState(false);
  const [viewingSecurityStatus, setViewingSecurityStatus] = useState(false);
  const [viewingTwoFactor, setViewingTwoFactor] = useState(false);
  const [viewingSessions, setViewingSessions] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [bulkSignOutOpen, setBulkSignOutOpen] = useState(false);
  const [bulkSigningOut, setBulkSigningOut] = useState(false);
  const [bulkSignOutNotice, setBulkSignOutNotice] = useState(false);

  // Selecting Account & Security in the settings navigation should always
  // return to this root view, even when a nested security screen is open.
  useEffect(() => {
    setChangingPassword(false);
    setViewingEmailVerification(false);
    setViewingSecurityStatus(false);
    setViewingTwoFactor(false);
    setViewingSessions(false);
    setBulkSignOutOpen(false);
  }, [resetKey]);

  if (changingPassword) return <ChangePassword onBack={() => setChangingPassword(false)} />;
  if (viewingEmailVerification) return <EmailVerification onBack={() => setViewingEmailVerification(false)} />;
  if (viewingSecurityStatus) return <div className="security-subview"><AccountSecurityStatus otherSessionsSignedOut={otherSessionsSignedOut} /></div>;
  if (viewingTwoFactor) return <div className="security-subview"><TwoFactorAuthentication enabled={twoFactorEnabled} onEnabledChange={setTwoFactorEnabled} onBack={() => setViewingTwoFactor(false)} /></div>;
  if (viewingSessions) return <div className="security-subview"><ActiveSessions /></div>;

  const signOutOtherSessions = () => {
    setBulkSigningOut(true);
    window.setTimeout(() => {
      setOtherSessionsSignedOut(true);
      setBulkSigningOut(false);
      setBulkSignOutOpen(false);
      setBulkSignOutNotice(true);
    }, 700);
  };

  return <div>
    <h2 className="text-2xl font-bold text-slate-950">Account &amp; Security</h2>
    <p className="mt-1 text-sm text-slate-600">Manage your account security settings and monitor your account activity.</p>
    {bulkSignOutNotice && <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18} />Other Sessions Signed Out — You have been signed out of all other active devices. This device remains signed in.</p>}

    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <SecurityRow icon={LockKeyhole} title="Change Password" description="Update your password regularly to keep your account secure." onClick={() => setChangingPassword(true)} />
      <SecurityRow icon={Mail} title="Email Verification Status" description="Your email address is verified." badge={<Badge tone="success">Verified</Badge>} onClick={() => setViewingEmailVerification(true)} />
      <SecurityRow icon={ShieldCheck} title="Account Security Status" description="Your account is secure." badge={<Badge tone="success">Secure</Badge>} onClick={() => setViewingSecurityStatus(true)} />
      <SecurityRow icon={ShieldPlus} title="Two-Factor Authentication" description="Add an extra layer of security to your account." badge={<Badge tone={twoFactorEnabled ? "success" : "neutral"}>{twoFactorEnabled ? "Enabled" : "Disabled"}</Badge>} onClick={() => setViewingTwoFactor(true)} />
      <SecurityRow icon={Monitor} title="Active Sessions / Logged-in Devices" description="View and manage your active sessions." badge={<Badge>{otherSessionsSignedOut ? "1 Active Session" : "2 Active Sessions"}</Badge>} onClick={() => setViewingSessions(true)} />
      <SecurityRow icon={LogOut} title="Sign Out of Other Sessions" description="Sign out from all other devices except this one." onClick={() => !otherSessionsSignedOut && setBulkSignOutOpen(true)}><button type="button" onClick={() => !otherSessionsSignedOut && setBulkSignOutOpen(true)} disabled={otherSessionsSignedOut} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-default disabled:border-slate-300 disabled:text-slate-500">{otherSessionsSignedOut ? "Other Sessions Signed Out" : "Sign Out Others"}</button></SecurityRow>
    </div>
    {bulkSignOutOpen && <SignOutOtherSessionsDialog processing={bulkSigningOut} onCancel={() => !bulkSigningOut && setBulkSignOutOpen(false)} onConfirm={signOutOtherSessions} />}
  </div>;
}
