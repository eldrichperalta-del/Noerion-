import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export default function Certificates() {
  const certificates = [
    {
      id: 1,
      name: "Advanced Robotics Assembly Certificate",
      certificateId: "#NOE-RC-001",
      qualification: "TESDA NC III Electronics",
      issued: "2025-04-14",
      status: "Valid",
    },
    {
      id: 2,
      name: "Web Application Development Certificate",
      certificateId: "#NOE-WD-002",
      qualification: "TESDA NC IV IT",
      issued: "2025-04-16",
      status: "Valid",
    },
    {
      id: 3,
      name: "Culinary Arts Technique Certificate",
      certificateId: "#NOE-CA-003",
      qualification: "TESDA NC II Cookery",
      issued: "2025-04-10",
      status: "Valid",
    },
    {
      id: 4,
      name: "Industrial Electronics Certificate",
      certificateId: "#NOE-IE-004",
      qualification: "TESDA NC III Electronics",
      issued: "2025-04-17",
      status: "Valid",
    },
    {
      id: 5,
      name: "Mechatronics Systems Certificate",
      certificateId: "#NOE-MS-005",
      qualification: "TESDA NC IV Mechatronics",
      issued: "2025-04-18",
      status: "Valid",
    },
    {
      id: 6,
      name: "Computer System Servicing Certificate",
      certificateId: "#NOE-CS-006",
      qualification: "TESDA NC II CSS",
      issued: "2025-03-28",
      status: "Invalid",
    },
  ];

  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const filteredCertificates = useMemo(() => {
    return certificates.filter((certificate) => {
      const matchesStatus =
        statusFilter === "All" || certificate.status === statusFilter;

      const matchesDate =
        !dateFilter || certificate.issued === dateFilter;

      return matchesStatus && matchesDate;
    });
  }, [statusFilter, dateFilter]);

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          My Certificates
        </h1>

        <div className="flex gap-3">
          {/* Status */}
          <div className="bg-white rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>Valid</option>
                <option>Invalid</option>
              </select>

              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Date */}
          <div className="bg-white rounded-xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Header Container */}
      <div className="mb-4 rounded-2xl bg-white px-6 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.30)]">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr] gap-4 text-sm font-semibold text-gray-700">
          <p>Certificate Name / ID</p>
          <p>Qualification / Skill</p>
          <p>Date Issued</p>
          <p>Status</p>
          <p></p>
        </div>
      </div>

      {/* Certificate Cards */}
      <div className="space-y-4">
        {filteredCertificates.length > 0 ? (
          filteredCertificates.map((certificate) => (
            <div
              key={certificate.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr] gap-4 items-center rounded-2xl bg-white px-6 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.30)]  hover:shadow-md transition"
            >
              {/* Certificate */}
              <div>
                <p className="font-semibold text-gray-800">
                  {certificate.name}
                </p>

                <p className="text-sm text-gray-500">
                  {certificate.certificateId}
                </p>
              </div>

              {/* Qualification */}
              <div>
                <p className="text-gray-700">
                  {certificate.qualification}
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-gray-700">
                  {new Date(certificate.issued).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              {/* Status */}
              <div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${certificate.status === "Valid"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {certificate.status}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2 items-end">
                <button className="w-40 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800">
                  View Certificate
                </button>

                <button className="w-40 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800">
                  Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-white py-10 text-center shadow">
            <p className="text-gray-500">
              No certificates found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}