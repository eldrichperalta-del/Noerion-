import { useState } from "react";

import TraineeSidebar from "../components/traineedashboard/TraineeSidebar";
import TraineeNavbar from "../components/traineedashboard/TraineeNavbar";
import DashboardBackground from "../components/common/DashboardBackground";

function TraineeLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <TraineeSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">

        {/* Navbar */}
        <div className="flex items-center bg-white shadow-sm">
          <div className="flex-1">
            <TraineeNavbar />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="relative flex-1 overflow-hidden text-gray-900 bg-[#eef4f8]">

          {/* Background stays fixed */}
          <DashboardBackground />

          {/* Only content scrolls */}
          <div className="relative z-10 h-full overflow-y-auto px-20 py-6">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
}

export default TraineeLayout;