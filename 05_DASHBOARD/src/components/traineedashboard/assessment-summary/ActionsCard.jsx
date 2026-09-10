import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Award,
} from "lucide-react";

import generateAssessmentPDF from "../../../utils/generateAssessmentPDF";
import { supabase } from "../../../supabaseClient";

export default function ActionsCard({ assessment }) {
  const navigate = useNavigate();

  const [certificateId, setCertificateId] =
    useState(null);

  const [certificateLoading, setCertificateLoading] =
    useState(false);

  useEffect(() => {
    async function loadCertificate() {
      try {
        setCertificateLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const traineeId =
          assessment?.trainee_id ||
          user?.id;

        if (!traineeId) {
          return;
        }

        /*
         * Find the certificate belonging to
         * the current trainee.
         *
         * The database `id` is used because
         * ViewCertificate.jsx receives:
         *
         * const { id } = useParams();
         */
        const {
          data,
          error,
        } = await supabase
          .from("certificates")
          .select("id")
          .eq("trainee_id", traineeId)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(
            "Failed to load certificate:",
            error
          );

          return;
        }

        if (data?.id) {
          setCertificateId(data.id);
        }
      } catch (error) {
        console.error(
          "Error loading certificate:",
          error
        );
      } finally {
        setCertificateLoading(false);
      }
    }

    loadCertificate();
  }, [assessment]);

  const handleViewCertificate = () => {
    if (!certificateId) {
      console.warn(
        "No certificate found for this assessment."
      );

      return;
    }

    /*
     * Navigate directly to ViewCertificate.jsx.
     *
     * The certificate ID is placed in :id.
     */
    navigate(
      `/trainee/certificates/${certificateId}`
    );
  };

  return (
    <div className="p-6 h-full">
      <div className="space-y-4">

        {/* ============================================================
            DOWNLOAD RESULTS
        ============================================================ */}

        <button
          type="button"
          onClick={() =>
            generateAssessmentPDF(assessment)
          }
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-700
            hover:bg-blue-800
            transition
            text-white
            py-3
            font-semibold
          "
        >
          <Download size={18} />

          Download Results
        </button>


        {/* ============================================================
            VIEW CERTIFICATE
        ============================================================ */}

        <button
          type="button"
          onClick={handleViewCertificate}
          disabled={
            certificateLoading ||
            !certificateId
          }
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-green-600
            text-green-700
            hover:bg-green-50
            py-3
            font-semibold
            transition
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Award size={18} />

          {certificateLoading
            ? "Loading Certificate..."
            : "View Certificate"}
        </button>

      </div>
    </div>
  );
}