import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function ResultsOverviewCards({
  stats = {
    totalAssessments: 0,
    totalPassed: 0,
    totalFailed: 0,
    passRate: 0,
  },
}) {
  const passFailData = [
    { name: "Pass", value: stats.totalPassed },
    { name: "Fail", value: stats.totalFailed },
  ];

  const completionRateData = [
    { month: "Jan", rate: 60 },
    { month: "Feb", rate: 65 },
    { month: "Mar", rate: 70 },
    { month: "Apr", rate: 72 },
    { month: "May", rate: 78 },
    { month: "Jun", rate: 82 },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  const hasPassFailData =
    stats.totalPassed > 0 || stats.totalFailed > 0;

  return (
    <div className="overview-section">

      {/* ================= KPI CARDS ================= */}
      <div className="kpi-grid">

        {/* TOTAL */}
        <div className="kpi-card">
          <p>Total Assessments Completed</p>

          <div className="kpi-value-row">
            <ClipboardList className="kpi-icon" />
            <h3>{(stats.totalAssessments ?? 0).toLocaleString()}</h3>
          </div>
        </div>

        {/* PASSED */}
        <div className="kpi-card">
          <p>Total Passed</p>

          <div className="kpi-value-row">
            <CheckCircle className="kpi-icon" />
            <h3>{(stats.totalPassed ?? 0).toLocaleString()}</h3>
          </div>
        </div>

        {/* FAILED */}
        <div className="kpi-card">
          <p>Total Failed</p>

          <div className="kpi-value-row">
            <XCircle className="kpi-icon" />
            <h3>{(stats.totalFailed ?? 0).toLocaleString()}</h3>
          </div>
        </div>

        {/* PASS RATE */}
        <div className="kpi-card">
          <p>Overall Pass Rate</p>

          <div className="kpi-value-row">
            <TrendingUp className="kpi-icon" />
            <h3>{stats.passRate ?? 0}%</h3>
          </div>
        </div>

      </div>

      {/* ================= CHARTS ================= */}
      <div className="charts-grid">

        <div className="chart-card">
          <h4>Pass vs Fail Distribution</h4>

          {hasPassFailData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={passFailData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={70}
                  label
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              No assessment data available.
            </div>
          )}
        </div>

        <div className="chart-card">
          <h4>Assessment Completion Rate over Time</h4>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={completionRateData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}