import { useState } from "react";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";
import DashboardBackground from "../components/common/DashboardBackground";

function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <AdminSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div
        className="
          relative
          flex-1
          flex
          flex-col
          overflow-hidden
          transition-all
          duration-300
        "
      >
        {isOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-20 cursor-default bg-black/45"
          />
        )}

        {/* Top Bar */}
        <div className="flex items-center bg-white shadow-sm">
          <div className="flex-1">
            <AdminNavbar />
          </div>
        </div>


        {/* Main Content Area */}
        <main className="relative flex-1 overflow-hidden text-gray-900 bg-[#eef4f8]">

          {/* Fixed Decorative Background */}
          <DashboardBackground />

          {/* Scrollable Content Only */}
          <div className="relative z-10 h-full overflow-y-auto px-20 py-6">
            {children}
          </div>

        </main>

      </div>
    </div>
  );
}

export default AdminLayout;
