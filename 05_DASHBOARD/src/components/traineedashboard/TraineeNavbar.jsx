import { useLocation } from "react-router-dom";

function TraineeNavbar() {
  const location = useLocation();

  const pageTitles = {
    "/trainee": "Home",

    "/trainee/assessment": "Assessments",
    "/trainee/assessment/:id": "Assessment Overview",
    "/trainee/assessment/:id/baseline": "Baseline",
    "/trainee/assessment/:id/prepare": "Preparation",
    "/trainee/assessment/:id/written-assessment": "Written Assessment",

    "/trainee/results": "Results",
    "/trainee/certificates": "Certificates",
    "/trainee/profile": "Profile",
    "/trainee/settings": "Settings",
    "/trainee/logout": "Logout",
  };

  // Normalize dynamic assessment routes
  let normalizedPath = location.pathname;

  if (/^\/trainee\/assessment\/[^/]+$/.test(location.pathname)) {
    normalizedPath = "/trainee/assessment/:id";
  } else if (
    /^\/trainee\/assessment\/[^/]+\/baseline$/.test(location.pathname)
  ) {
    normalizedPath = "/trainee/assessment/:id/baseline";
  } else if (
    /^\/trainee\/assessment\/[^/]+\/prepare$/.test(location.pathname)
  ) {
    normalizedPath = "/trainee/assessment/:id/prepare";
  } else if (
    /^\/trainee\/assessment\/[^/]+\/written-assessment$/.test(location.pathname)
  ) {
    normalizedPath = "/trainee/assessment/:id/written-assessment";
  }

  const currentTitle =
    pageTitles[normalizedPath] || "Trainee Dashboard";

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
      <h1 className="text-xl font-semibold text-gray-400">
        {currentTitle}
      </h1>

      <div className="flex items-center gap-3">
        <img
          src="/trainee.jpg"
          alt="Trainee"
          className="w-10 h-10 rounded-full"
        />

        <span className="font-medium text-gray-800">
          Trainee [Eldrich]
        </span>
      </div>
    </header>
  );
}

export default TraineeNavbar;