import { useState } from "react";
import { supabase } from "../../../supabaseClient";

export default function CertificateUploadModal({
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    course: "",
    skill: "",
    studentId: "",
    result: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setError("");

    // =========================
    // VALIDATION
    // =========================

    if (!form.name.trim()) {
      setError("Please enter the trainee name.");
      return;
    }

    if (!form.course.trim()) {
      setError("Please enter the qualification/course.");
      return;
    }

    if (!form.skill.trim()) {
      setError("Please enter the skill.");
      return;
    }

    if (!form.studentId.trim()) {
      setError("Please enter the student ID.");
      return;
    }

    if (!form.result.trim()) {
      setError("Please enter the result.");
      return;
    }

    try {
      setSaving(true);

      console.log("========================================");
      console.log("NOERION CERTIFICATE CREATION");
      console.log("Calling create-certificate Edge Function...");
      console.log("========================================");

      // =========================
      // CURRENT ADMIN USER
      // =========================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You must be logged in to create a certificate."
        );
      }

      console.log("Authenticated user:", user.id);

      // =========================
      // TRAINEE ID
      // =========================

      const traineeId = `TR-${crypto.randomUUID()}`;

      // =========================
      // CALL EDGE FUNCTION
      // =========================
      //
      // IMPORTANT:
      // The certificate is NOT inserted directly
      // into the database anymore.
      //
      // The Edge Function:
      //
      // 1. Generates certificate ID
      // 2. Generates hash
      // 3. Signs hash using CERTIFICATE_PRIVATE_KEY
      // 4. Generates token
      // 5. Inserts the signed certificate
      //
      // The private key never reaches this browser.
      // =========================

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "create-certificate",
          {
            body: {
              trainee_name: form.name.trim(),

              trainee_id: traineeId,

              student_id: form.studentId.trim(),

              qualification: form.course.trim(),

              skill: form.skill.trim(),

              result: form.result.trim(),
            },
          }
        );

      if (functionError) {
        console.error(
          "create-certificate function error:",
          functionError
        );

        throw new Error(
          functionError.message ||
            "Certificate creation failed."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Certificate creation failed."
        );
      }

      if (!data?.certificate) {
        throw new Error(
          "Certificate was created but no certificate data was returned."
        );
      }

      const certificate = data.certificate;

      console.log("========================================");
      console.log("CERTIFICATE CREATED");
      console.log("Certificate ID:", certificate.certificate_id);
      console.log("Token:", certificate.token);
      console.log("Hash:", certificate.hash);
      console.log(
        "Signature:",
        certificate.signature
      );
      console.log("Status:", certificate.status);
      console.log("========================================");

      // =========================
      // VERIFY THAT SIGNING DATA
      // WAS ACTUALLY GENERATED
      // =========================

      if (!certificate.token) {
        throw new Error(
          "Certificate was created without a verification token."
        );
      }

      if (!certificate.hash) {
        throw new Error(
          "Certificate was created without a certificate hash."
        );
      }

      if (!certificate.signature) {
        throw new Error(
          "Certificate was created without a digital signature."
        );
      }

      // =========================
      // CONVERT DATABASE RECORD
      // TO UI RECORD
      // =========================

      const newCertificate = {
        certificateId:
          certificate.certificate_id,

        traineeId:
          certificate.trainee_id,

        traineeName:
          certificate.trainee_name,

        studentId:
          certificate.student_id,

        course:
          certificate.qualification,

        qualification:
          certificate.qualification,

        skill:
          certificate.skill,

        dateIssued:
          certificate.issued_on,

        issuedOn:
          certificate.issued_on,

        result:
          certificate.result,

        token:
          certificate.token,

        hash:
          certificate.hash,

        signature:
          certificate.signature,

        status:
          certificate.status,

        verificationStatus:
          certificate.status === "Valid"
            ? "Verified"
            : certificate.status,

        lastVerificationDate:
          null,

        createdAt:
          certificate.created_at,

        qrCodeUrl:
          "",
      };

      // =========================
      // RETURN TO PARENT
      // =========================

      if (onSave) {
        onSave(newCertificate);
      }

      // =========================
      // CLOSE MODAL
      // =========================

      if (onClose) {
        onClose();
      }

    } catch (err) {
      console.error(
        "Failed to create certificate:",
        err
      );

      setError(
        err?.message ||
          "Failed to create certificate."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">

        {/* =========================
            TITLE
        ========================= */}

        <h3>
          Upload Certificate
        </h3>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="text-red-500">
            {error}
          </div>
        )}

        {/* =========================
            TRAINEE NAME
        ========================= */}

        <input
          placeholder="Trainee Name"
          value={form.name}
          disabled={saving}
          onChange={(e) =>
            handleChange(
              "name",
              e.target.value
            )
          }
        />

        {/* =========================
            STUDENT ID
        ========================= */}

        <input
          placeholder="Student ID"
          value={form.studentId}
          disabled={saving}
          onChange={(e) =>
            handleChange(
              "studentId",
              e.target.value
            )
          }
        />

        {/* =========================
            QUALIFICATION
        ========================= */}

        <input
          placeholder="Qualification / Course"
          value={form.course}
          disabled={saving}
          onChange={(e) =>
            handleChange(
              "course",
              e.target.value
            )
          }
        />

        {/* =========================
            SKILL
        ========================= */}

        <input
          placeholder="Skill"
          value={form.skill}
          disabled={saving}
          onChange={(e) =>
            handleChange(
              "skill",
              e.target.value
            )
          }
        />

        {/* =========================
            RESULT
        ========================= */}

        <input
          placeholder="Result"
          value={form.result}
          disabled={saving}
          onChange={(e) =>
            handleChange(
              "result",
              e.target.value
            )
          }
        />

        {/* =========================
            ACTIONS
        ========================= */}

        <div className="modal-actions">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Signing & Saving..."
              : "Save"}
          </button>

        </div>

      </div>
    </div>
  );
}