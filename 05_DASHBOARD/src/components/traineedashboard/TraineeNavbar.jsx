import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import NotificationBell from "../common/NotificationBell";

function TraineeNavbar() {
  const location = useLocation();

  const [traineeProfile, setTraineeProfile] = useState({
    name: "Trainee",
    photoUrl: null,
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

  const currentTitle = /^\/trainee\/certificates\/[^/]+$/.test(
    location.pathname
  )
    ? "View Certificates"
    : pageTitles[location.pathname] || "Trainee Dashboard";

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("[TraineeNavbar] Auth error:", userError);
          return;
        }

        if (!user) {
          console.error("[TraineeNavbar] No authenticated user found.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, profile_photo_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "[TraineeNavbar] Profile fetch error:",
            profileError
          );
          return;
        }

        if (profile && isMounted) {
          const fullName =
            [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ") || "Trainee";

          console.log("[TraineeNavbar] User ID:", user.id);
          console.log(
            "[TraineeNavbar] Database photo URL:",
            profile.profile_photo_url
          );

          setTraineeProfile({
            name: fullName,
            photoUrl: profile.profile_photo_url || null,
          });
        }
      } catch (error) {
        console.error(
          "[TraineeNavbar] Error fetching trainee profile:",
          error
        );
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="relative h-16 w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-between px-6 z-50">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-gray-400">
        {currentTitle}
      </h1>

      {/* User Section */}
      <div className="relative flex items-center gap-3">
        <NotificationBell />

        {traineeProfile.photoUrl ? (
          <img
            src={traineeProfile.photoUrl}
            alt={traineeProfile.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            onLoad={() => {
              console.log(
                "[TraineeNavbar] Database profile image loaded successfully."
              );
            }}
            onError={() => {
              console.error(
                "[TraineeNavbar] Database profile image failed to load:",
                traineeProfile.photoUrl
              );
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-500 text-sm">
            {traineeProfile.name?.charAt(0)?.toUpperCase() || "T"}
          </div>
        )}

        <span className="font-medium text-gray-800">
          {traineeProfile.name}
        </span>
      </div>
    </header>
  );
}

export default TraineeNavbar;