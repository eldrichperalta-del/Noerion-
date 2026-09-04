import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

// --- TIME FORMATTER HELPER ---
function formatTime12Hour(timeStr) {
  if (!timeStr) return "N/A";

  // Clean string from any pre-existing AM/PM tags or trailing whitespace
  const cleanStr = timeStr.replace(/(AM|PM)/gi, "").trim();
  const [hourStr, minuteStr] = cleanStr.split(":");

  let hours = parseInt(hourStr, 10);
  const minutes = minuteStr ? minuteStr.substring(0, 2) : "00";

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight, 16 to 04, etc.

  const formattedHours = String(hours).padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
}

function getScheduleStatus(batch) {
  if (!batch.assessment_date) return "Pending";

  const now = new Date();

  const start = new Date(
    `${batch.assessment_date}T${batch.start_time || "00:00:00"}`
  );

  const end = new Date(
    `${batch.assessment_date}T${batch.end_time || "23:59:59"}`
  );

  if (now < start) {
    return "Pending";
  }

  if (now >= start && now <= end) {
    return "Ongoing";
  }

  return "Completed";
}

// --- VIEW DETAILS MODAL ---
function DetailsModal({ batch, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Scheduled Assessment Details</h2>
            <p className="mt-0.5 text-xs text-gray-500">{batch.assessment_name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto p-6 text-sm">
          {/* Assessment Info */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Assessment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-400 font-medium">Course</span>
                <p className="font-semibold text-gray-800">{batch.assessment_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium">Qualification</span>
                <p className="font-semibold text-gray-800">{batch.qualification || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium">Assessment Type</span>
                <p className="font-semibold text-gray-800">{batch.assessment_type || "Written"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium">Instructions</span>
                <p className="text-xs text-gray-600 leading-relaxed">{batch.instructions || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Trainees inside this Batch */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">
              Selected Trainees <span className="font-normal text-xs text-gray-500">({batch.assignments?.length || 0})</span>
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {batch.assignments && batch.assignments.length > 0 ? (
                batch.assignments.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <p className="font-semibold text-gray-900">
                      {item.trainee_profile ? `${item.trainee_profile.first_name} ${item.trainee_profile.last_name}` : "Unknown Trainee"}
                    </p>
                    <p className="text-xs text-gray-500">{item.trainee_profile?.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No trainees assigned.</p>
              )}
            </div>
          </div>

          {/* Assessor Info */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Assigned Assessor</h3>
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
              <p className="font-semibold text-gray-900">
                {batch.assessor_profile ? `${batch.assessor_profile.first_name} ${batch.assessor_profile.last_name}` : "N/A"}
              </p>
              <p className="text-xs text-gray-500">{batch.assessor_profile?.email}</p>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Schedule &amp; Duration</h3>
            <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-100 p-3 bg-gray-50/50">
              <div>
                <span className="text-xs text-gray-400">Schedule Date</span>
                <p className="font-semibold text-gray-800">{batch.assessment_date}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Start Time</span>
                <p className="font-semibold text-gray-800">{formatTime12Hour(batch.start_time)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">End Time</span>
                <p className="font-semibold text-gray-800">{formatTime12Hour(batch.end_time)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- MAIN PAGE ---
export default function ScheduleAssessmentPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);

        // Fetch directly from assessment_batches table
        const { data, error } = await supabase
          .from("assessment_batches")
          .select(`
            *,
            assessor_profile:profiles!assessment_batches_assessor_id_fkey(first_name, last_name, email),
            assignments(
              id,
              trainee_profile:profiles!assignments_trainee_id_fkey(first_name, last_name, email)
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBatches(data || []);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const filtered = useMemo(() => {
    return batches.filter((item) => {
      const searchTerm = search.toLowerCase();

      const scheduleDate = item.assessment_date
        ? new Date(`${item.assessment_date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        : "";

      return `${item.assessment_name} ${item.qualification} ${scheduleDate}`
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [batches, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Assessment</h1>
          <p className="mt-1 text-sm text-gray-600">Organize assessment schedules, participants, and assessor assignments.</p>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course, qualification and date"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
          />
        </div>
        <button
          onClick={() => navigate("/admin/assessments/schedule/choose")}
          className="flex items-center gap-2 rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#001f59]"
        >
          <Plus size={18} /> Name Schedule Assessment
        </button>
      </div>

      {/* Table */}
      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Qualification</th>
                <th className="px-6 py-4">Assessment Type</th>
                <th className="px-6 py-4">Schedule Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="w-20 px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Loading schedules...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {batch.assessment_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {batch.qualification || "TESDA NC IV IT"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {batch.assessment_type || "Written"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(
                        `${batch.assessment_date}T00:00:00`
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {(() => {
                        const status = getScheduleStatus(batch);

                        const statusStyles = {
                          Pending:
                            "bg-yellow-50 text-yellow-700 border-yellow-200",
                          Ongoing:
                            "bg-blue-50 text-blue-700 border-blue-200",
                          Completed:
                            "bg-green-50 text-green-700 border-green-200",
                        };

                        return (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]
                              }`}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="relative px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === batch.id ? null : batch.id
                          )
                        }
                        className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === batch.id && (
                        <div className="absolute right-6 top-12 z-20 w-36 rounded-xl border bg-white py-1 text-left shadow-lg">
                          <button
                            onClick={() => {
                              setSelectedDetails(batch);
                              setOpenMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No scheduled assessments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDetails && <DetailsModal batch={selectedDetails} onClose={() => setSelectedDetails(null)} />}
    </div>
  );
}