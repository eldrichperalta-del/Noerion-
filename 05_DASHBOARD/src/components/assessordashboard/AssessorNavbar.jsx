import { useLocation } from "react-router-dom";

function AssessorNavbar() {
  const location = useLocation();

  const pageTitles = {
    "/assessor": "Home",
    "/assessor/home": "Home",
    "/assessor/assessment-panel": "Assessment Panel",
    "/assessor/evaluation": "Evaluation",
    "/assessor/history": "Assessment History",
    "/assessor/profile": "Profile",
    "/assessor/settings": "Settings",
    "/assessor/logout": "Logout",
  };

  const currentTitle =
    pageTitles[location.pathname] || "Assessor Dashboard";

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
          src="/assessor.jpg"
          alt="Assessor"
          className="w-10 h-10 rounded-full"
        />

        <span className="font-medium text-gray-800">
          Assessor [Alliah]
        </span>
      </div>
    </header>
  );
}

export default AssessorNavbar;