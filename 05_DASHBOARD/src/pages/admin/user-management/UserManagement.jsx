import { Link } from "react-router-dom";
import { Users, UserCheck } from "lucide-react";

function UserManagement() {
  return (
    <div className="min-h-screen px-6 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mt-2">
          User Management
        </h1>
        <p className="mt-2 text-gray-500">
          Manage trainee and assessor accounts across the platform.
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-10">
        {/* Trainees Card */}
        <Link
          to="/admin/user-management/trainees"
          className="w-full max-w-md"
        >
          <div className="
            bg-blue-100
            rounded-2xl
            border-2 border-transparent
            shadow-md
            p-10
            text-center
            transition-all
            duration-300
            hover:border-blue-800
            hover:shadow-[0_0_20px_rgba(30,64,175,0.35)]
            hover:-translate-y-1
          ">
            <Users
              size={100}
              className="mx-auto text-slate-800 mb-6"
            />

            <h2 className="text-3xl font-bold mb-3">
              TRAINEES
            </h2>

            <p className="text-gray-600 text-lg">
              Manage trainee accounts and approvals.
            </p>
          </div>
        </Link>

        {/* Assessors Card */}
        <Link
          to="/admin/user-management/assessors"
          className="w-full max-w-md"
        >
          <div className="
            bg-blue-100
            rounded-2xl
            border-2 border-transparent
            shadow-md
            p-10
            text-center
            transition-all
            duration-300
            hover:border-blue-800
            hover:shadow-[0_0_20px_rgba(30,64,175,0.35)]
            hover:-translate-y-1
          ">
            <UserCheck
              size={100}
              className="mx-auto text-slate-800 mb-6"
            />

            <h2 className="text-3xl font-bold mb-3">
              ASSESSORS
            </h2>

            <p className="text-gray-600 text-lg">
              Manage assessors and evaluation roles.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default UserManagement;
