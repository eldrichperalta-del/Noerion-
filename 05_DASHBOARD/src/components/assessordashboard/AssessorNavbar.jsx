import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // Adjust path if needed

function AssessorNavbar() {
  const location = useLocation();
  const [assessorProfile, setAssessorProfile] = useState({
    name: "Assessor",
    photoUrl: "/assessor.jpg",
  });

  useEffect(() => {
    const fetchAssessorProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            const fullName =
              [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
              "Assessor";

            setAssessorProfile({
              name: fullName,
              photoUrl: profile.profile_photo_url || "/assessor.jpg",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching assessor profile:", error);
      }
    };

    fetchAssessorProfile();
  }, []);

  const pageTitles = {
    "/assessor": "Home",
    "/assessor/home": "Home",
    "/assessor/assessment-panel": "Assessment Management",
    "/assessor/assessment-panel/selected-trainees": "Trainees Progress",
    "/assessor/assessment-panel/assessment-overview": "Assessment Overview",
    "/assessor/assessment-panel/written-review": "Written Assessment Review",
    "/assessor/evaluation": "Evaluation",
    "/assessor/evaluation/trainees": "Trainees for Evaluation",
    "/assessor/evaluation/summary": "Evaluation Summary",
    "/assessor/evaluation/ai-analysis": "AI Analysis & Insights",
    "/assessor/evaluation/finalize": "Finalize Evaluation",
    "/assessor/history": "Assessment History",
    "/assessor/settings": "My Account",
    "/assessor/logout": "Logout",
  };

  const currentTitle = pageTitles[location.pathname] || "Assessor Dashboard";

  return (
    <header
      className="
        h-16
        bg-white
        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        flex
        items-center
        justify-between
        px-6
      "
    >
      <h1 className="text-xl font-semibold text-gray-400">{currentTitle}</h1>

      <div className="flex items-center gap-3">
        <img
          src={assessorProfile.photoUrl}
          alt={assessorProfile.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
        />

        <span className="font-medium text-gray-800">
          {assessorProfile.name}
        </span>
      </div>
    </header>
  );
}

export default AssessorNavbar;
