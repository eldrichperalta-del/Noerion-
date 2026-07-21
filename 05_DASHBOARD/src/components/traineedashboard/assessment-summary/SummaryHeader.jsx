export default function SummaryHeader() {
  return (
    <div className="relative overflow-hiddenp-6">

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,#3b82f6_1px,transparent_1px)] bg-[length:18px_18px]" />
      </div>

      <h1 className="relative text-4xl font-bold text-gray-900">
        Assessment Summary
      </h1>

    </div>
  );
}