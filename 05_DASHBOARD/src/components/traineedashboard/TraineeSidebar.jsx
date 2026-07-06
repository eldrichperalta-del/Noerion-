import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  ClipboardList,
  BarChart3,
  Award,
  User,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useState } from "react";
import LoadingOverlay from "../common/LoadingOverlay";


function TraineeSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

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
    { icon: Home, label: "Home", path: "/trainee" },
    { icon: ClipboardList, label: "Assessments", path: "/trainee/assessment" },
    { icon: BarChart3, label: "Results", path: "/trainee/results" },
    { icon: Award, label: "Certificates", path: "/trainee/certificates" },
    { icon: User, label: "Profile", path: "/trainee/profile" },
    { icon: Settings, label: "Settings", path: "/trainee/settings" },
    { icon: LogOut, label: "Logout", action: "logout" },
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
        transition-all duration-300
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
                    transition
                    hover:bg-blue-700
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
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.path === "/trainee"}
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
        {isOpen && (
          <div className="p-4 text-xs text-gray-300 text-center">
            &copy; 2026 NOERION.
          </div>
        )}
      </aside>
    </>
  );
}

export default TraineeSidebar;