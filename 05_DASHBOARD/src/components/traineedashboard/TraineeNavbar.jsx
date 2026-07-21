import { useLocation } from "react-router-dom";

function TraineeNavbar() {
  const location = useLocation();

  const pageTitles = {
    // Home
    "/trainee": "Home",

    // Assessment
    "/trainee/assessment": "Assessments",
    "/trainee/assessment/overview": "Assessment Overview",
    "/trainee/assessment/baseline": "Baseline",
    "/trainee/assessment/prepare": "Preparation",
    "/trainee/assessment/written-assessment": "Written Assessment",

    // Results
    "/trainee/results": "Results",
    "/trainee/assessment-summary": "Assessment Summary",

    // Certificates
    "/trainee/certificate": "Certificate",
    "/trainee/certificates": "Certificates",

    // Profile
    "/trainee/profile": "Profile",

    // Settings
    "/trainee/settings": "Settings",
  };

  const currentTitle =
    pageTitles[location.pathname] || "Trainee Dashboard";

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
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-gray-400">
        {currentTitle}
      </h1>

      {/* User */}
      <div className="flex items-center gap-3">
        <img
          src="/trainee.jpg"
          alt="Trainee"
          className="w-10 h-10 rounded-full object-cover"
        />

        <span className="font-medium text-gray-800">
          Trainee [Eldrich]
        </span>
      </div>
    </header>
  );
}

export default TraineeNavbar;