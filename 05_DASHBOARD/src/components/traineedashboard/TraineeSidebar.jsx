import { NavLink, useLocation } from "react-router-dom";
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

function TraineeSidebar({ isOpen, setIsOpen }) {
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: "Home", path: "/trainee" },
        { icon: ClipboardList, label: "Assessments", path: "/trainee/assessments" },
        { icon: BarChart3, label: "Results", path: "/trainee/results" },
        { icon: Award, label: "Certificates", path: "/trainee/certificates" },
        { icon: User, label: "Profile", path: "/trainee/profile" },
        { icon: Settings, label: "Settings", path: "/trainee/settings" },
        { icon: LogOut, label: "Logout", path: "/logout" },
    ];

    return (
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
                            <NavLink
                                to={item.path}
                                end={item.path === "/trainee"}
                                className={({ isActive }) => {
                                    const isActiveRoute =
                                        isActive ||
                                        location.pathname.startsWith(item.path);

                                    return `
                                        w-full flex items-center gap-4 px-4 py-3 rounded-xl transition
                                        ${
                                            isActiveRoute
                                                ? "bg-blue-800"
                                                : "hover:bg-blue-700"
                                        }
                                    `;
                                }}
                            >
                                <item.icon size={22} />

                                {isOpen && (
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                )}
                            </NavLink>
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
    );
}

export default TraineeSidebar;