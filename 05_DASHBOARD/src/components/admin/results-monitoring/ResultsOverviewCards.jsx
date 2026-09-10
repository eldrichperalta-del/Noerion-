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
  completionRateData = [],
}) {
  const passFailData = [
    { name: "Pass", value: stats.totalPassed },
    { name: "Fail", value: stats.totalFailed },
  ];

  const completionChartData =
    completionRateData?.length > 0
      ? completionRateData
      : [
        { month: "Jan", rate: undefined },
        { month: "Feb", rate: undefined },
        { month: "Mar", rate: undefined },
        { month: "Apr", rate: undefined },
        { month: "May", rate: undefined },
        { month: "Jun", rate: undefined },
      ];


  const COLORS = ["#22c55e", "#ef4444"];

  const hasPassFailData =
    stats.totalPassed > 0 || stats.totalFailed > 0;

  return (
    <div className="overview-section">

      {/* ================= KPI CARDS ================= */}
      <div className="mt-8 kpi-grid">

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

          <div className="pass-fail-chart">
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
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <>
                <div className="empty-pie-chart">
                  <div className="empty-pie-circle"></div>
                </div>

                <div className="empty-pie-legend">
                  <span>
                    <i className="legend-pass"></i>
                    Pass
                  </span>

                  <span>
                    <i className="legend-fail"></i>
                    Fail
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h4>Assessment Completion Rate over Time</h4>

          <div className="completion-chart-wrapper">

            {/* MANUAL Y-AXIS LABELS */}
            <div className="completion-y-axis">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={completionChartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 55,
                  bottom: 10,
                }}
              >
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                  axisLine={true}
                  tickLine={true}
                />

                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  allowDecimals={false}
                  width={10}
                  axisLine={true}
                  tick={false}
                  tickLine={true}
                />

                <Tooltip />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>
        </div>
      </div>
    </div>
  );
}