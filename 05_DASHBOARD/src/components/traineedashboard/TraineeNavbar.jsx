import { useLocation } from "react-router-dom";

function TraineeNavbar() {
  const location = useLocation();

  const pageTitles = {
    "/trainee": "Home",
    "/trainee/assessments": "Assessments",
    "/trainee/results": "Results",
    "/trainee/certificates": "Certificates",
    "/trainee/profile": "Profile",
    "/trainee/settings": "Settings",
  };

  const currentTitle = pageTitles[location.pathname] || "Trainee Dashboard";

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
          src="/admin.jpg"
          alt="Trainee"
          className="w-10 h-10 rounded-full"
        />

        <span className="font-medium text-gray-800">
          Trainee [Ash]
        </span>
      </div>
    </header>
  );
}

export default TraineeNavbar;