
import AssessorPanel from "../shared/AssessorPanel";

export default function UpcomingSchedule({
  schedules,
}) {
  return (
    <AssessorPanel title="Upcoming Schedule">
      {schedules.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500">
          No upcoming schedules found.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="grid grid-cols-[52px_1fr] gap-3 p-4"
            >
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-500">
                  {schedule.month}
                </p>

                <p className="text-lg font-bold text-gray-950">
                  {schedule.day}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-950">
                  {schedule.traineeName}
                </p>

                <p className="text-sm text-gray-600">
                  {schedule.assessmentType}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {schedule.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AssessorPanel>
  );
}

