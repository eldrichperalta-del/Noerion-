import {
  FileText,
  GraduationCap,
  CalendarDays,
  Trophy,
  BadgeCheck,
} from "lucide-react";

export default function SummaryInfoCards({ assessment }) {
  // Safe extraction of properties with fallbacks
  const title = assessment?.title || "Assessment Title";
  const qualification = assessment?.qualification || "N/A";
  
  const rawDate = assessment?.date || assessment?.rawDate;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const score = assessment?.score ?? 0;
  const resultStatus = assessment?.result || "In evaluation";

  // Dynamic badge styling
  const getBadgeClass = (status) => {
    switch (status) {
      case "Pass":
      case "Competent":
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Failed":
      case "Not Yet Competent":
        return "bg-red-100 text-red-700";
      case "In evaluation":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const cards = [
    {
      title: "Assessment Title",
      value: title,
      icon: FileText,
    },
    {
      title: "Qualification / Course",
      value: qualification,
      icon: GraduationCap,
    },
    {
      title: "Date Completed",
      value: formattedDate,
      icon: CalendarDays,
    },
    {
      title: "Final Score",
      value: `${score}%`, // 👈 Always display the calculated score percentage
      icon: Trophy,
    },
    {
      title: "Overall Classification",
      value: resultStatus,
      icon: BadgeCheck,
      badge: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon size={20} className="text-blue-700 shrink-0" />
              <p className="text-sm font-semibold text-gray-500 truncate">
                {card.title}
              </p>
            </div>

            {card.badge ? (
              <div>
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getBadgeClass(
                    card.value
                  )}`}
                >
                  {card.value}
                </span>
              </div>
            ) : (
              <h2 className="text-lg font-bold text-gray-800 break-words" title={card.value}>
                {card.value}
              </h2>
            )}
          </div>
        );
      })}
    </div>
  );
}