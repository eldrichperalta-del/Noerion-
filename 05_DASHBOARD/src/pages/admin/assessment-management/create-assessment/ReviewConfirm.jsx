import React, { useState } from "react";
import { supabase } from "../../../../supabaseClient";
import {
  notifyTraineeSchedule,
  notifyAssessorSchedule,
} from "../../../../services/notificationService";
import {
  ClipboardList,
  Users,
  UserRound,
  CalendarDays,
  Clock,
  Timer,
  BadgeCheck,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function ReviewConfirm({
  assessmentData,
  onNext,
  onBack,
  resetAssessment,
  onComplete,
}) {
  const trainees =
    assessmentData?.trainees || assessmentData?.selectedTrainees || [];

  const assessor =
    assessmentData?.assessor || assessmentData?.selectedAssessor || {};

  const schedule = assessmentData?.schedule || {};

  const selectedAssessment =
    assessmentData?.selectedAssessment || assessmentData?.assessment || {};

  const qualification =
    assessmentData?.qualification ||
    selectedAssessment?.qualification ||
    assessor?.specialization ||
    "General";

  const assessorName =
    assessor.fullName ||
    assessor.name ||
    (assessor.first_name
      ? `${assessor.first_name} ${assessor.last_name || ""}`.trim()
      : "No Assessor Selected");

  const assessorId =
    assessor.assessorIdNo ||
    assessor.assessorId ||
    assessor.id ||
    "N/A";

  const assessorStatus = assessor.status || "Available";

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleConfirmClick = () => {
    if (assessorStatus === "Unavailable") {
      setErrorMessage(
        "Cannot confirm assessment: The selected assessor is currently unavailable or assigned to another session."
      );
      return;
    }

    if (!trainees || trainees.length === 0) {
      setErrorMessage("Please select at least one trainee before confirming.");
      return;
    }

    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const parseTime = (t) => {
    if (!t) return null;

    // Handle values such as:
    // "1:00 PM"
    // "01:00 PM"
    // "13:00"
    // "13:00:00"
    const value = String(t).trim();

    const amPmMatch = value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (amPmMatch) {
      let hours = Number(amPmMatch[1]);
      const minutes = Number(amPmMatch[2]);
      const period = amPmMatch[3].toUpperCase();

      if (period === "PM" && hours !== 12) {
        hours += 12;
      }

      if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    }

    const twentyFourHourMatch = value.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);

      return hours * 60 + minutes;
    }

    return null;
  };


  const duration = (() => {
    const startTimeVal =
      schedule?.startTime ||
      schedule?.start_time;

    const endTimeVal =
      schedule?.endTime ||
      schedule?.end_time;

    const start = parseTime(startTimeVal);
    const end = parseTime(endTimeVal);

    // Only calculate the duration from Start Time and End Time.
    // Do NOT use schedule.duration here because it may contain
    // the old decimal format such as "1.9 Hour(s)".
    if (
      start === null ||
      end === null ||
      end <= start
    ) {
      return "N/A";
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
  })();

  const handleCreateAssessment = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage(null);

    let createdBatchId = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const assessmentDateVal = schedule.date || schedule.assessment_date;
      const startTimeVal = schedule.startTime || schedule.start_time;
      const endTimeVal = schedule.endTime || schedule.end_time;
      const assessmentIdVal = selectedAssessment?.id || null;

      const traineeIds = trainees.map((t) => t.id || t.user_id).filter(Boolean);

      // PRE-CHECK: Block trainees who have ongoing/active/submitted assignments for this assessment
      if (traineeIds.length > 0 && assessmentIdVal) {
        const { data: activeAssignments, error: checkError } = await supabase
          .from("assignments")
          .select("trainee_id, status")
          .eq("assessment_id", assessmentIdVal)
          .in("trainee_id", traineeIds);

        if (checkError) throw checkError;

        // Check if any existing record isn't completed or evaluated
        const ongoingAssignment = activeAssignments?.find((item) => {
          const st = (item.status || "").toLowerCase().trim();
          return st !== "completed" && st !== "evaluated";
        });

        if (ongoingAssignment) {
          throw new Error(
            "One or more selected trainees already have an active or submitted assessment session that has not been evaluated yet."
          );
        }
      }

      // 1. Insert Batch Record
      const { data: batchData, error: batchError } = await supabase
        .from("assessment_batches")
        .insert([
          {
            assessment_id: assessmentIdVal,
            assessor_id: assessor?.id || null,
            assessment_name: selectedAssessment?.title || "Scheduled Assessment",
            qualification: qualification,
            assessment_type: selectedAssessment?.assessment_type || "Written",
            assessment_date: assessmentDateVal,
            start_time: startTimeVal,
            end_time: endTimeVal,
            duration: duration,
            instructions: schedule?.instructions || schedule?.venue || "",
            status: "Scheduled",
          },
        ])
        .select()
        .single();

      if (batchError) throw batchError;
      createdBatchId = batchData.id;

      // 2. Fetch existing attempts to set attempt_number for retakes
      const { data: existingAttempts } = await supabase
        .from("assignments")
        .select("trainee_id, attempt_number")
        .eq("assessment_id", assessmentIdVal)
        .in("trainee_id", traineeIds);

      // Map to track attempt counts per trainee
      const attemptMap = new Map();
      (existingAttempts || []).forEach((row) => {
        const currentMax = attemptMap.get(row.trainee_id) || 0;
        if ((row.attempt_number || 1) > currentMax) {
          attemptMap.set(row.trainee_id, row.attempt_number);
        }
      });

      // 3. Insert Assignment Records with incremented attempt_number
      let createdAssignments = [];

      if (trainees.length > 0 && batchData) {
        const assignmentsPayload = trainees.map((t) => {
          const tId = t.id || t.user_id;
          const prevAttempt = attemptMap.get(tId) || 0;

          return {
            batch_id: batchData.id,
            batch_name: batchData.assessment_name,
            assessment_id: assessmentIdVal,
            assessment_name:
              selectedAssessment?.title || "Scheduled Assessment",
            assessor_id: assessor?.id || null,
            trainee_id: tId,
            admin_id: user?.id || null,
            qualification: qualification,
            assessment_type:
              selectedAssessment?.assessment_type || "Written",
            assessment_date: assessmentDateVal
              ? new Date(assessmentDateVal).toISOString()
              : null,
            start_time: startTimeVal,
            end_time: endTimeVal,
            duration: duration,
            instructions:
              schedule?.instructions || schedule?.venue || "",
            status: "Scheduled",
            attempt_number: prevAttempt + 1,
            assigned_at: new Date().toISOString(),
          };
        });

        const {
          data,
          error: assignError,
        } = await supabase
          .from("assignments")
          .insert(assignmentsPayload)
          .select("id, trainee_id, assessor_id, batch_id");

        if (assignError) {
          // Rollback batch if assignments insert fails
          await supabase
            .from("assessment_batches")
            .delete()
            .eq("id", createdBatchId);

          throw assignError;
        }

        createdAssignments = data || [];
      }

      // 4. Create notifications only after the batch and assignments
      //    have been successfully created.
      //
      //    Notification failure must NOT rollback a valid assessment schedule.

      try {
        const createdAssignmentRows = createdAssignments || [];

        // Notify each selected trainee
        const traineeNotificationResults = await Promise.all(
          createdAssignmentRows.map(async (assignment) => {
            return notifyTraineeSchedule({
              traineeId: assignment.trainee_id,
              relatedId: assignment.batch_id,
              assessmentTitle:
                selectedAssessment?.title || "Scheduled Assessment",
            });
          })
        );

        // Notify assigned assessor once
        let assessorNotificationResult = null;

        if (assessor?.id && createdAssignmentRows.length > 0) {
          assessorNotificationResult = await notifyAssessorSchedule({
            assessorId: assessor.id,
            relatedId: createdAssignmentRows[0].batch_id,
            assessmentTitle:
              selectedAssessment?.title || "Scheduled Assessment",
          });
        }

        console.log("Assessment scheduling notifications:", {
          traineeNotifications: traineeNotificationResults,
          assessorNotification: assessorNotificationResult,
        });
      } catch (notificationError) {
        console.error(
          "Assessment scheduled successfully, but notification creation encountered an error:",
          notificationError
        );
      }



      onComplete?.(assessmentData);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        if (resetAssessment) resetAssessment();
      }, 2000);
    } catch (err) {
      console.error("Error creating assessment:", err);
      setErrorMessage(err.message || "Failed to create assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssessorAvailable = assessorStatus === "Available";

  return (
    <div className="w-full flex justify-center -mt-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl border border-gray-100 shadow-sm p-7">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Review &amp; confirm before finalizing
          </h1>
          <p className="text-base text-gray-500 mt-1">
            Double-check the details below, then confirm to schedule the assessment.
          </p>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-700">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 flex-none" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="flex-none text-red-400 hover:text-red-700 transition"
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* SELECTED ASSESSMENT */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#001F5B]/5 text-[#001F5B]">
            <ClipboardList size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Selected Assessment
            </p>
            <p className="text-base font-medium text-gray-900 truncate">
              {selectedAssessment?.title || "No assessment selected"}
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-12 gap-5">

          {/* TRAINEES */}
          <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users size={17} className="text-[#001F5B]" />
              <h3 className="text-base font-bold text-gray-900">Selected Trainees</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Count: {trainees.length} trainee{trainees.length !== 1 ? "s" : ""}
            </p>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
              {trainees.length > 0 ? (
                trainees.map((t) => (
                  <div
                    key={t.id || t.user_id}
                    className="px-3.5 py-2.5 text-base text-gray-700 truncate"
                  >
                    {t.fullName || t.name || t.email || "Unnamed Trainee"}
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-2.5 text-base text-gray-400">
                  No trainees selected
                </div>
              )}
            </div>
          </div>

          {/* ASSESSOR */}
          <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <UserRound size={17} className="text-[#001F5B]" />
              <h3 className="text-base font-bold text-gray-900">Assigned Assessor</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Selected assessor for {qualification}
            </p>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 px-4 py-6 text-center">
              {assessor.photo || assessor.image || assessor.raw?.profile_photo_url ? (
                <img
                  src={assessor.photo || assessor.image || assessor.raw?.profile_photo_url}
                  alt="assessor"
                  className="h-16 w-16 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#001F5B] text-lg font-bold text-white">
                  {assessorName?.charAt(0) || "A"}
                </div>
              )}
              <p className="text-base font-semibold text-gray-900">{assessorName}</p>
              <p className="text-sm text-gray-500">ID: {assessorId}</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${isAssessorAvailable
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                  }`}
              >
                <BadgeCheck size={13} />
                {assessorStatus}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">

            <div className="rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={17} className="text-[#001F5B]" />
                <h3 className="text-base font-bold text-gray-900">Schedule Details</h3>
              </div>

              <div className="space-y-2.5 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">
                    {schedule.date || schedule.assessment_date || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Start Time</span>
                  <span className="font-medium text-gray-900">
                    {schedule.startTime || schedule.start_time || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Timer size={15} />
                    Duration
                  </span>
                  <span className="font-medium text-gray-900">{duration}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={17} className="text-[#001F5B]" />
                <h3 className="text-base font-bold text-gray-900">Assessment Summary</h3>
              </div>

              <div className="space-y-2.5 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Trainees</span>
                  <span className="font-medium text-gray-900">{trainees.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assessor</span>
                  <span className="font-medium text-gray-900 truncate max-w-[60%] text-right">
                    {assessorName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Qualification Area</span>
                  <span className="font-medium text-gray-900 truncate max-w-[60%] text-right">
                    {assessor.specialization || qualification || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assessment Type</span>
                  <span className="font-medium text-gray-900">
                    {selectedAssessment?.assessment_type || "Assessment"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            className="rounded-xl border border-gray-200 px-6 py-2.5 text-base font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button
            className="flex items-center gap-2 rounded-xl bg-[#001F5B] px-6 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#001746] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Processing..." : "Confirm Assessment"}
          </button>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#001F5B]/5 text-[#001F5B]">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Final Confirmation
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Are you sure you want to create this assessment?
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-base font-semibold text-gray-600 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-2 rounded-xl bg-[#001F5B] px-5 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-[#001746] transition disabled:cursor-not-allowed disabled:bg-gray-300"
                  onClick={handleCreateAssessment}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Creating..." : "Create Assessment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-xl font-bold text-green-600">
                Created Successfully!
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Assessment has been created successfully.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ReviewConfirm;