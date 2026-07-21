export default function DashboardBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">

      {/* Grid */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(37,99,235,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
      </div>

      {/* Glow */}
      <div className="absolute right-8 top-0 h-32 w-[620px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_62%)] blur-2xl opacity-40" />

      {/* ECG */}
      <svg
        className="absolute right-8 top-3 h-24 w-[520px] text-[#8fb5d9] opacity-40"
        viewBox="0 0 520 96"
        fill="none"
      >
        <path
          d="M0 58 L24 58 L33 41 L44 70 L59 35 L71 62 L84 58 L96 58 L110 38 L126 69 L142 16 L158 62 L174 58 L188 58 L202 31 L216 74 L231 44 L246 56 L260 58 L276 58 L289 20 L306 82 L320 50 L337 55 L353 58 L370 58 L382 36 L397 65 L413 51 L429 56 L444 58 L458 25 L474 76 L489 43 L520 58"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

    </div>
  );
}