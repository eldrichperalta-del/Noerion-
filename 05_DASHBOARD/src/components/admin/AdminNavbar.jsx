import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // Adjust relative path if needed

function AdminNavbar() {
    const location = useLocation();
    const [adminProfile, setAdminProfile] = useState({
        name: "Admin",
        photoUrl: "/admin.jpg"
    });

    useEffect(() => {
        const fetchAdminProfile = async () => {
            try {
                // Get authenticated user
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Query profile from Supabase
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("first_name, last_name, profile_photo_url")
                        .eq("id", user.id)
                        .maybeSingle();

                    if (profile) {
                        const fullName = [profile.first_name, profile.last_name]
                            .filter(Boolean)
                            .join(" ") || "Admin";

                        setAdminProfile({
                            name: fullName,
                            photoUrl: profile.profile_photo_url || "/admin.jpg"
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
            }
        };

        fetchAdminProfile();
    }, []);

    const pageTitles = {
        "/admin": "Home",

        "/admin/user-management": "User Management",
        "/admin/user-management/trainees": "Trainee Management",
        "/admin/user-management/assessors": "Assessor Management",
        "/admin/user-management/add-assessor": "Add Assessor",

        // Main Assessment Library
        "/admin/assessments": "Assessment Management",

        "/admin/assessments/create": "Assessment Management",
        "/admin/assessments/schedule": "Assessment Management",
        "/admin/assessments/schedule/choose": "Assessment Management",

        "/admin/results": "Results Monitoring",
        "/admin/certificates": "Certificate Management",
        "/admin/settings": "My Account",
        "/admin/logout": "Logout",
    };

    const currentTitle =
        pageTitles[location.pathname] ||
        (/^\/admin\/assessments\/course\/[^/]+$/.test(location.pathname)
            ? "Course Assessment"
            : /^\/admin\/assessments\/[^/]+$/.test(location.pathname)
                ? "Assessment Details"
                : "Admin Dashboard");
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
                    src={adminProfile.photoUrl}
                    alt={adminProfile.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />

                <span className="font-medium text-gray-800">
                    {adminProfile.name}
                </span>
            </div>
        </header>
    );
}

export default AdminNavbar;
