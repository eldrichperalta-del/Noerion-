import React, { useState } from "react";

function ReviewConfirm({
  assessmentData,
  onNext,
  onBack,
  resetAssessment,
}) {
  // ===============================
  // SAFELY DESTRUCTURE BACKEND DATA
  // ===============================
  const {
    trainees = [],
    assessor = {},
    schedule = {},
    qualification = "",
  } = assessmentData;

  // ===============================
  // UI STATE (FRONTEND ONLY)
  // ===============================
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ===============================
  // OPEN CONFIRMATION MODAL
  // ===============================
  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  // ===============================
  // CLOSE CONFIRMATION MODAL
  // ===============================
  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  // ===============================
  // FINAL CREATE ACTION (BACKEND HOOK POINT)
  // ===============================
  const handleCreateAssessment = () => {
    setShowConfirmModal(false);

    // =========================================================
    // 🔴 BACKEND INTEGRATION POINT (IMPORTANT)
    // Replace this console.log with API request:
    //
    // Example:
    // await axios.post("/api/assessments", assessmentData);
    // =========================================================
    console.log("ASSESSMENT CREATED PAYLOAD:", assessmentData);

    // Show success UI (frontend feedback only)
    setShowSuccessMessage(true);

    // Simulate success delay (replace with API response handling later)
    setTimeout(() => {
      setShowSuccessMessage(false);

      // =========================================================
      // RESET WIZARD AFTER SUCCESS
      // This returns user to Step 1 and clears all data
      // =========================================================
      if (resetAssessment) {
        resetAssessment();
      }
    }, 2000);
  };

  // ===============================
  // TIME PARSER (FRONTEND DISPLAY ONLY)
  // Backend should NOT rely on this
  // ===============================
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

  // ===============================
  // COMPUTED DURATION (UI ONLY)
  // Backend should compute this server-side
  // ===============================
  const duration = (() => {
    const start = parseTime(schedule?.startTime);
    const end = parseTime(schedule?.endTime);

    if (!start || !end || end <= start) return "N/A";

    return `${(end - start) / 60} Hour(s)`;
  })();

  return (
    <div className="w-full flex justify-center -mt-4">
      <div className="step-card">

        {/* =========================
            HEADER SECTION
        ========================== */}
        <div className="text-xl font-semibold text-gray-900 mb-6">
          <h1>Show full summary before finalizing</h1>
        </div>

        {/* =========================
            MAIN SUMMARY GRID
            (This is review before API submit)
        ========================== */}
        <div className="review-grid">

          {/* =========================
              LEFT: TRAINEES
          ========================== */}
          <div className="review-card">
            <h3>Selected Trainees</h3>
            <p className="count">
              Count: {trainees.length} Trainees
            </p>

            <div className="mt-10 list-box">
              {trainees.map((t, i) => (
                <div key={i} className="list-item">
                  {t.name}
                </div>
              ))}
            </div>
          </div>

          {/* =========================
              MIDDLE: ASSESSOR
          ========================== */}
          <div className="review-card">
            <h3>Assigned Assessor</h3>

            <p className="sub-text">
              Selected Assessor for {qualification}
            </p>

            {/* SAME STYLE AS LIST BOX */}
            <div className="mt-10 list-box flex flex-col items-center text-center gap-2 pt-8 pb-4">

              {/* IMAGE */}
              {assessor.photo || assessor.image ? (
                <img
                  src={assessor.photo || assessor.image}
                  alt="assessor"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                  {assessor.name?.charAt(0) || "A"}
                </div>
              )}

              {/* NAME */}
              <p className="font-semibold text-gray-900">
                {assessor.name || "No Assessor Selected"}
              </p>

              {/* ID */}
              <p className="text-sm text-gray-600">
                ID: {assessor.assessorId || assessor.id || "N/A"}
              </p>

              {/* STATUS */}
              <p className="text-sm text-green-600 font-medium">
                Status: Active
              </p>

            </div>
          </div>

          {/* =========================
              RIGHT: SCHEDULE + SUMMARY
          ========================== */}
          <div className="right-column">

            <div className="review-card">
              <h3>Schedule Details</h3>

              <div className="info-row">
                <span>Date:</span>
                <strong>{schedule.date || "N/A"}</strong>
              </div>

              <div className="info-row">
                <span>Start Time:</span>
                <strong>{schedule.startTime || "N/A"}</strong>
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
                <strong>{assessor.name || "N/A"}</strong>
              </div>

              <div className="info-row">
                <span>Qualification Area:</span>
                <strong>{assessor.specialization || "N/A"}</strong>
              </div>

              <div className="info-row">
                <span>Assessment Type:</span>
                <strong>Assessment</strong>
              </div>
            </div>

          </div>
        </div>

        {/* =========================
            ACTION BUTTONS
        ========================== */}
        <div className="review-actions flex items-center justify-end gap-3">
          <button
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100"
            onClick={onBack}
          >
            Back
          </button>

          <button
            className="rounded-lg px-6 py-3 font-semibold text-white bg-[#001F5B] hover:bg-[#001746] transition"
            onClick={handleConfirmClick}
          >
            Confirm Assessment
          </button>
        </div>

        {/* =========================
            CONFIRMATION MODAL
        ========================== */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-container">

              <h2 className="modal-title">
                FINAL CONFIRMATION
              </h2>

              <p className="modal-text">
                Are you sure you want to create this assessment?
              </p>

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  className="create-btn"
                  onClick={handleCreateAssessment}
                >
                  Create Assessment
                </button>

              </div>
            </div>
          </div>
        )}

        {/* =========================
            SUCCESS MODAL (FRONTEND ONLY)
        ========================== */}
        {showSuccessMessage && (
          <div className="modal-overlay">
            <div className="modal-container">

              <h2
                style={{
                  color: "#16a34a",
                  fontSize: "24px",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Created Successfully!
              </h2>

              <p className="modal-text">
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