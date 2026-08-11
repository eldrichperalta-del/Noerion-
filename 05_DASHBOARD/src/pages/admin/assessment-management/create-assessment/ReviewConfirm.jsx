import React, { useState } from "react";
import { supabase } from "../../../../supabaseClient";

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
    if (!t) return 0;
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [, h, m, period] = match;
    h = Number(h);
    m = Number(m);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const duration = (() => {
    const startTimeVal = schedule?.startTime || schedule?.start_time;
    const endTimeVal = schedule?.endTime || schedule?.end_time;
    const start = parseTime(startTimeVal);
    const end = parseTime(endTimeVal);
    if (!start || !end || end <= start) return schedule?.duration || "N/A";
    return `${(end - start) / 60} Hour(s)`;
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

      const traineeIds = trainees.map((t) => t.id || t.user_id).filter(Boolean);

      // PRE-CHECK: Verify if any selected trainee is currently in an active/scheduled session
      if (traineeIds.length > 0) {
        const { data: existingAssignments, error: checkError } = await supabase
          .from("assignments")
          .select("trainee_id")
          .in("trainee_id", traineeIds)
          .in("status", ["Scheduled", "Pending", "Assigned"]); // 👈 Only block active/scheduled sessions

        if (checkError) throw checkError;

        if (existingAssignments && existingAssignments.length > 0) {
          throw new Error(
            "One or more selected trainees are currently assigned to an ongoing session. Please go back and select available trainees."
          );
        }
      }

      // 1. Insert Batch Record
      const { data: batchData, error: batchError } = await supabase
        .from("assessment_batches")
        .insert([
          {
            assessment_id: selectedAssessment?.id || null,
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

      // 2. Insert Assignment Records
      if (trainees.length > 0 && batchData) {
        const assignmentsPayload = trainees.map((t) => ({
          batch_id: batchData.id,
          batch_name: batchData.assessment_name,
          assessment_id: selectedAssessment?.id || null,
          assessment_name: selectedAssessment?.title || "Scheduled Assessment",
          assessor_id: assessor?.id || null,
          trainee_id: t.id || t.user_id,
          admin_id: user?.id || null,
          qualification: qualification,
          assessment_type: selectedAssessment?.assessment_type || "Written",
          assessment_date: assessmentDateVal ? new Date(assessmentDateVal).toISOString() : null,
          start_time: startTimeVal,
          end_time: endTimeVal,
          duration: duration,
          instructions: schedule?.instructions || schedule?.venue || "",
          status: "Scheduled", // 👈 Updated from "Pending" to "Scheduled"
          assigned_at: new Date().toISOString(),
        }));

        const { error: assignError } = await supabase
          .from("assignments")
          .insert(assignmentsPayload);

        if (assignError) {
          // Hard rollback batch if assignments fails
          await supabase.from("assessment_batches").delete().eq("id", createdBatchId);
          throw assignError;
        }
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
          <span className="font-semibold">Selected Course:</span>{" "}
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