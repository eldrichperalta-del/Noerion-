import AssessorPanel from "../shared/AssessorPanel";

const toneClass = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export default function AssessorNotifications({
  notifications = [],
}) {
  return (
    <AssessorPanel title="Notifications">
      {notifications.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  toneClass[notification.tone] ||
                  toneClass.info
                }`}
              />

              <p className="text-sm text-gray-700">
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </AssessorPanel>
  );
}