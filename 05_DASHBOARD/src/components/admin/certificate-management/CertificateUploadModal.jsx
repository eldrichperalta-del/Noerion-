import { useState } from "react";

export default function CertificateUploadModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    course: "",
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.course.trim()) {
      alert("Please enter the trainee name and course.");
      return;
    }

    const newCertificate = {
      certificateId: `CERT-${new Date().getFullYear()}-${Date.now()}`,
      traineeId: `TR-${Date.now()}`,
      traineeName: form.name.trim(),
      course: form.course.trim(),
      status: "Issued",
      dateIssued: new Date().toISOString().split("T")[0],
      qrCodeUrl: "",
      verificationStatus: "Never Scanned",
      lastVerificationDate: null,
    };

    onSave(newCertificate);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Upload Certificate</h3>

        <input
          placeholder="Trainee Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Course"
          value={form.course}
          onChange={(e) =>
            setForm({ ...form, course: e.target.value })
          }
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}