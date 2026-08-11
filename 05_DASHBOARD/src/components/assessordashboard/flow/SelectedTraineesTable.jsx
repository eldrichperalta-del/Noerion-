import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import AssessorStatusBadge from "../shared/AssessorStatusBadge";

export default function SelectedTraineesTable({
  trainees = [],
  actionLabel,
  onAction,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredTrainees = useMemo(() => {
    return trainees.filter((trainee) => {
      // Support different property field names
      const fullName =
        trainee.fullName ??
        trainee.name ??
        trainee.fullname ??
        "";

      const traineeId = trainee.traineeId ?? "";
      const status = trainee.status ?? "";

      const matchesSearch =
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        traineeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [trainees, searchTerm, statusFilter]);

  return (
    <div className="-mt-1 space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Trainee Name or ID..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-black placeholder:text-gray-400 caret-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Filter by Status:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none shadow-sm transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Evaluated">Evaluated</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 items-center rounded-xl bg-gray-200 px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
        <div className="col-span-4">Trainee Name</div>
        <div className="col-span-3">Trainee ID</div>
        <div className="col-span-3">Assessment Status</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-4">
        {filteredTrainees.map((trainee) => {
          const fullName =
            trainee.fullName ??
            trainee.name ??
            trainee.fullname ??
            "Unnamed Trainee";

          return (
            <div
              key={trainee.id}
              className="grid grid-cols-12 items-center rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* Name */}
              <div className="col-span-4">
                <h3 className="text-base font-semibold text-gray-900">
                  {fullName}
                </h3>
              </div>

              {/* Trainee ID */}
              <div className="col-span-3">
                <p className="text-sm text-gray-500">{trainee.traineeId}</p>
              </div>

              {/* Status Badge */}
              <div className="col-span-3">
                <AssessorStatusBadge status={trainee.status} />
              </div>

              {/* Action Button */}
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => onAction(trainee)}
                  className="rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#001f59] hover:shadow-lg active:scale-95"
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })}

        {filteredTrainees.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500 shadow-sm">
            No trainees found for this batch.
          </div>
        )}
      </div>
    </div>
  );
}