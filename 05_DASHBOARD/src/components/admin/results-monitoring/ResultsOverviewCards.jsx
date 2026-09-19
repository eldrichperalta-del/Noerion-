import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Theme tokens                                                        */
/* ------------------------------------------------------------------ */
const PASS_COLOR = "#22c55e";
const FAIL_COLOR = "#ef4444";
const LINE_COLOR = "#3b82f6";
const TRACK_COLOR = "#e5e7eb";
const AXIS_COLOR = "#94a3b8";

const CARD =
  "rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)]";

/* ------------------------------------------------------------------ */
/* Shared tooltip                                                      */
/* ------------------------------------------------------------------ */
function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="text-xs font-medium text-gray-500">
        {label ?? item.name}
      </p>

      <p className="mt-0.5 text-sm font-semibold text-gray-900">
        {item.value}
        {suffix}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom legend                                                       */
/* ------------------------------------------------------------------ */
function LegendRow({
  label,
  value,
  percent,
  color,
  tint,
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ${tint}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: color,
            }}
          />

          <span className="text-sm font-medium text-gray-700">
            {label}
          </span>
        </div>

        <span className="text-sm font-semibold text-gray-900">
          {value}

          <span className="ml-1.5 font-medium text-gray-500">
            ({percent}%)
          </span>
        </span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Measured chart wrapper                                              */
/* ------------------------------------------------------------------ */
/*
 * Recharts ResponsiveContainer can sometimes calculate
 * width/height as -1 when its parent is being resized or
 * when it is inside a grid/flex layout.
 *
 * This wrapper measures the actual DOM width and provides
 * an explicit width to the chart.
 */
function MeasuredChart({
  children,
  height = 220,
}) {
  const [width, setWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextWidth =
        element.getBoundingClientRect().width;

      if (nextWidth > 0) {
        setWidth(Math.floor(nextWidth));
      }
    };

    updateSize();

    const observer =
      new ResizeObserver(updateSize);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        height: `${height}px`,
      }}
    >
      {width > 0
        ? React.cloneElement(children, {
            width,
            height,
          })
        : null}
    </div>
  );
}

export default function ResultsOverviewCards({
  stats = {
    totalAssessments: 0,
    totalPassed: 0,
    totalFailed: 0,
    passRate: 0,
  },

  completionRateData = [],
}) {
  /* ================================================================
     PASS / FAIL
  ================================================================ */

  const passed =
    stats.totalPassed ?? 0;

  const failed =
    stats.totalFailed ?? 0;

  const total =
    passed + failed;

  const hasPassFailData =
    total > 0;

  const passPercent =
    hasPassFailData
      ? Math.round(
          (passed / total) * 100
        )
      : 0;

  const failPercent =
    hasPassFailData
      ? 100 - passPercent
      : 0;

  const passFailData = [
    {
      name: "Pass",
      value: passed,
    },
    {
      name: "Fail",
      value: failed,
    },
  ];

  /* ================================================================
     COMPLETION DATA
     
     IMPORTANT:
     This component DOES NOT create data.
     
     It only displays the data received from CourseResults.jsx.
  ================================================================ */

  const completionChartData =
    (completionRateData ?? []).filter(
      (item) =>
        item &&
        item.date != null &&
        item.rate != null
    );

  const hasCompletionData =
    completionChartData.length > 0;

  return (
    <div className="overview-section">

      {/* ==========================================================
          KPI CARDS
      =========================================================== */}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Total Assessments Completed
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <ClipboardList
                className="h-6 w-6 text-blue-600"
                strokeWidth={2}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {(stats.totalAssessments ?? 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* PASSED */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Total Passed
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <CheckCircle
                className="h-6 w-6 text-green-600"
                strokeWidth={2}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {passed.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* FAILED */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Total Failed
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <XCircle
                className="h-6 w-6 text-red-600"
                strokeWidth={2}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {failed.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* PASS RATE */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Overall Pass Rate
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
              <TrendingUp
                className="h-6 w-6 text-purple-600"
                strokeWidth={2}
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {stats.passRate ?? 0}%
            </h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
          CHARTS
      =========================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ========================================================
            PASS VS FAIL
        ========================================================= */}

        <div className={CARD}>
          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-900">
              Pass vs Fail Distribution
            </h4>

            <p className="mt-0.5 text-xs text-gray-500">
              Share of completed assessments by result
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row">

            <div className="relative h-[200px] w-[200px] shrink-0">
              <PieChart
                width={200}
                height={200}
              >
                <Pie
                  data={
                    hasPassFailData
                      ? passFailData
                      : [
                          {
                            name: "Empty",
                            value: 1,
                          },
                        ]
                  }
                  dataKey="value"
                  nameKey="name"
                  innerRadius={66}
                  outerRadius={92}
                  paddingAngle={
                    hasPassFailData
                      ? 5
                      : 0
                  }
                  cornerRadius={10}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  {hasPassFailData ? (
                    passFailData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            index === 0
                              ? PASS_COLOR
                              : FAIL_COLOR
                          }
                        />
                      )
                    )
                  ) : (
                    <Cell
                      fill={TRACK_COLOR}
                    />
                  )}
                </Pie>

                {hasPassFailData && (
                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                  />
                )}
              </PieChart>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none text-gray-900">
                  {hasPassFailData
                    ? `${passPercent}%`
                    : "—"}
                </span>

                <span className="mt-1.5 text-xs font-medium text-gray-500">
                  Pass rate
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <LegendRow
                label="Pass"
                value={passed}
                percent={passPercent}
                color={PASS_COLOR}
                tint="bg-green-50"
              />

              <LegendRow
                label="Fail"
                value={failed}
                percent={failPercent}
                color={FAIL_COLOR}
                tint="bg-red-50"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            COMPLETION RATE
        ========================================================= */}

        <div className={CARD}>

          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-900">
              Assessment Completion Rate over Time
            </h4>

            <p className="mt-0.5 text-xs text-gray-500">
              Based on recorded results only
            </p>
          </div>

          <div className="w-full">

            {hasCompletionData ? (
              <MeasuredChart height={220}>
                <AreaChart
                  data={completionChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="completionGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={LINE_COLOR}
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor={LINE_COLOR}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    stroke="#eef0f4"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    padding={{
                      left: 16,
                      right: 16,
                    }}
                    tick={{
                      fontSize: 12,
                      fill: AXIS_COLOR,
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[
                      0,
                      20,
                      40,
                      60,
                      80,
                      100,
                    ]}
                    tickFormatter={(value) =>
                      `${value}%`
                    }
                    axisLine={false}
                    tickLine={false}
                    width={46}
                    tick={{
                      fontSize: 12,
                      fill: AXIS_COLOR,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      stroke: LINE_COLOR,
                      strokeOpacity: 0.25,
                      strokeWidth: 1,
                    }}
                    content={
                      <ChartTooltip suffix="%" />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={LINE_COLOR}
                    strokeWidth={3}
                    strokeLinecap="round"
                    fill="url(#completionGradient)"
                    dot={{
                      r: 4,
                      fill: "#fff",
                      stroke: LINE_COLOR,
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: LINE_COLOR,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </MeasuredChart>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-center">
                <TrendingUp
                  className="mb-2 h-6 w-6 text-gray-300"
                  strokeWidth={2}
                />

                <p className="text-sm font-medium text-gray-600">
                  No completion data yet
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                  The chart appears once recorded results are available.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

