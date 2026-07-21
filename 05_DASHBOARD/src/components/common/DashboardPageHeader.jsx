export default function DashboardPageHeader({ title, subtitle }) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">{subtitle}</p>
    </header>
  );
}
