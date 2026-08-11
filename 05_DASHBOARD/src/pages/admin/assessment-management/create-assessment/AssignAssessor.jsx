import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../../../supabaseClient";

export default function AssignAssessor({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [assessors, setAssessors] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Safely retrieve currently selected assessor from state
  const initialSelected =
    assessmentData?.selectedAssessor || assessmentData?.assessor;
  const [selectedId, setSelectedId] = useState(initialSelected?.id || null);

  // Fetch ONLY ACTIVE assessors and calculate session availability
  useEffect(() => {
    let isMounted = true;

    const fetchAssessors = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Query profiles where role = 'assessor' AND registration_status = 'Active'
        const { data: activeAssessors, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            role,
            first_name,
            last_name,
            contact_number,
            profile_photo_url,
            registration_status,
            assessor_profiles (
              user_id,
              assessor_id_number,
              qualification_specialization,
              assessment_center,
              years_of_experience
            )
          `)
          .eq("role", "assessor")
          .eq("registration_status", "Active");

        if (profilesError) throw profilesError;

        // 2. Fetch all assessor IDs currently assigned in active assessments
        const { data: activeAssignments, error: assignError } = await supabase
          .from("assignments")
          .select("assessor_id");

        if (assignError) throw assignError;

        // Set of assigned assessor IDs for fast O(1) lookup
        const assignedAssessorIds = new Set(
          (activeAssignments || [])
            .map((a) => a.assessor_id)
            .filter(Boolean)
            .map((id) => String(id))
        );

        if (isMounted && activeAssessors) {
          const formatted = activeAssessors.map((item) => {
            const rawAssessorProf = Array.isArray(item.assessor_profiles)
              ? item.assessor_profiles[0]
              : item.assessor_profiles;

            const name = [item.first_name, item.last_name]
              .filter(Boolean)
              .join(" ");

            const assessorIdStr = String(item.id);

            // Calculate Session Status: Available vs Unavailable
            const availabilityStatus = assignedAssessorIds.has(assessorIdStr)
              ? "Unavailable"
              : "Available";

            return {
              id: assessorIdStr,
              fullName: name.trim() || item.email || "Unnamed Assessor",
              email: item.email || "No Email",
              contactNumber: item.contact_number || "N/A",
              photoUrl: item.profile_photo_url || null,
              assessorIdNo: rawAssessorProf?.assessor_id_number || "N/A",
              specialization:
                rawAssessorProf?.qualification_specialization || "General",
              assessmentCenter:
                rawAssessorProf?.assessment_center || "Main Center",
              yearsExperience: rawAssessorProf?.years_of_experience || 0,
              status: availabilityStatus,
              raw: item,
            };
          });

          setAssessors(formatted);
        }
      } catch (err) {
        console.error("Supabase assessors fetch error:", err.message);
        if (isMounted) {
          setErrorMsg("Failed to load assessors from DB: " + err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAssessors();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter assessors based on search query & status dropdown
  const filteredAssessors = useMemo(() => {
    return assessors.filter((assessor) => {
      const searchTarget =
        `${assessor.fullName} ${assessor.email} ${assessor.specialization} ${assessor.assessorIdNo}`.toLowerCase();
      const matchesSearch = searchTarget.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ||
        assessor.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [assessors, search, statusFilter]);

  // Handle selecting an assessor
  const selectAssessor = (assessor) => {
    setSelectedId(assessor.id);
    setAssessmentData((data) => ({
      ...data,
      selectedAssessor: assessor,
      assessor: assessor,
    }));
  };

  const selectedAssessor = assessors.find(
    (item) => String(item.id) === String(selectedId)
  );

  return (
    <div className="-mt-4 grid min-h-[75vh] grid-cols-12 gap-6">
      {/* LEFT MAIN PANEL */}
      <div className="col-span-12 lg:col-span-9 flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Choose one assessor for this assessment session
          </h2>

          {/* Search Bar + Status Filter */}
          <div className="mb-4 grid grid-cols-12 gap-4">
            <label className="relative col-span-8">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assessor name, specialization, or ID"
                className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="col-span-4 rounded-xl border border-gray-400 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border-2 border-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading assessors from database...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-200 text-sm text-gray-700">
                  <tr>
                    <th className="w-14 px-4 py-4 text-center">Select</th>
                    <th className="px-4 py-4">Assessor Name</th>
                    <th className="px-4 py-4">Assessor ID</th>
                    <th className="px-4 py-4">Qualification</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredAssessors.map((assessor) => {
                    const isChecked = String(selectedId) === String(assessor.id);
                    const isAvailable = assessor.status === "Available";

                    return (
                      <tr
                        key={assessor.id}
                        onClick={() => selectAssessor(assessor)}
                        className="cursor-pointer border-b border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="radio"
                            name="assessor"
                            checked={isChecked}
                            onChange={() => selectAssessor(assessor)}
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-pointer accent-[#001F5B]"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {assessor.fullName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {assessor.assessorIdNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {assessor.specialization}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {assessor.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAssessors.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No active assessors found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="font-medium text-gray-700">
            Selected assessor:{" "}
            <span className="font-bold text-[#001F5B]">
              {selectedAssessor ? selectedAssessor.fullName : "None"}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedAssessor}
              onClick={onNext}
              className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
                selectedAssessor
                  ? "bg-[#001F5B] hover:bg-[#001746]"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: SELECTED ASSESSOR DETAILS */}
      <aside className="col-span-12 lg:col-span-3 flex flex-col items-center rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <h3 className="w-full text-lg font-bold text-gray-900 border-b pb-3 text-center">
          Selected Assessor
        </h3>

        {selectedAssessor ? (
          <div className="mt-6 flex flex-col items-center text-center space-y-4 w-full">
            {/* Profile Photo */}
            {selectedAssessor.photoUrl ? (
              <img
                src={selectedAssessor.photoUrl}
                alt={selectedAssessor.fullName}
                className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-gray-200"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#001F5B] text-2xl font-bold text-white shadow-md">
                {selectedAssessor.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info Section */}
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-gray-900">
                {selectedAssessor.fullName}
              </h4>
              <p className="text-sm font-medium text-gray-600">
                ID: {selectedAssessor.assessorIdNo}
              </p>
              <p className="text-sm text-gray-500">
                {selectedAssessor.specialization}
              </p>
            </div>

            {/* Status Pill */}
            <span
              className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${
                selectedAssessor.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {selectedAssessor.status}
            </span>
          </div>
        ) : (
          <div className="my-auto text-center text-sm text-gray-500">
            <p>Please choose an assessor from the table to view details.</p>
          </div>
        )}
      </aside>
    </div>
  );
}