import {
  Users,
  UserCheck,
  ClipboardList,
  Award,
} from "lucide-react";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";
import { useEffect, useState } from "react";
import { mockAdminDashboard } from "../../data/mockAdminDashboard";

function Home() {
  const [animateAnalytics, setAnimateAnalytics] = useState(false);
  const { stats: dashboardData, analytics: { passRate, completionRate }, assessments, certificates, activities } = mockAdminDashboard;

  useEffect(() => {
    const timer = setTimeout(() => setAnimateAnalytics(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Welcome, Admin" subtitle="Here is an overview of your platform activity and management tasks." />
      {/* OVERVIEW CARDS */}
      <div className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Trainees */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <p className="text-sm font-medium text-gray-900">Total Trainees</p>
            <div className="mt-4 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3"><Users size={22} /></div><span className="text-3xl font-bold">
                {dashboardData.totalTrainees}
              </span></div>
          </div>

          {/* Total Assessors */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <p className="text-sm font-medium text-gray-900">Total Assessors</p>
            <div className="mt-4 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-3"><UserCheck size={22} /></div><span className="text-3xl font-bold">
                {dashboardData.totalAssessors}
              </span></div>
          </div>

          {/* Total Assessments */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <p className="text-sm font-medium text-gray-900">Total Assessments</p>
            <div className="mt-4 flex items-center gap-3"><div className="rounded-xl bg-green-50 p-3"><ClipboardList size={22} /></div><span className="text-3xl font-bold">
                {dashboardData.totalAssessments}
              </span></div>
          </div>

          {/* Certificates Issued */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)] border border-gray-100">
            <p className="text-sm font-medium text-gray-900">Certificates Issued</p>
            <div className="mt-4 flex items-center gap-3"><div className="rounded-xl bg-purple-50 p-3"><Award size={22} /></div><span className="text-3xl font-bold">
                {dashboardData.certificatesIssued}
              </span></div>
          </div>
        </div>
      </div>

      {/* SECOND MAIN CONTAINER */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="xl:col-span-2 space-y-6">
            {/* ACTIVE ASSESSMENTS */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                ACTIVE ASSESSMENTS PANEL
              </h2>

              <div className="overflow-hidden bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                <table className="w-full">
                  <thead className="bg-gray-300">
                    <tr>
                      <th className="text-left p-3">
                        Trainee Name
                      </th>

                      <th className="text-left p-3">
                        Assessment Type
                      </th>

                      <th className="text-left p-3">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {assessments.length === 0 ? (
                      <tr>
                        <td className="p-3">
                          No data available
                        </td>

                        <td className="p-3">-</td>

                        <td className="p-3">-</td>
                      </tr>
                    ) : (
                      assessments.map((assessment) => (
                        <tr key={assessment.id}>
                          <td className="p-3">
                            {assessment.traineeName}
                          </td>

                          <td className="p-3">
                            {assessment.assessmentType}
                          </td>

                          <td className="p-3">
                            {assessment.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CERTIFICATE STATUS */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                CERTIFICATE STATUS PANEL
              </h2>

              <div className="overflow-hidden bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                <table className="w-full">
                  <thead className="bg-gray-300">
                    <tr>
                      <th className="text-left p-3">
                        Trainee Name
                      </th>

                      <th className="text-left p-3">
                        Course
                      </th>

                      <th className="text-left p-3">
                        Certificate Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {certificates.length === 0 ? (
                      <tr>
                        <td className="p-3">
                          No data available
                        </td>

                        <td className="p-3">-</td>

                        <td className="p-3">-</td>
                      </tr>
                    ) : (
                      certificates.map((certificate) => (
                        <tr key={certificate.id}>
                          <td className="p-3">
                            {certificate.traineeName}
                          </td>

                          <td className="p-3">
                            {certificate.course}
                          </td>

                          <td className="p-3">
                            {certificate.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              RECENT ACTIVITY
            </h2>

            <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.20)] p-4">
              {activities.length === 0 ? (
                <p>No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <p key={activity.id}>
                    {activity.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* QUICK ANALYTICS */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            QUICK ANALYTICS
          </h2>

          <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-4">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Pass Rate</span>
                  <span>{passRate}%</span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div className="h-3 bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: animateAnalytics ? `${passRate}%` : "0%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Completion Rate</span>
                  <span>{completionRate}%</span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div className="h-3 bg-cyan-500 rounded-full transition-all duration-1000 ease-out" style={{ width: animateAnalytics ? `${completionRate}%` : "0%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;
