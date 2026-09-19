import React, { useState } from "react";
import { supabase } from "../../../../supabaseClient";
import {
  notifyTraineeSchedule,
  notifyAssessorSchedule,
} from "../../../../services/notificationService";

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

  return (
    <div className="w-full flex justify-center -mt-4">
      <div className="step-card">
        <div className="text-xl font-semibold text-gray-900 mb-6">
          <h1>Show full summary before finalizing</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <span className="font-semibold">Selected Assessment:</span>{" "}
          {selectedAssessment?.title || "No assessment selected"}
        </div>

        <div className="review-grid">
          <div className="review-card">
            <h3>Selected Trainees</h3>
            <p className="count">Count: {trainees.length} Trainees</p>
            <div className="mt-10 list-box">
              {trainees.length > 0 ? (
                trainees.map((t) => (
                  <div key={t.id || t.user_id} className="list-item">
                    {t.fullName || t.name || t.email || "Unnamed Trainee"}
                  </div>
                ))
              ) : (
                <div className="list-item text-gray-500">No trainees selected</div>
              )}
            </div>
          </div>

          <div className="review-card">
            <h3>Assigned Assessor</h3>
            <p className="sub-text">Selected Assessor for {qualification}</p>
            <div className="mt-10 list-box flex flex-col items-center text-center gap-2 pt-8 pb-4">
              {assessor.photo || assessor.image || assessor.raw?.profile_photo_url ? (
                <img
                  src={assessor.photo || assessor.image || assessor.raw?.profile_photo_url}
                  alt="assessor"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                  {assessorName?.charAt(0) || "A"}
                </div>
              )}
              <p className="font-semibold text-gray-900">{assessorName}</p>
              <p className="text-sm text-gray-600">ID: {assessorId}</p>
              <p className={`text-sm font-semibold ${assessorStatus === "Available" ? "text-green-600" : "text-amber-600"}`}>
                Status: {assessorStatus}
              </p>
            </div>
          </div>

          <div className="right-column">
            <div className="review-card">
              <h3>Schedule Details</h3>
              <div className="info-row">
                <span>Date:</span>
                <strong>{schedule.date || schedule.assessment_date || "N/A"}</strong>
              </div>
              <div className="info-row">
                <span>Start Time:</span>
                <strong>{schedule.startTime || schedule.start_time || "N/A"}</strong>
              </div>
              <div className="info-row">
                <span>Duration:</span>
                <strong>{duration}</strong>
              </div>
            </div>

            <div className="review-card">
              <h3>Assessment Summary</h3>
              <div className="info-row">
                <span>Total Trainees:</span>
                <strong>{trainees.length}</strong>
              </div>
              <div className="info-row">
                <span>Assessor:</span>
                <strong>{assessorName}</strong>
              </div>
              <div className="info-row">
                <span>Qualification Area:</span>
                <strong>{assessor.specialization || qualification || "N/A"}</strong>
              </div>
              <div className="info-row">
                <span>Assessment Type:</span>
                <strong>{selectedAssessment?.assessment_type || "Assessment"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="review-actions flex items-center justify-end gap-3">
          <button className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100" onClick={onBack} disabled={isSubmitting}>
            Back
          </button>
          <button className="rounded-lg px-6 py-3 font-semibold text-white bg-[#001F5B] hover:bg-[#001746] transition disabled:bg-gray-400" onClick={handleConfirmClick} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Assessment"}
          </button>
        </div>

        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h2 className="modal-title">FINAL CONFIRMATION</h2>
              <p className="modal-text">Are you sure you want to create this assessment?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button className="create-btn" onClick={handleCreateAssessment} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Assessment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessMessage && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h2 style={{ color: "#16a34a", fontSize: "24px", fontWeight: "700", textAlign: "center" }}>
                Created Successfully!
              </h2>
              <p className="modal-text">Assessment has been created successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewConfirm;