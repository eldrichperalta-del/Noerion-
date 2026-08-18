import { useState } from "react";
import { CheckCircle2, Laptop, Monitor, Smartphone, X } from "lucide-react";

const initialSessions = [
  { id: "macbook", device: "MacBook Pro", browser: "Safari", os: "macOS", location: "Philippines", lastActive: "Last active 2 hours ago", icon: Laptop },
  { id: "android", device: "Android Phone", browser: "Chrome", os: "Android", location: "Philippines", lastActive: "Last active yesterday", icon: Smartphone },
];

function SessionCard({ session, current, onSignOut }) {
  const Icon = session.icon;
  return <article className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"><Icon className="shrink-0 text-[#002f86]" size={25} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-950">{session.device}</p><p className="mt-0.5 text-xs text-slate-600">{session.browser} · {session.os}</p><p className="mt-0.5 text-xs text-slate-600">{session.location} · {current ? "Active now" : session.lastActive}</p></div>{current ? <span className="w-fit rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#002f86]">Current Device</span> : <button type="button" onClick={() => onSignOut(session)} className="w-fit rounded-lg border border-rose-300 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Sign Out</button>}</article>;
}

function ConfirmDialog({ title, message, action, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="session-dialog-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 id="session-dialog-title" className="text-xl font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p></div><button type="button" onClick={onCancel} aria-label="Close dialog" className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={onConfirm} className="rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800">{action}</button></div></div></div>;
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState(initialSessions);
  const [target, setTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const currentSession = { id: "current", device: "Windows PC", browser: "Chrome", os: "Windows 11", location: "Philippines", icon: Monitor };
  const isBulk = target === "all";
  const signOut = () => {
    if (isBulk) setSessions([]);
    else setSessions((current) => current.filter((session) => session.id !== target.id));
    setTarget(null);
    setNotice("Session signed out successfully.");
  };
  return <div className="max-w-3xl"><h2 className="text-2xl font-bold text-slate-950">Active Sessions</h2><p className="mt-1 border-b border-slate-200 pb-5 text-sm text-slate-600">Review the devices currently signed in to your account and sign out of sessions you don't recognize.</p>{notice && <p className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18} />{notice}</p>}<section className="mt-6"><h3 className="text-sm font-semibold text-slate-800">Current Session</h3><div className="mt-3"><SessionCard session={currentSession} current /></div></section><section className="mt-7"><h3 className="text-sm font-semibold text-slate-800">Other Active Sessions</h3><div className="mt-3 space-y-3">{sessions.length ? sessions.map((session) => <SessionCard key={session.id} session={session} onSignOut={setTarget} />) : <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No other active sessions.</p>}</div></section><section className="mt-7 border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-800">Sign Out of All Other Sessions</h3><p className="mt-1 text-sm text-slate-600">Sign out of all other devices while remaining signed in on this device.</p><button type="button" disabled={!sessions.length} onClick={() => setTarget("all")} className="mt-4 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">Sign Out of All Other Sessions</button></section>{target && <ConfirmDialog title={isBulk ? "Sign Out of All Other Sessions?" : "Sign Out of This Device?"} message={isBulk ? "This will sign you out of all other active devices. You will remain signed in on your current device." : "Are you sure you want to sign out this device? The user will need to sign in again to access the account."} action={isBulk ? "Sign Out Other Sessions" : "Sign Out"} onCancel={() => setTarget(null)} onConfirm={signOut} />}</div>;
}
