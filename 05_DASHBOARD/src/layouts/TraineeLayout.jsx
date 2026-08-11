import { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";

import TraineeSidebar from "../components/traineedashboard/TraineeSidebar";
import TraineeNavbar from "../components/traineedashboard/TraineeNavbar";
import DashboardBackground from "../components/common/DashboardBackground";

function TraineeLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // 🔒 Detect active written assessment route
  const isTakingAssessment = location.pathname.includes("/written-assessment");

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar - Hidden during active written assessment */}
      {!isTakingAssessment && (
        <TraineeSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}

      {/* Main Container */}
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {isOpen && !isTakingAssessment && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-20 cursor-default bg-black/45"
          />
        )}

        {/* Navbar - Hidden during active written assessment */}
        {!isTakingAssessment && <TraineeNavbar />}

        {/* Main Content Area */}
        <main className="relative flex-1 overflow-hidden text-gray-900 bg-[#eef4f8]">
          {/* Background */}
          <DashboardBackground />

          {/* Dynamic Route Content Container */}
          <div className="relative z-10 h-full overflow-y-auto px-10 xl:px-20 py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default TraineeLayout;