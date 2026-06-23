import { useState } from "react";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";

function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div
        className="
          flex-1
          flex
          flex-col
          transition-all
          duration-300
        "
      >
        {/* Top Bar */}
        <div className="flex items-center bg-white shadow-sm">
          <div className="flex-1">
            <AdminNavbar />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 text-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;