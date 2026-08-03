import { useEffect, useState } from "react";
import { Award, ClipboardList, UserCheck, Users } from "lucide-react";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";
import { mockAdminDashboard } from "../../data/mockAdminDashboard";
import { certificateRecords } from "../../data/certificateRecords";
import { scheduledAssessments } from "../../data/scheduledAssessments";
import { supabase } from "../../supabaseClient";

const Card = ({ label, value, Icon, tint }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
    <p className="text-sm font-medium text-gray-900">{label}</p>
    <div className="mt-4 flex items-center gap-3">
      <div className={`rounded-xl p-3 ${tint}`}>
        <Icon size={22} />
      </div>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  </div>
);

export default function Home() {
  const [animateAnalytics, setAnimateAnalytics] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const { stats, analytics, activities } = mockAdminDashboard;

  useEffect(() => {
    const timer = setTimeout(() => setAnimateAnalytics(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const name = [data?.first_name, data?.last_name]
          .filter(Boolean)
          .join(" ");
        if (name) setAdminName(name);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Welcome, ${adminName}`}
        subtitle="Here is an overview of your platform activity and management tasks."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          label="Total Trainees"
          value={stats.totalTrainees}
          Icon={Users}
          tint="bg-blue-50"
        />
        <Card
          label="Total Assessors"
          value={stats.totalAssessors}
          Icon={UserCheck}
          tint="bg-amber-50"
        />
        <Card
          label="Total Assessments"
          value={stats.totalAssessments}
          Icon={ClipboardList}
          tint="bg-green-50"
        />
        <Card
          label="Certificates Issued"
          value={stats.certificatesIssued}
          Icon={Award}
          tint="bg-purple-50"
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section>
            <h2 className="mb-4 text-2xl font-bold">Assessments Panel</h2>
            <div className="overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
              <table className="w-full">
                <thead className="bg-gray-300">
                  <tr>
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-left">Assessment Type</th>
                    <th className="p-3 text-left">Schedule Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scheduledAssessments.length ? (
                    scheduledAssessments.map((assessment) => (
                      <tr key={assessment.id}>
                        <td className="p-3">{assessment.course}</td>
                        <td className="p-3">{assessment.type}</td>
                        <td className="p-3">{assessment.scheduleDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3">No scheduled assessments</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-bold">Certificate Status Panel</h2>
            <div className="overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
              <table className="w-full">
                <thead className="bg-gray-300">
                  <tr>
                    <th className="p-3 text-left">Trainee Name</th>
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-left">Certificate Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certificateRecords.map((certificate) => (
                    <tr key={certificate.certificateId}>
                      <td className="p-3">{certificate.traineeName}</td>
                      <td className="p-3">{certificate.course}</td>
                      <td className="p-3">{certificate.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section>
            <h2 className="mb-4 text-2xl font-bold">Recent Activity</h2>
            <div className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
              {activities.length ? (
                activities.map((activity) => (
                  <p key={activity.id}>{activity.message}</p>
                ))
              ) : (
                <p>No recent activity</p>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-bold">Quick Analytics</h2>
            <div className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
              <div className="space-y-5">
                {[
                  ["Pass Rate", analytics.passRate, "bg-blue-600"],
                  ["Completion Rate", analytics.completionRate, "bg-cyan-500"],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between">
                      <span>{label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${color}`}
                        style={{
                          width: animateAnalytics ? `${value}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}