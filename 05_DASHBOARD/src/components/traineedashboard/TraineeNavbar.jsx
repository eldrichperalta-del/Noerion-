import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function TraineeNavbar() {
  const location = useLocation();

  const [traineeProfile, setTraineeProfile] = useState({
    name: "Trainee",
    photoUrl: "/trainee.jpg",
  });

  const pageTitles = {
    "/trainee": "Home",
    "/trainee/assessment": "Assessments",
    "/trainee/assessment/overview": "Assessment Overview",
    "/trainee/assessment/baseline": "Baseline",
    "/trainee/assessment/prepare": "Preparation",
    "/trainee/assessment/written-assessment": "Written Assessment",
    "/trainee/results": "Results",
    "/trainee/assessment-summary": "Assessment Summary",
    "/trainee/certificate": "Certificate",
    "/trainee/certificates": "Certificates",
    "/trainee/settings": "My Account",
  };

  const currentTitle = /^\/trainee\/certificates\/[^/]+$/.test(location.pathname)
    ? "View Certificates"
    : pageTitles[location.pathname] || "Trainee Dashboard";

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && isMounted) {
            const fullName =
              [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
              "Trainee";

            setTraineeProfile({
              name: fullName,
              photoUrl: profile.profile_photo_url || "/trainee.jpg",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching trainee profile for navbar:", error);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="h-16 w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-between px-6 z-10">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-gray-400">
        {currentTitle}
      </h1>

      {/* User Section */}
      <div className="flex items-center gap-3">
        <img
          src={traineeProfile.photoUrl}
          alt={traineeProfile.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
          onError={(e) => {
            e.target.src = "/trainee.jpg";
          }}
        />

        <span className="font-medium text-gray-800">
          {traineeProfile.name}
        </span>
      </div>
    </header>
  );
}

export default TraineeNavbar;
