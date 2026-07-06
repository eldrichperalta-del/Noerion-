import { useState } from "react";

import AssessorSidebar from "../components/assessordashboard/AssessorSidebar";
import AssessorNavbar from "../components/assessordashboard/AssessorNavbar";

export default function AssessorLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      <AssessorSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <AssessorNavbar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}