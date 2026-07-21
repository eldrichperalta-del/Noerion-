import {
  FileText,
  GraduationCap,
  CalendarDays,
  Trophy,
  BadgeCheck,
} from "lucide-react";

export default function SummaryInfoCards({ assessment }) {
  const cards = [
    {
      title: "Assessment Title",
      value: assessment.title,
      icon: FileText,
    },
    {
      title: "Qualification / Course",
      value: assessment.qualification,
      icon: GraduationCap,
    },
    {
      title: "Date Completed",
      value: new Date(assessment.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      icon: CalendarDays,
    },
    {
      title: "Final Score",
      value: "88%",
      icon: Trophy,
    },
    {
      title: "Overall Classification",
      value: assessment.result,
      icon: BadgeCheck,
      badge: true,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">

      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-5"
          >

            <div className="flex items-center gap-2 mb-4">

              <Icon size={20} className="text-blue-700" />

              <p className="text-sm font-semibold text-gray-500">
                {card.title}
              </p>

            </div>

            {card.badge ? (
              <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                {card.value}
              </span>
            ) : (
              <h2 className="text-lg font-bold text-gray-800">
                {card.value}
              </h2>
            )}

          </div>
        );
      })}

    </div>
  );
}