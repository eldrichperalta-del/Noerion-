import { useEffect, useState } from "react";
import { MessageSquareText, Loader2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function AssessorFeedback({ submissionId, traineeId, assessmentId, assessment }) {
  const [feedback, setFeedback] = useState(null);
  const [courseInfo, setCourseInfo] = useState({ title: "", qualificationLevel: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessorFeedback() {
      setLoading(true);
      try {
        const activeSubmissionId = submissionId || assessment?.id || assessment?.submission_id;
        const activeTraineeId = traineeId || assessment?.trainee_id;
        const activeAssessmentId = assessmentId || assessment?.assessment_id;

        const isUuid = (val) =>
          typeof val === "string" &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

        let query = supabase
          .from("assessment_submissions")
          .select(`
            remarks, 
            overall_result, 
            status,
            assessments (
              title,
              course_id,
              courses (
                title,
                qualification_level
              )
            )
          `);

        if (activeSubmissionId && isUuid(activeSubmissionId)) {
          query = query.eq("id", activeSubmissionId);
        } else if (activeTraineeId && activeAssessmentId) {
          query = query
            .eq("trainee_id", activeTraineeId)
            .eq("assessment_id", activeAssessmentId);
        } else {
          setLoading(false);
          return;
        }

        const { data, error } = await query
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFeedback(data);

          const courseData = data?.assessments?.courses;
          let qualLevel = courseData?.qualification_level;
          let title = courseData?.title;

          const rawTitle =
            title ||
            data?.assessments?.title ||
            assessment?.title ||
            assessment?.qualification ||
            assessment?.course ||
            "";

          // Strip out "Set A/B", "NC I/II/III/IV/V", and trailing dashes/spaces
          if (rawTitle) {
            title = rawTitle
              .replace(/\s*-?\s*Set\s+[A-Z]/gi, "")
              .replace(/\s*-?\s*NC\s*(I{1,3}|IV|V)?/gi, "")
              .trim();
          }

          if (!qualLevel) {
            const rawQual = assessment?.qualification_level || assessment?.qualification || "";
            const match = rawQual.match(/NC\s*(I{1,3}|IV|V)?/i);
            qualLevel = match ? match[0].toUpperCase() : "NC II";
          }

          setCourseInfo({
            qualificationLevel: qualLevel || "NC II",
            title: title || "Assessment Qualification",
          });
        }
      } catch (err) {
        console.error("Error loading assessor feedback:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssessorFeedback();
  }, [submissionId, traineeId, assessmentId, assessment]);

  const isEvaluated = feedback?.status === "evaluated";
  const isPassed =
    feedback?.overall_result === "Passed" ||
    feedback?.overall_result === "Competent" ||
    feedback?.overall_result === "Pass";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-5">
          <MessageSquareText size={22} className="text-orange-600" />
          <h2 className="text-xl font-bold text-gray-800">Assessor Feedback</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader2 size={18} className="animate-spin text-orange-600" />
            <span>Loading feedback...</span>
          </div>
        ) : (
          <div className="space-y-4 text-gray-700 leading-relaxed">
            {feedback?.remarks ? (
              <p className="whitespace-pre-line text-gray-800">{feedback.remarks}</p>
            ) : (
              <p className="italic text-gray-400">
                {isEvaluated
                  ? "No written remarks provided by the assessor."
                  : "Assessment evaluation is currently pending."}
              </p>
            )}

            {isEvaluated && feedback?.overall_result && (
              <div className="space-y-1 pt-2">
                <p className={`font-semibold ${isPassed ? "text-green-700" : "text-red-600"}`}>
                  Recommendation:
                </p>

                <p className="text-gray-800">
                  {isPassed ? (
                    <>
                      Candidate is recommended for certification under{" "}
                      <span className="font-medium">
                        TESDA {courseInfo.qualificationLevel} {courseInfo.title}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Candidate is not recommended for certification under{" "}
                      <span className="font-medium">
                        TESDA {courseInfo.qualificationLevel} {courseInfo.title}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}