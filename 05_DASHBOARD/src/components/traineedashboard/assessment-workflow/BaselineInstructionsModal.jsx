import {
  Info,
  UserRound,
  Eye,
  Bell,
  Moon,
  Clock3,
  ShieldCheck,
  Check,
  ArrowRight,
  X,
} from "lucide-react";

export default function BaselineInstructionsModal({
  onContinue,
  onCancel,
}) {
  return (
   <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-[1px] p-4">
      <div className="w-[600px] rounded-3xl bg-white shadow-2xl p-5">
        
        {/* Header - Compacted */}
        <div className="flex items-start justify-between border-b border-slate-300 pb-4 mb-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Info className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Baseline EEG Recording Instructions
              </h2>
              <p className="text-xs text-slate-500">Please read carefully before beginning.</p>
            </div>
          </div>
          <button onClick={onCancel} className="hover:bg-slate-100 rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        {/* Steps - Minimized vertical gaps */}
        <div className="space-y-2 mb-4">
          {[
            { icon: UserRound, color: "blue", title: "Prepare the setup", text: "Sit comfortably with your feet flat on the floor, rest your hands on your lap, and remain as still as possible." },
            { icon: Eye, color: "green", title: "Eyes-open baseline", text: "Fix your gaze on the point ahead and breathe normally for two and a half minutes.", time: "2:30" },
            { icon: Bell, color: "yellow", title: "Transition", text: "Wait for the auditory cue or verbal signal before moving to the next stage." },
            { icon: Moon, color: "purple", title: "Eyes-closed baseline", text: "Gently close your eyes, maintain posture, and relax without falling asleep for 2:30.", time: "2:30" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-300 p-3 bg-slate-50/50">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-${step.color}-100 text-m font-bold text-${step.color}-700`}>
                {i + 1}
              </div>
              <step.icon size={20} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
                <p className="text-[11px] leading-tight text-slate-600">{step.text}</p>
              </div>
              {step.time && (
                <div className="shrink-0 flex items-center gap-1 bg-white border px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                  <Clock3 size={10} /> {step.time}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important - Compact */}
        <div className="rounded-xl bg-blue-50 p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-blue-800" size={20} />
            <h3 className="text-m font-bold text-blue-700">Important Reminders</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-700">
            <div className="flex items-center gap-1">✓ Remain still</div>
            <div className="flex items-center gap-1">✓ Secure headset</div>
            <div className="flex items-center gap-1">✓ Avoid talking</div>
            <div className="flex items-center gap-1">✓ Follow instructions</div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={onContinue} className="flex items-center gap-1 bg-blue-700 px-4 py-2 rounded-lg text-white font-semibold text-xs hover:bg-blue-800">
            I Understand, Continue <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}