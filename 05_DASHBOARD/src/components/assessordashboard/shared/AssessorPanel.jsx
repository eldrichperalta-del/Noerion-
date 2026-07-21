export default function AssessorPanel({
  title,
  children,
  className = "",
}) {
  return (
    <section className={className}>
      {title && (
        <h2 className="mb-4 text-xl font-bold text-gray-950">
          {title}
        </h2>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
        {children}
      </div>
    </section>
  );
}
