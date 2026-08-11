import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../../../supabaseClient";

export default function SelectTrainees({
  assessmentData,
  setAssessmentData,
  onNext,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [traineeList, setTraineeList] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Safely retrieve currently selected IDs from state
  const initialSelected =
    assessmentData?.trainees || assessmentData?.selectedTrainees || [];
  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelected.map((t) => String(t.id || t.user_id))
  );

  // Fetch approved trainees & calculate session status
  useEffect(() => {
    let isMounted = true;

    const fetchTrainees = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Fetch ONLY approved trainees from profiles
        const { data: approvedTrainees, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            role,
            first_name,
            last_name,
            is_approved,
            registration_status,
            trainee_profiles (
              nc_level,
              qualification_course,
              training_center
            )
          `)
          .eq("role", "trainee")
          .or("is_approved.eq.true,registration_status.eq.Approved");

        if (profilesError) throw profilesError;

        // 2. Fetch all trainee IDs currently assigned to an assessment
        const { data: activeAssignments, error: assignError } = await supabase
          .from("assignments")
          .select("trainee_id");

        if (assignError) throw assignError;

        // Build a Set of assigned trainee IDs for fast O(1) lookup
        const assignedTraineeIds = new Set(
          (activeAssignments || []).map((a) => String(a.trainee_id))
        );

        if (isMounted && approvedTrainees) {
          const formatted = approvedTrainees.map((item) => {
            const rawTraineeProf = Array.isArray(item.trainee_profiles)
              ? item.trainee_profiles[0]
              : item.trainee_profiles;

            const name = [item.first_name, item.last_name]
              .filter(Boolean)
              .join(" ");

            const qualification =
              rawTraineeProf?.nc_level ||
              rawTraineeProf?.qualification_course ||
              "NC II";

            const traineeIdStr = String(item.id);

            // DYNAMIC STATUS CALCULATION
            const sessionStatus = assignedTraineeIds.has(traineeIdStr)
              ? "In Another Session"
              : "Active";

            return {
              id: traineeIdStr,
              fullName: name.trim() || item.email || "Unnamed Trainee",
              email: item.email || "No Email",
              qualification: qualification,
              assessmentStatus: sessionStatus,
              raw: item,
            };
          });

          setTraineeList(formatted);
        }
      } catch (err) {
        console.error("Supabase trainees fetch error:", err.message);
        if (isMounted) {
          setErrorMsg("Failed to load trainees from DB: " + err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrainees();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter trainees based on search input & qualification dropdown
  const filteredTrainees = useMemo(() => {
    return traineeList.filter((trainee) => {
      const searchTarget =
        `${trainee.fullName} ${trainee.id} ${trainee.email}`.toLowerCase();
      const matchesSearch = searchTarget.includes(search.toLowerCase());
      const matchesQual =
        qualificationFilter === "All" ||
        trainee.qualification.toLowerCase() ===
          qualificationFilter.toLowerCase();

      return matchesSearch && matchesQual;
    });
  }, [traineeList, search, qualificationFilter]);

  // Filter for trainees that are active and available for selection
  const selectableTrainees = useMemo(() => {
    return filteredTrainees.filter((t) => t.assessmentStatus === "Active");
  }, [filteredTrainees]);

  // Bulk check box selection logic (Only active trainees)
  const allSelected =
    selectableTrainees.length > 0 &&
    selectableTrainees.every((t) => selectedIds.includes(String(t.id)));

  const toggleSelectAll = () => {
    if (allSelected) {
      const selectableIds = new Set(selectableTrainees.map((t) => String(t.id)));
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.has(id)));
    } else {
      const newIds = selectableTrainees.map((t) => String(t.id));
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const toggleSelectOne = (id) => {
    const targetTrainee = traineeList.find((t) => String(t.id) === String(id));
    if (targetTrainee && targetTrainee.assessmentStatus !== "Active") return;

    const stringId = String(id);
    setSelectedIds((prev) =>
      prev.includes(stringId)
        ? prev.filter((item) => item !== stringId)
        : [...prev, stringId]
    );
  };

  const handleContinue = () => {
    const selectedObjects = traineeList.filter((t) =>
      selectedIds.includes(String(t.id))
    );

    setAssessmentData((prev) => ({
      ...prev,
      trainees: selectedObjects,
      selectedTrainees: selectedObjects,
    }));

    onNext();
  };

  return (
    <div className="-mt-4 rounded-2xl bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Step 2: Select Trainees
      </h2>

      {/* Controls: Search Bar + Qualification Select */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainee name or email"
            className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
          />
        </label>
        <select
          value={qualificationFilter}
          onChange={(e) => setQualificationFilter(e.target.value)}
          className="rounded-xl border border-gray-400 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
        >
          <option value="All">All Qualifications</option>
          <option value="NC II">NC II</option>
          <option value="IT 2">IT 2</option>
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
            Loading trainees from database...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-sm text-gray-700">
              <tr>
                <th className="w-14 px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={selectableTrainees.length === 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </th>
                <th className="px-4 py-4">Trainee Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Qualification</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTrainees.map((trainee) => {
                const isChecked = selectedIds.includes(String(trainee.id));
                const isActive = trainee.assessmentStatus === "Active";

                return (
                  <tr
                    key={trainee.id}
                    onClick={() => toggleSelectOne(trainee.id)}
                    className={`border-b border-gray-200 transition-colors ${
                      isActive
                        ? "cursor-pointer hover:bg-gray-100"
                        : "cursor-not-allowed opacity-70 bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isActive}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelectOne(trainee.id)}
                        className="cursor-pointer accent-[#001F5B] disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {trainee.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{trainee.email}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {trainee.qualification}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {trainee.assessmentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredTrainees.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No approved trainees found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Action Controls */}
      <div className="mt-4 flex items-center justify-between px-2 py-2 text-sm">
        <p className="font-medium text-gray-700">
          Selected trainees:{" "}
          <span className="font-bold text-[#001F5B]">{selectedIds.length}</span>
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
            disabled={selectedIds.length === 0}
            onClick={handleContinue}
            className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
              selectedIds.length > 0
                ? "bg-[#001F5B] hover:bg-[#001746]"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}