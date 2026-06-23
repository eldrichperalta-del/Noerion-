import { useState } from "react";

export default function CertificateUploadModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    course: "",
  });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Upload Certificate</h3>

        <input
          placeholder="Trainee Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Course"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button>Save</button>
        </div>
      </div>
    </div>
  );
}