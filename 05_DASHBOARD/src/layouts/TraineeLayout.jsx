import { useState } from "react";
import { Outlet } from "react-router-dom";

import TraineeSidebar from "../components/traineedashboard/TraineeSidebar";
import TraineeNavbar from "../components/traineedashboard/TraineeNavbar";
import DashboardBackground from "../components/common/DashboardBackground";

function TraineeLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <TraineeSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* Navbar */}
        <TraineeNavbar />

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