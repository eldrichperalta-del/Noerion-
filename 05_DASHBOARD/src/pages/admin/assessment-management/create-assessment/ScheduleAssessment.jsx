
import React, { useMemo, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../../styles/ScheduleAssessment.css";

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
      start === null ||
      start === -1 ||
      end === null ||
      end === -1
    ) {
      return "";
    }

    if (end <= start) return "Invalid";

    const diff = (end - start) / 60;

    return `${diff} Hour(s)`;
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
          <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-6">

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Set the assessment date and time.
            </h2>

            <div className="grid grid-cols-12 gap-6 items-start">

              {/* ==========================================================
                  CALENDAR
              =========================================================== */}

              <div className="col-span-7">
                <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.30)] p-6">
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    minDate={new Date()}
                  />
                </div>

                {selectedDate && (
                  <p className="text-sm text-gray-500 mt-3">
                    Selected: {schedule.date}
                  </p>
                )}
              </div>

              {/* ==========================================================
                  TIME + BUTTONS
              =========================================================== */}

              <div className="col-span-5 flex flex-col h-full">

                {/* START TIME */}
                <div className="mb-6">
                  <label className="font-medium block mb-2">
                    Start Time
                  </label>

                  <div className="flex gap-2">

                    <div className="flex-1 bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
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
                        className="w-full bg-transparent focus:outline-none text-sm"
                      />
                    </div>

                    <div className="w-24 bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
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
                        className="w-full bg-transparent focus:outline-none text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* END TIME */}
                <div className="mb-4">

                  <label className="font-medium block mb-2">
                    End Time
                  </label>

                  <div className="flex gap-2">

                    <div className="flex-1 bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
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
                        className="w-full bg-transparent focus:outline-none text-sm"
                      />
                    </div>

                    <div className="w-24 bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
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
                        className="w-full bg-transparent focus:outline-none text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* INVALID TIME */}
                {hasOverlapWarning && (
                  <div className="text-red-600 text-sm font-medium mb-4">
                    ⚠ Invalid time range
                  </div>
                )}

                {/* INCOMPLETE FORM */}
                {!canProceed && (
                  <p className="text-xs text-red-500 mb-2">
                    Please complete date, start time, and end time correctly.
                  </p>
                )}

                {/* BUTTONS */}
                <div className="mt-auto flex justify-end gap-4 pt-6">

                  <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Back
                  </button>

                  <button
                    disabled={!canProceed}
                    onClick={onNext}
                    className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                      canProceed
                        ? "bg-[#001F5B] hover:bg-[#001746]"
                        : "bg-gray-300 cursor-not-allowed"
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

          {/* Main summary container stays */}
          <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.35)] p-5">

            <h3 className="text-lg font-bold mb-8">
              Assessment Details Summary
            </h3>

            {/* ============================================================
                SELECTED ASSESSMENT
            ============================================================= */}

            <p className="font-semibold mb-1">
              Selected Assessment
            </p>

            <p className="text-sm text-gray-700 mb-4">
              {selectedAssessment?.title ||
                "No assessment selected"}
            </p>

            {/* ============================================================
                SELECTED TRAINEES
            ============================================================= */}

            <p className="font-semibold mb-1">
              Selected Trainees ({traineeList.length})
            </p>

            <div className="mb-4 max-h-40 overflow-y-auto">

              <ul className="ml-5 list-disc text-sm text-gray-700">

                {traineeList.length > 0 ? (
                  traineeList.map((trainee) => (
                    <li
                      key={
                        trainee.id ||
                        trainee.user_id
                      }
                    >
                      {trainee.fullName ||
                        trainee.name ||
                        trainee.email ||
                        "Trainee"}
                    </li>
                  ))
                ) : (
                  <li>
                    No trainees selected
                  </li>
                )}

              </ul>

            </div>

            {/* ============================================================
                ASSESSOR
            ============================================================= */}

            <p className="font-semibold mb-1">
              Assessor
            </p>

            <p className="text-sm text-gray-700 mb-4">
              {selectedAssessor?.fullName ||
                selectedAssessor?.name ||
                "None"}
            </p>

            {/* ============================================================
                DATE
            ============================================================= */}

            <p className="font-semibold mb-1">
              Date
            </p>

            <p className="text-sm text-gray-700 mb-4 min-h-[20px]">
              {schedule.date ||
                "Select a date"}
            </p>

            {/* ============================================================
                TIME
            ============================================================= */}

            <p className="font-semibold mb-1">
              Time
            </p>

            <p className="text-sm text-gray-700 mb-4 min-h-[20px]">
              {schedule.startTime &&
              schedule.endTime
                ? `${schedule.startTime} - ${schedule.endTime}`
                : "Select time range"}
            </p>

            {/* ============================================================
                DURATION
            ============================================================= */}

            <p className="font-semibold mb-1">
              Duration
            </p>

            <p className="text-sm text-gray-700 min-h-[20px]">
              {computedDuration ||
                schedule.duration ||
                "Auto-calculated"}
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ScheduleAssessment;

