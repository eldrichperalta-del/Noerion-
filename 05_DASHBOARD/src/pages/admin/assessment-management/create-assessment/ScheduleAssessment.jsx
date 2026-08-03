import React, { useMemo } from "react";
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

  const selectedDate = schedule?.date
    ? new Date(schedule.date + "T00:00:00")
    : null;

  const timeOptions = [
    "09:00 AM", "09:30 AM",
    "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM",
  ];

  // ✅ SAFE STATE UPDATE: DATE
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
      },
    }));
  };

  // ✅ SAFE STATE UPDATE: TIME
  const handleChange = (e) => {
    const { name, value } = e.target;

    setAssessmentData((prev) => ({
      ...prev,
      schedule: {
        ...(prev.schedule || {}),
        [name]: value,
      },
    }));
  };

  // ✅ SINGLE RELIABLE TIME PARSER
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

  // 🚨 VALIDATION (FIXED)
  const hasOverlapWarning = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start === -1 || end === -1) return false;

    return start >= end;
  }, [schedule.startTime, schedule.endTime]);

  // ⏱ DURATION (FIXED)
  const computedDuration = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start === null || end === null) return "";

    if (end <= start) return "Invalid";

    const diff = (end - start) / 60;
    return `${diff} Hour(s)`;
  }, [schedule.startTime, schedule.endTime]);

  // ✅ FIXED canProceed
  const canProceed = useMemo(() => {
    return Boolean(
      schedule?.date &&
      schedule?.startTime &&
      schedule?.endTime &&
      !hasOverlapWarning
    );
  }, [schedule.date, schedule.startTime, schedule.endTime, hasOverlapWarning]);

  return (
    <div className="w-full flex justify-center -mt-4">
      <div className="grid grid-cols-9 gap-6 w-full max-w-6xl">

        {/* LEFT SIDE */}
        <div className="col-span-6">
          <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-6">

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Set the assessment date and time.
            </h2>

            <div className="grid grid-cols-12 gap-6 items-start">

              {/* CALENDAR */}
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

              {/* TIME + BUTTONS */}
              <div className="col-span-5 flex flex-col h-full">

                {/* START TIME */}
                <div className="mb-6">
                  <label className="font-medium block mb-2">Start Time</label>

                  <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
                    <select
                      name="startTime"
                      value={schedule.startTime}
                      onChange={handleChange}
                      className="w-full bg-transparent focus:outline-none text-sm"
                    >
                      <option value="">Start with</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* END TIME */}
                <div className="mb-4">
                  <label className="font-medium block mb-2">End Time</label>

                  <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
                    <select
                      name="endTime"
                      value={schedule.endTime}
                      onChange={handleChange}
                      className="w-full bg-transparent focus:outline-none text-sm"
                    >
                      <option value="">End with</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasOverlapWarning && (
                  <div className="text-red-600 text-sm font-medium mb-4">
                    ⚠ Invalid time range
                  </div>
                )}

                {!canProceed && (
                  <p className="text-xs text-red-500 mb-2">
                    Please complete date, start time, and end time correctly.
                  </p>
                )}

                <div className="mt-auto flex justify-end gap-4 pt-6">

                  {/* BACK BUTTON */}
                  <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Back
                  </button>

                  {/* NEXT BUTTON */}
                  <button
                    disabled={!canProceed}
                    onClick={onNext}
                    className={`px-6 py-3 rounded-lg font-semibold text-white transition ${canProceed
                      ? "bg-[#001F5B] hover:bg-[#001746]"
                      : "bg-gray-300 cursor-not-allowed"
                      }`}
                  >
                    Next Step
                  </button>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.35)] p-5">

            <h3 className="text-lg font-bold mb-8">
              Assessment Details Summary
            </h3>

            <p className="font-semibold mb-2">Selected Course</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 text-sm text-gray-700">
              {assessmentData?.selectedAssessment?.title || "No assessment selected"}
            </div>

            <p className="font-semibold mb-2">Selected Trainees</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4">
              <ul className="ml-5 list-disc text-sm text-gray-700">
                {assessmentData?.trainees?.length > 0 ? (
                  assessmentData.trainees.map((trainee) => (
                    <li key={trainee.id}>
                      {trainee.fullName}
                    </li>
                  ))
                ) : (
                  <li>No trainees selected</li>
                )}
              </ul>
            </div>

            <p className="font-semibold mb-2">Assessor</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 text-sm text-gray-700">
              {assessmentData?.assessor?.name || "None"}
            </div>

            <p className="font-semibold mb-2">Date</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 text-sm text-gray-700 min-h-[45px] flex items-center">
              {schedule.date || "Select a date"}
            </div>

            <p className="font-semibold mb-2">Time</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 text-sm text-gray-700 min-h-[45px] flex items-center">
              {schedule.startTime && schedule.endTime
                ? `${schedule.startTime} - ${schedule.endTime}`
                : "Select time range"}
            </div>

            <p className="font-semibold mb-2">Duration</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 text-sm text-gray-700 min-h-[45px] flex items-center">
              {computedDuration || schedule.duration || "Auto-calculated"}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleAssessment;
