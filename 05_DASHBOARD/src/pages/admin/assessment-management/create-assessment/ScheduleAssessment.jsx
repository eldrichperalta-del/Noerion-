import React, { useMemo, useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../../styles/ScheduleAssessment.css";

function ScheduleAssessment({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [isCustomTime, setIsCustomTime] = useState(false);

  const schedule = assessmentData?.schedule || {};

  // Safely track trainees across different wizard states
  const traineeList =
    assessmentData?.trainees || assessmentData?.selectedTrainees || [];

  // Safely track selected assessor
  const selectedAssessor =
    assessmentData?.assessor || assessmentData?.selectedAssessor;

  // Safely track selected assessment course
  const selectedAssessment =
    assessmentData?.selectedAssessment || assessmentData?.assessment;

  const selectedDate = schedule?.date
    ? new Date(schedule.date + "T00:00:00")
    : null;

  // Expanded Time Options: 12:00 AM to 11:30 PM
  const timeOptions = [
    "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
    "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
    "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
    "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
  ];

  // ✅ SAFE DATE SELECTION
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

  // ✅ SAFE TIME SELECTION
  const handleChange = (e) => {
    const { name, value } = e.target;

    setAssessmentData((prev) => {
      const updatedSchedule = {
        ...(prev.schedule || {}),
        [name]: value,
      };

      if (name === "startTime") updatedSchedule.start_time = value;
      if (name === "endTime") updatedSchedule.end_time = value;

      return {
        ...prev,
        schedule: updatedSchedule,
      };
    });
  };

  // ✅ RELIABLE TIME PARSER
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

  // 🚨 OVERLAP CHECK
  const hasOverlapWarning = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start === -1 || end === -1) return false;

    return start >= end;
  }, [schedule.startTime, schedule.endTime]);

  // ⏱ COMPUTED DURATION (PURE CALCULATION, NO SIDE-EFFECTS)
  const computedDuration = useMemo(() => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    if (start === null || start === -1 || end === null || end === -1) return "";

    if (end <= start) return "Invalid";

    const diff = (end - start) / 60;
    const formattedDiff = Number.isInteger(diff) ? diff : diff.toFixed(2);
    return `${formattedDiff} Hour(s)`;
  }, [schedule.startTime, schedule.endTime]);

  // ✅ SYNC DURATION SAFELY OUTSIDE RENDER CYCLE
  useEffect(() => {
    if (computedDuration && computedDuration !== "Invalid") {
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
  }, [computedDuration, schedule.duration, setAssessmentData]);

  // ✅ PROCEED VALIDATION
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

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Set the assessment date and time.
              </h2>
              {/* TOGGLE CUSTOM TIME MODE */}
              <button
                type="button"
                onClick={() => setIsCustomTime(!isCustomTime)}
                className="text-xs font-semibold text-[#001F5B] underline hover:text-blue-800"
              >
                {isCustomTime ? "Switch to Dropdown" : "Type Custom Time"}
              </button>
            </div>

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
                    {isCustomTime ? (
                      <input
                        type="text"
                        name="startTime"
                        placeholder="e.g. 09:48 PM"
                        value={schedule.startTime || ""}
                        onChange={handleChange}
                        className="w-full bg-transparent focus:outline-none text-sm"
                      />
                    ) : (
                      <select
                        name="startTime"
                        value={schedule.startTime || ""}
                        onChange={handleChange}
                        className="w-full bg-transparent focus:outline-none text-sm"
                      >
                        <option value="">Start with</option>
                        {timeOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* END TIME */}
                <div className="mb-4">
                  <label className="font-medium block mb-2">End Time</label>

                  <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3">
                    {isCustomTime ? (
                      <input
                        type="text"
                        name="endTime"
                        placeholder="e.g. 10:48 PM"
                        value={schedule.endTime || ""}
                        onChange={handleChange}
                        className="w-full bg-transparent focus:outline-none text-sm"
                      />
                    ) : (
                      <select
                        name="endTime"
                        value={schedule.endTime || ""}
                        onChange={handleChange}
                        className="w-full bg-transparent focus:outline-none text-sm"
                      >
                        <option value="">End with</option>
                        {timeOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
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
              {selectedAssessment?.title || "No assessment selected"}
            </div>

            <p className="font-semibold mb-2">
              Selected Trainees ({traineeList.length})
            </p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 max-h-40 overflow-y-auto">
              <ul className="ml-5 list-disc text-sm text-gray-700">
                {traineeList.length > 0 ? (
                  traineeList.map((trainee) => (
                    <li key={trainee.id || trainee.user_id}>
                      {trainee.fullName || trainee.name || trainee.email || "Trainee"}
                    </li>
                  ))
                ) : (
                  <li>No trainees selected</li>
                )}
              </ul>
            </div>

            <p className="font-semibold mb-2">Assessor</p>
            <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.25)] p-3 mb-4 text-sm text-gray-700">
              {selectedAssessor?.fullName || selectedAssessor?.name || "None"}
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