import generateAssessmentPDF from "../../../utils/generateAssessmentPDF";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Award,
} from "lucide-react";

export default function ActionsCard({ assessment }) {
  const navigate = useNavigate();

  return (
    <div className="p-6 h-full">
      <div className="space-y-4">

        <button
          onClick={() => generateAssessmentPDF(assessment)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 transition text-white py-3 font-semibold"
        >
          <Download size={18} />
          Download Results
        </button>

        <button
          onClick={() => navigate("/trainee/certificates")}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-green-600 text-green-700 hover:bg-green-50 py-3 font-semibold transition"
        >
          <Award size={18} />
          View Certificate
        </button>

      </div>
    </div>
  );
}