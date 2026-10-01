import React, { useMemo, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../../styles/ScheduleAssessment.css";
import {
  CalendarDays,
  Clock,
  Timer,
  ClipboardList,
  Users,
  UserRound,
  AlertTriangle,
} from "lucide-react";

function ScheduleAssessment({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const schedule = assessmentData?.schedule || {};

  // Safely track trainees across different wizard states
  const traineeList =
    assessmentData?.trainees || assessmentData?.selectedTrainees || [];

  // Safely track selected assessor
  const selectedAssessor =
    assessmentData?.assessor || assessmentData?.selectedAssessor;

  // Safely track selected assessment
  const selectedAssessment =
    assessmentData?.selectedAssessment || assessmentData?.assessment;

  const selectedDate = schedule?.date
    ? new Date(schedule.date + "T00:00:00")
    : null;

  // SAFE DATE SELECTION
  const handleDateChange = (date) => {
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const formatted = `${year}-${month}-${day}`;

    setAssessmentData((prev) => ({
      ...prev,
      schedule: {
        ...(prev.schedule || {}),
        date: formatted,
        assessment_date: formatted,
      },
    }));
  };

  // RELIABLE TIME PARSER FOR INPUT CONVERSION
  const getTimeParts = (time) => {
    if (!time) return { value: "", period: "AM" };

    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      // Convert to 24-hour string for <input type="time" />
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const formatted24 = `${String(hours).padStart(2, "0")}:${minutes}`;

      return {
        value: formatted24,
        period,
      };
    }

    return {
      value: time,
      period: "AM",
    };
  };

  // SAFE TIME SELECTION WITH AUTOMATIC 12-HOUR FORMATTING
  const handleTimeChange = (field, type, value) => {
    setAssessmentData((prev) => {
      const currentTime = prev.schedule?.[field] || "";
      const parts = getTimeParts(currentTime);

      const timeValue =
        type === "time" ? value : parts.value;

      let periodValue =
        type === "period" ? value : parts.period;

      let combinedTime = "";

      if (timeValue) {
        const [hStr, mStr] = timeValue.split(":");

        let hours = parseInt(hStr, 10);
        const minutes = mStr || "00";

        if (type === "time") {
          periodValue = hours >= 12 ? "PM" : "AM";
        }

        const displayHours = hours % 12 || 12;

        const formattedHours = String(displayHours).padStart(
          2,
          "0"
        );

        combinedTime = `${formattedHours}:${minutes} ${periodValue}`;
      }

      return {
        ...prev,
        schedule: {
          ...(prev.schedule || {}),
          [field]: combinedTime,

          ...(field === "startTime"
            ? { start_time: combinedTime }
            : { end_time: combinedTime }),
        },
      };
    });
  };

  // RELIABLE TIME PARSER FOR DURATION & OVERLAP
  const parseTime = (t) => {
    if (!t) return -1;

    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!match) return -1;

    let [, h, m, period] = match;

    h = Number(h);
    m = Number(m);
    period = period.toUpperCase();

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return h * 60 + m;
  };

  // OVERLAP / INVALID TIME CHECK
  const hasOverlapWarning = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start === -1 || end === -1) return false;

    return start >= end;
  }, [schedule.startTime, schedule.endTime]);

  // COMPUTED DURATION
  const computedDuration = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (
      start === -1 ||
      end === -1
    ) {
      return "";
    }

    if (end <= start) {
      return "Invalid";
    }

    const totalMinutes = end - start;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }

    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }, [schedule.startTime, schedule.endTime]);

  // SYNC DURATION SAFELY OUTSIDE RENDER CYCLE
  useEffect(() => {
    if (
      computedDuration &&
      computedDuration !== "Invalid"
    ) {
      if (schedule.duration !== computedDuration) {
        setAssessmentData((prev) => ({
          ...prev,
          schedule: {
            ...(prev.schedule || {}),
            duration: computedDuration,
          },
        }));
      }
    }
  }, [
    computedDuration,
    schedule.duration,
    setAssessmentData,
  ]);

  // PROCEED VALIDATION
  const canProceed = useMemo(() => {
    return Boolean(
      schedule?.date &&
      schedule?.startTime &&
      schedule?.endTime &&
      !hasOverlapWarning
    );
  }, [
    schedule.date,
    schedule.startTime,
    schedule.endTime,
    hasOverlapWarning,
  ]);

  return (
    <div className="w-full flex justify-center -mt-4">
      <div className="grid grid-cols-9 gap-6 w-full max-w-6xl">

        {/* ================================================================
            LEFT SIDE
        ================================================================= */}

        <div className="col-span-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                Set the assessment date and time
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pick a date on the calendar, then define the start and end time.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6 items-start">

              {/* ==========================================================
                  CALENDAR
              =========================================================== */}

              <div className="col-span-7">
                <div className="bg-gray-50/60 rounded-2xl border border-gray-100 p-4 modern-calendar-wrap">
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    minDate={new Date()}
                  />
                </div>

                {selectedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 px-1">
                    <CalendarDays size={15} className="text-[#001F5B]" />
                    <span>
                      Selected:{" "}
                      <span className="font-medium text-gray-800">
                        {schedule.date}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* ==========================================================
                  TIME + BUTTONS
              =========================================================== */}

              <div className="col-span-5 flex flex-col h-full">

                {/* START TIME */}
                <div className="mb-5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Clock size={14} className="text-gray-400" />
                    Start Time
                  </label>

                  <div className="flex gap-2">

                    <div className="flex-1 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 transition focus-within:border-[#001F5B] focus-within:ring-1 focus-within:ring-[#001F5B]">
                      <input
                        type="time"
                        value={
                          getTimeParts(
                            schedule.startTime
                          ).value
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            "startTime",
                            "time",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                      />
                    </div>

                    <div className="w-20 bg-white rounded-xl border border-gray-200 px-2 py-2.5 transition focus-within:border-[#001F5B] focus-within:ring-1 focus-within:ring-[#001F5B]">
                      <select
                        value={
                          getTimeParts(
                            schedule.startTime
                          ).period
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            "startTime",
                            "period",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* END TIME */}
                <div className="mb-4">

                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Clock size={14} className="text-gray-400" />
                    End Time
                  </label>

                  <div className="flex gap-2">

                    <div className="flex-1 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 transition focus-within:border-[#001F5B] focus-within:ring-1 focus-within:ring-[#001F5B]">
                      <input
                        type="time"
                        value={
                          getTimeParts(
                            schedule.endTime
                          ).value
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            "endTime",
                            "time",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                      />
                    </div>

                    <div className="w-20 bg-white rounded-xl border border-gray-200 px-2 py-2.5 transition focus-within:border-[#001F5B] focus-within:ring-1 focus-within:ring-[#001F5B]">
                      <select
                        value={
                          getTimeParts(
                            schedule.endTime
                          ).period
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            "endTime",
                            "period",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* INVALID TIME */}
                {hasOverlapWarning && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 mb-4">
                    <AlertTriangle size={15} />
                    Invalid time range
                  </div>
                )}

                {/* INCOMPLETE FORM */}
                {!canProceed && (
                  <p className="text-xs text-gray-400 mb-2">
                    Please complete date, start time, and end time correctly.
                  </p>
                )}

                {/* BUTTONS */}
                <div className="mt-auto flex justify-end gap-3 pt-6">

                  <button
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition"
                  >
                    Back
                  </button>

                  <button
                    disabled={!canProceed}
                    onClick={onNext}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition shadow-sm ${canProceed
                      ? "bg-[#001F5B] hover:bg-[#001746]"
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                      }`}
                  >
                    Next
                  </button>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT SIDE - ASSESSMENT DETAILS SUMMARY
        ================================================================= */}

        <div className="col-span-3">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">

            <h3 className="text-base font-bold text-gray-900 mb-6 tracking-tight">
              Assessment Summary
            </h3>

            <div className="space-y-5">

              {/* ==========================================================
                  SELECTED ASSESSMENT
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <ClipboardList size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Assessment
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5 truncate">
                    {selectedAssessment?.title ||
                      "No assessment selected"}
                  </p>
                </div>
              </div>

              {/* ==========================================================
                  SELECTED TRAINEES
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <Users size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Trainees ({traineeList.length})
                  </p>

                  <div className="mt-1 max-h-32 overflow-y-auto pr-1">
                    <ul className="space-y-1">
                      {traineeList.length > 0 ? (
                        traineeList.map((trainee) => (
                          <li
                            key={
                              trainee.id ||
                              trainee.user_id
                            }
                            className="text-sm text-gray-700 truncate"
                          >
                            {trainee.fullName ||
                              trainee.name ||
                              trainee.email ||
                              "Trainee"}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-400">
                          No trainees selected
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ==========================================================
                  ASSESSOR
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <UserRound size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Assessor
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5 truncate">
                    {selectedAssessor?.fullName ||
                      selectedAssessor?.name ||
                      "None"}
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* ==========================================================
                  DATE
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <CalendarDays size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Date
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5 min-h-[18px]">
                    {schedule.date ||
                      "Select a date"}
                  </p>
                </div>
              </div>

              {/* ==========================================================
                  TIME
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <Clock size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Time
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5 min-h-[18px]">
                    {schedule.startTime &&
                      schedule.endTime
                      ? `${schedule.startTime} - ${schedule.endTime}`
                      : "Select time range"}
                  </p>
                </div>
              </div>

              {/* ==========================================================
                  DURATION
              =========================================================== */}

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
                  <Timer size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Duration
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5 min-h-[18px]">
                    {computedDuration ||
                      schedule.duration ||
                      "Auto-calculated"}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ScheduleAssessment;