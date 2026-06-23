import { useLocation } from "react-router-dom";

function AdminNavbar() {
    const location = useLocation();

    const pageTitles = {
        "/admin": "Home",
        "/admin/user-management": "User Management",
        "/admin/user-management/trainees": "Trainee Management",
        "/admin/user-management/assessors": "Assessor Management",
        "/admin/user-management/add-assessor": "Add Assessor",
        "/admin/assessments": "Assessment Management",
        "/admin/assessments/create": "Create Assessment",
        "/admin/results": "Results Monitoring",
        "/admin/certificates": "Certificate Management",
        "/admin/profile": "Profile",
        "/admin/settings": "Settings",
        "/admin/logout": "Logout",
    };

    const currentTitle = pageTitles[location.pathname] || "Admin Dashboard";

    return (
        <header
            className="
                h-16
                bg-white
                shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                flex
                items-center
                justify-between
                px-6
            "
        >
            <h1 className="text-xl font-semibold text-gray-400">
                {currentTitle}
            </h1>

            <div className="flex items-center gap-3">
                <img
                    src="/admin.jpg"
                    alt="Admin"
                    className="w-10 h-10 rounded-full"
                />

                <span className="font-medium text-gray-800">
                    Admin [Ash]
                </span>
            </div>
        </header>
    );
}

export default AdminNavbar;