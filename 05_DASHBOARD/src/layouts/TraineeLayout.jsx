import { useState } from "react";

import TraineeSidebar from "../components/traineedashboard/TraineeSidebar";
import TraineeNavbar from "../components/traineedashboard/TraineeNavbar";

function TraineeLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      <TraineeSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex-1 flex flex-col transition-all duration-300">
        <div className="flex items-center bg-white shadow-sm">
          <div className="flex-1">
            <TraineeNavbar />
          </div>
        </div>

        <main className="flex-1 overflow-auto px-20 py-6 text-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TraineeLayout;