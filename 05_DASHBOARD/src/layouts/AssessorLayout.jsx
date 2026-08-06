import { useState } from "react";

import AssessorSidebar from "../components/assessordashboard/AssessorSidebar";
import AssessorNavbar from "../components/assessordashboard/AssessorNavbar";
import DashboardBackground from "../components/common/DashboardBackground";

export default function AssessorLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">

      <AssessorSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="relative flex flex-col flex-1 overflow-hidden">

        {isOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-20 cursor-default bg-black/45"
          />
        )}

        <AssessorNavbar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />

        <main className="relative flex-1 overflow-hidden bg-[#eef4f8]">

          <DashboardBackground />

          <div className="relative z-10 h-full overflow-y-auto px-20 py-6">
            {children}
          </div>

        </main>

      </div>
    </div>
  );
}
