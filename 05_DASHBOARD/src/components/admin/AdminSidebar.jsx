import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Award,
  Settings,
  LogOut,
  X,
  Menu,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useState } from "react";
import LoadingOverlay from "../common/LoadingOverlay";

function AdminSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // small delay so overlay is visible (UX polish)
      await new Promise((r) => setTimeout(r, 2800));

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      // IMPORTANT: replace prevents back-button returning to dashboard
      navigate("/", { replace: true });

    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "User Management", path: "/admin/user-management" },
    { icon: ClipboardList, label: "Assessment Management", path: "/admin/assessments" },
    { icon: BarChart3, label: "Results Monitoring", path: "/admin/results" },
    { icon: Award, label: "Certificate Management", path: "/admin/certificates" },
  ];

  return (
    <>
      {/* ✅ GLOBAL OVERLAY (correct placement) */}
      {loggingOut && (
        <LoadingOverlay
          title="Signing out..."
          message="Please wait..."
        />
      )}

      <aside
        className={`
        bg-[#001F5B]
        text-white
        h-screen
        transition-all
        duration-300
        flex
        flex-col
        ${isOpen ? "w-72" : "w-20"}
      `}
      >
        {/* HEADER */}
        <div className="p-4 flex items-center justify-center">
          {isOpen ? (
            <div className="flex items-center gap-3 w-full">
              <img
                src="/tesda.png"
                alt="TESDA"
                className="w-12 h-12 object-contain"
              />

              <div className="flex-1">
                <h2 className="font-bold text-lg leading-none">
                  TESDA
                </h2>

                <p className="text-xs text-gray-200">
                  ASSESSMENT SYSTEM
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-800 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="hover:bg-blue-800 p-2 rounded-lg"
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        {/* MENU */}
        <nav className="flex-1 px-3 mt-6">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.action === "logout" ? (
                  <button
                    onClick={handleLogout}
                    className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3
                    rounded-xl
                    hover:bg-blue-700
                    transition
                    text-left
                  "
                  >
                    <item.icon size={22} />

                    {isOpen && (
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </button>
                ) : item.label === "Assessment Management" ? (
                  <><button type="button" onClick={() => { if (!isOpen) { setIsOpen(true); setAssessmentOpen(true); return; } setAssessmentOpen((open) => !open); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-700 transition text-left"><item.icon size={22}/>{isOpen && <><span className="text-sm font-medium flex-1">{item.label}</span><ChevronDown size={16} className={assessmentOpen ? "rotate-180 transition-transform" : "transition-transform"}/></>}</button>{isOpen && assessmentOpen && <div className="mt-1 w-full space-y-1"><NavLink to="/admin/assessments" end className={({isActive}) => `block w-full rounded-xl px-12 py-3 text-sm ${isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-700"}`}>Assessment Library</NavLink><NavLink to="/admin/assessments/schedule" className={({isActive}) => `block w-full rounded-xl px-12 py-3 text-sm ${isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-700"}`}>Assessment Scheduling</NavLink></div>}</>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `
                      w-full
                      flex
                      items-center
                      gap-4
                      px-4
                      py-3
                      rounded-xl
                      transition
                      ${isActive
                        ? "bg-blue-800"
                        : "hover:bg-blue-700"
                      }
                    `
                    }
                  >
                    <item.icon size={22} />

                    {isOpen && (
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="px-3 pb-4">
          <NavLink to="/admin/settings" className={({ isActive }) => `flex w-full items-center gap-4 rounded-xl px-4 py-3 transition ${isActive ? "bg-blue-800" : "hover:bg-blue-700"}`}>
            <Settings size={22} />
            {isOpen && <span className="text-sm font-medium">Settings</span>}
          </NavLink>
          <button onClick={handleLogout} className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-blue-700">
            <LogOut size={22} />
            {isOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
          {isOpen && <div className="pt-4 text-center text-xs text-gray-300">&copy; 2026 NOERION.</div>}
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
