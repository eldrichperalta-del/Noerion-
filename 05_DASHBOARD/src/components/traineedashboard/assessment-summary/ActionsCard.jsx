import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Award, Loader2 } from "lucide-react";

import generateAssessmentPDF from "../../../utils/generateAssessmentPDF";
import { supabase } from "../../../supabaseClient";

export default function ActionsCard({ assessment }) {
  const navigate = useNavigate();

  const [certificateId, setCertificateId] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    async function loadCertificate() {
      try {
        setCertificateLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const traineeId = assessment?.trainee_id || user?.id;

        if (!traineeId) return;

        const { data, error } = await supabase
          .from("certificates")
          .select("id")
          .eq("trainee_id", traineeId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to load certificate:", error);
          return;
        }

        if (data?.id) {
          setCertificateId(data.id);
        }
      } catch (error) {
        console.error("Error loading certificate:", error);
      } finally {
        setCertificateLoading(false);
      }
    }

    loadCertificate();
  }, [assessment]);

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      const submissionId =
        assessment?.submission_id ||
        assessment?.submissionId ||
        assessment?.id;

      const traineeId = assessment?.trainee_id;

      // 1. FETCH AI ASSESSMENT INSIGHTS (Prioritizing 'feedback' column)
      let aiData = null;
      if (submissionId) {
        const { data } = await supabase
          .from("ai_assessment_insights")
          .select("feedback, ai_cognitive_insights, recommendations")
          .eq("submission_id", submissionId)
          .maybeSingle();

        aiData = data;
      }

      const parseJsonArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      };

      // Pulls directly from 'feedback' first
      const aiInsights = parseJsonArray(
        aiData?.feedback || aiData?.ai_cognitive_insights
      );
      const recommendations = parseJsonArray(aiData?.recommendations);

      // 2. FETCH ASSESSOR FEEDBACK
      let assessorFeedbackText = "No feedback provided by the assessor.";
      if (submissionId) {
        try {
          const { data: assessorData } = await supabase
            .from("assessor_feedback")
            .select("comments, feedback")
            .eq("submission_id", submissionId)
            .maybeSingle();

          if (assessorData?.comments || assessorData?.feedback) {
            assessorFeedbackText =
              assessorData.comments || assessorData.feedback;
          }
        } catch (err) {
          console.warn("Assessor feedback table query skipped.");
        }
      }

      // 3. FETCH EEG METRICS (VIA TRAINEE_EEG_READINGS)
      let eegValues = { attention: 0, focus: 0, engagement: 0 };

      if (traineeId) {
        // Step 3a: Get active reading_id
        let readingQuery = supabase
          .from("trainee_eeg_readings")
          .select("id")
          .eq("trainee_id", traineeId);

        if (submissionId) {
          readingQuery = readingQuery.eq("submission_id", submissionId);
        }

        const { data: readings } = await readingQuery
          .order("created_at", { ascending: false })
          .limit(1);

        const matchedReadingId =
          readings && readings.length > 0 ? readings[0].id : null;

        // Step 3b: Query active segments using reading_id or trainee_id
        let segmentsQuery = supabase
          .from("eeg_active_segments")
          .select("attention_pct, engagement_pct, cognitive_load_pct");

        if (matchedReadingId) {
          segmentsQuery = segmentsQuery.eq("reading_id", matchedReadingId);
        } else {
          segmentsQuery = segmentsQuery.eq("trainee_id", traineeId);
        }

        const { data: segments } = await segmentsQuery
          .order("created_at", { ascending: false })
          .limit(20);

        if (segments && segments.length > 0) {
          const count = segments.length;
          const toPct = (val) => {
            const num = Number(val) || 0;
            if (num <= 1) return Math.min(Math.round(num * 100), 100);
            if (num <= 10) return Math.min(Math.round(num * 15), 100);
            return Math.min(Math.round(num), 100);
          };

          const avgAttention =
            segments.reduce(
              (acc, r) => acc + (Number(r.attention_pct) || 0),
              0
            ) / count;
          const avgFocus =
            segments.reduce(
              (acc, r) => acc + (Number(r.cognitive_load_pct) || 0),
              0
            ) / count;
          const avgEngagement =
            segments.reduce(
              (acc, r) => acc + (Number(r.engagement_pct) || 0),
              0
            ) / count;

          eegValues = {
            attention: toPct(avgAttention),
            focus: toPct(avgFocus),
            engagement: toPct(avgEngagement),
          };
        }
      }

      // Construct live payload
      const livePdfPayload = {
        qualification:
          assessment?.qualification ||
          assessment?.course_title ||
          "NC II",
        date: assessment?.date || assessment?.created_at || "N/A",
        title:
          assessment?.title ||
          assessment?.assessment_title ||
          "Assessment Summary",
        result:
          assessment?.result ||
          assessment?.status ||
          assessment?.classification ||
          "Completed",
        score:
          assessment?.score !== undefined
            ? assessment.score
            : assessment?.total_score || 0,
        eeg: eegValues,
        aiInsights:
          aiInsights.length > 0
            ? aiInsights
            : ["Assessment completed successfully."],
        assessorFeedback: assessorFeedbackText,
        recommendations:
          recommendations.length > 0
            ? recommendations
            : ["Review assessment areas for further improvement."],
      };

      generateAssessmentPDF(livePdfPayload);
    } catch (err) {
      console.error("Error generating PDF with live data:", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleViewCertificate = () => {
    if (!certificateId) return;
    navigate(`/trainee/certificates/${certificateId}`);
  };

  return (
    <div className="p-6 h-full">
      <div className="space-y-4">
        {/* DOWNLOAD RESULTS */}
        <button
          type="button"
          disabled={downloadLoading}
          onClick={handleDownload}
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
            disabled:opacity-50
          "
        >
          {downloadLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Preparing PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Download Results
            </>
          )}
        </button>

        {/* VIEW CERTIFICATE */}
        <button
          type="button"
          onClick={handleViewCertificate}
          disabled={certificateLoading || !certificateId}
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