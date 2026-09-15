export default function AssessorNotifications({
  notifications = [],
  loading = false,
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-950">
        Recent Activity
      </h2>

      <div className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-500">
            Loading recent activity...
          </p>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-3 transition-colors ${notification.is_read
                    ? "border-gray-100 bg-white"
                    : "border-blue-100 bg-blue-50/50"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read
                        ? "bg-gray-300"
                        : "bg-blue-600"
                      }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-950">
                      {notification.title}
                    </p>

                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>

                    {notification.created_at && (
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          notification.created_at
                        ).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">
            No recent activity
          </p>
        )}
      </div>
    </section>
  );
}

