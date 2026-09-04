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

  // Default filter is Available
  const [statusFilter, setStatusFilter] = useState("Available");

  const [loading, setLoading] = useState(true);
  const [assessors, setAssessors] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Safely retrieve currently selected assessor from state
  const initialSelected =
    assessmentData?.selectedAssessor || assessmentData?.assessor;

  const [selectedId, setSelectedId] = useState(
    initialSelected?.id || null
  );

  // =========================================================
  // FETCH ASSESSORS
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    const fetchAssessors = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Fetch approved assessors
        const { data: activeAssessors, error: profilesError } =
          await supabase
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
            .ilike("role", "assessor")
            .ilike("registration_status", "Approved");

        if (profilesError) throw profilesError;

        // Fetch assessor IDs currently assigned
        const { data: activeAssignments, error: assignError } =
          await supabase
            .from("assignments")
            .select("assessor_id");

        if (assignError) throw assignError;

        const assignedAssessorIds = new Set(
          (activeAssignments || [])
            .map((assignment) => assignment.assessor_id)
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

            // Determine availability
            const availabilityStatus = assignedAssessorIds.has(
              assessorIdStr
            )
              ? "Unavailable"
              : "Available";

            return {
              id: assessorIdStr,
              fullName:
                name.trim() || item.email || "Unnamed Assessor",
              email: item.email || "No Email",
              contactNumber: item.contact_number || "N/A",
              photoUrl: item.profile_photo_url || null,
              assessorIdNo:
                rawAssessorProf?.assessor_id_number || "N/A",
              specialization:
                rawAssessorProf?.qualification_specialization ||
                "General",
              assessmentCenter:
                rawAssessorProf?.assessment_center || "Main Center",
              yearsExperience:
                rawAssessorProf?.years_of_experience || 0,
              status: availabilityStatus,
              raw: item,
            };
          });

          setAssessors(formatted);
        }
      } catch (err) {
        console.error(
          "Supabase assessors fetch error:",
          err.message
        );

        if (isMounted) {
          setErrorMsg(
            "Failed to load assessors from DB: " + err.message
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAssessors();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // FILTER ASSESSORS
  // =========================================================
  const filteredAssessors = useMemo(() => {
    return assessors.filter((assessor) => {
      const searchTarget =
        `${assessor.fullName} ${assessor.email} ${assessor.specialization} ${assessor.assessorIdNo}`.toLowerCase();

      const matchesSearch = searchTarget.includes(
        search.toLowerCase()
      );

      const matchesStatus =
        statusFilter === "All" ||
        assessor.status.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [assessors, search, statusFilter]);

  // =========================================================
  // RESET PAGINATION WHEN SEARCH/FILTER CHANGES
  // =========================================================
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================
  const totalItems = filteredAssessors.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / itemsPerPage)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * itemsPerPage;

  const endIndex = Math.min(
    startIndex + itemsPerPage,
    totalItems
  );

  const paginatedAssessors = filteredAssessors.slice(
    startIndex,
    endIndex
  );

  const showingStart =
    totalItems > 0 ? startIndex + 1 : 0;

  const showingEnd =
    totalItems > 0 ? endIndex : 0;

  // =========================================================
  // PAGINATION HANDLERS
  // =========================================================
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, totalPages)
    );
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // =========================================================
  // SELECT ASSESSOR
  // =========================================================
  const selectAssessor = (assessor) => {
    // Do not allow unavailable assessors to be selected
    if (assessor.status !== "Available") return;

    setSelectedId(assessor.id);

    setAssessmentData((data) => ({
      ...data,
      selectedAssessor: assessor,
      assessor: assessor,
    }));
  };

  // Find selected assessor from complete list
  const selectedAssessor = assessors.find(
    (item) =>
      String(item.id) === String(selectedId)
  );

  return (
    <div className="-mt-4 grid min-h-[75vh] grid-cols-12 gap-6">

      {/* =====================================================
          LEFT MAIN PANEL
      ===================================================== */}
      <div className="col-span-12 flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)] lg:col-span-9">

        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Choose one assessor for this assessment session
          </h2>

          {/* =================================================
              SEARCH + STATUS FILTER
          ================================================= */}
          <div className="mb-4 grid grid-cols-12 gap-4">

            <label className="relative col-span-8">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search assessor name, specialization, or ID"
                className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="col-span-4 rounded-xl border border-gray-400 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
            >
              <option value="Available">
                Available
              </option>

              <option value="Unavailable">
                Unavailable
              </option>

              <option value="All">
                All Status
              </option>
            </select>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================= */}
          <div className="overflow-hidden rounded-xl border-2 border-gray-100">

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading assessors from database...
              </div>
            ) : (
              <table className="w-full text-left">

                <thead className="bg-gray-200 text-sm text-gray-700">
                  <tr>
                    <th className="w-14 px-4 py-4 text-center">
                      Select
                    </th>

                    <th className="px-4 py-4">
                      Assessor Name
                    </th>

                    <th className="px-4 py-4">
                      Assessor ID
                    </th>

                    <th className="px-4 py-4">
                      Qualification
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="text-sm">

                  {paginatedAssessors.map((assessor) => {
                    const isChecked =
                      String(selectedId) ===
                      String(assessor.id);

                    const isAvailable =
                      assessor.status === "Available";

                    return (
                      <tr
                        key={assessor.id}
                        onClick={() =>
                          selectAssessor(assessor)
                        }
                        className={`border-b border-gray-200 transition-colors ${
                          isAvailable
                            ? "cursor-pointer hover:bg-gray-100"
                            : "cursor-not-allowed bg-gray-50 opacity-70"
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="radio"
                            name="assessor"
                            checked={isChecked}
                            disabled={!isAvailable}
                            onChange={() =>
                              selectAssessor(assessor)
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            className="h-5 w-5 cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
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
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {assessor.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedAssessors.length === 0 &&
                    !loading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-gray-500"
                        >
                          No assessors found.
                        </td>
                      </tr>
                    )}

                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <div className="mt-4 flex items-start justify-between px-2 py-2 text-sm">

          {/* SELECTED ASSESSOR */}
          <p className="font-medium text-gray-700">
            Selected assessor:{" "}
            <span className="font-bold text-[#001F5B]">
              {selectedAssessor
                ? selectedAssessor.fullName
                : "None"}
            </span>
          </p>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-end gap-4">

            {/* =================================================
                PAGINATION
            ================================================= */}
            <div className="flex items-center gap-3 text-gray-600">

              <span>
                Showing {showingStart}-{showingEnd} of{" "}
                {totalItems} assessor
                {totalItems !== 1 ? "s" : ""}
              </span>

              {/* PREVIOUS */}
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={safeCurrentPage === 1}
                className={`rounded-md border border-gray-300 px-3 py-1 ${
                  safeCurrentPage === 1
                    ? "cursor-not-allowed text-gray-300"
                    : "hover:bg-gray-50"
                }`}
              >
                ‹
              </button>

              {/* PAGE NUMBERS */}
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`rounded-md border border-gray-300 px-3 py-1 ${
                    safeCurrentPage === page
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* NEXT */}
              <button
                type="button"
                onClick={goToNextPage}
                disabled={
                  safeCurrentPage === totalPages
                }
                className={`rounded-md border border-gray-300 px-3 py-1 ${
                  safeCurrentPage === totalPages
                    ? "cursor-not-allowed text-gray-300"
                    : "hover:bg-gray-50"
                }`}
              >
                ›
              </button>

            </div>

            {/* =================================================
                BACK + NEXT
            ================================================= */}
            <div className="flex gap-3">

              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
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
                Next
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDEBAR
      ===================================================== */}
      <aside className="col-span-12 flex flex-col items-center rounded-2xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.35)] lg:col-span-3">

        <h3 className="w-full border-b pb-3 text-center text-lg font-bold text-gray-900">
          Selected Assessor
        </h3>

        {selectedAssessor ? (
          <div className="mt-6 flex w-full flex-col items-center space-y-4 text-center">

            {/* PROFILE PHOTO */}
            {selectedAssessor.photoUrl ? (
              <img
                src={selectedAssessor.photoUrl}
                alt={selectedAssessor.fullName}
                className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#001F5B] text-2xl font-bold text-white shadow-md">
                {selectedAssessor.fullName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            {/* INFO */}
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

            {/* STATUS */}
            <span
              className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${
                selectedAssessor.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {selectedAssessor.status}
            </span>

          </div>
        ) : (
          <div className="my-auto text-center text-sm text-gray-500">
            <p>
              Please choose an assessor from the table
              to view details.
            </p>
          </div>
        )}

      </aside>
    </div>
  );
}

