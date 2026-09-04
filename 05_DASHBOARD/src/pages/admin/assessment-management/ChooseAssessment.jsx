import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../../supabaseClient";

export default function ChooseAssessment({
  assessmentData,
  setAssessmentData,
  onNext,
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Safely retrieve currently selected ID from state
  const initialSelected =
    assessmentData?.selectedAssessment || assessmentData?.assessment;
  const [selectedId, setSelectedId] = useState(initialSelected?.id || null);

  // Fetch active assessments directly from Supabase DB schema
  useEffect(() => {
    let isMounted = true;

    const fetchActiveAssessments = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Fetch assessments joined with courses
        const { data, error } = await supabase
          .from("assessments")
          .select(`
            id,
            course_id,
            title,
            set_type,
            total_items,
            time_limit_minutes,
            is_active,
            status,
            created_at,
            courses (
              id,
              code,
              title,
              qualification_level,
              description
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted && data) {
          // STRICT FILTER: Exclude drafts and keep ONLY truly active assessments
          const activeOnlyList = data
            .filter((item) => {
              const statusStr = (item.status || "").toLowerCase().trim();
              const isStatusActive = statusStr === "active";
              const isNotDraft = statusStr !== "draft";
              const isFlagActive = item.is_active === true;

              // Must be explicitly marked Active AND not Draft
              return isStatusActive || (isFlagActive && isNotDraft && statusStr !== "");
            })
            .map((item) => ({
              id: item.id,
              courseId: item.course_id,
              title: item.title || item.courses?.title || "Untitled Assessment",
              courseCode: item.courses?.code || "",
              qualification:
                item.courses?.qualification_level ||
                item.courses?.title ||
                "NC II",
              assessmentType: item.set_type || "Written",
              timeLimit: item.time_limit_minutes || 30,
              totalItems: item.total_items || 0,
              status: "Active",
              raw: item,
            }));

          setAssessments(activeOnlyList);
        }
      } catch (err) {
        console.error("Supabase fetch error:", err.message);
        if (isMounted) {
          setErrorMsg("Failed to load assessments from DB: " + err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActiveAssessments();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter active assessments based on user search input
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const searchTarget =
        `${item.title} ${item.qualification} ${item.courseCode} ${item.assessmentType}`.toLowerCase();
      return searchTarget.includes(search.toLowerCase());
    });
  }, [assessments, search]);

  // Handle assessment selection with dual-key update for step compatibility
  const selectAssessment = (assessment) => {
    setSelectedId(assessment.id);
    setAssessmentData((data) => ({
      ...data,
      selectedAssessment: assessment,
      assessment: assessment, // Compatibility key for Step 4 & 5
    }));
  };

  const selected = assessments.find(
    (item) => String(item.id) === String(selectedId)
  );

  return (
    <div className="-mt-4 rounded-2xl bg-white px-5 py-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Choose assessment for session
      </h2>

      {/* Search Input */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course and qualification"
            className="w-full rounded-xl border border-gray-400 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#001F5B]"
          />
        </label>
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
            Loading active assessments from database...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-sm text-gray-700">
              <tr>
                <th className="w-14 px-4 py-4">Select</th>
                <th className="px-4 py-4">Course</th>
                <th className="px-4 py-4">Qualification</th>
                <th className="px-4 py-4">Assessment Type</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredAssessments.map((assessment) => {
                const isChecked = String(selectedId) === String(assessment.id);

                return (
                  <tr
                    key={assessment.id}
                    onClick={() => selectAssessment(assessment)}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="assessment"
                        checked={isChecked}
                        onChange={() => selectAssessment(assessment)}
                        className="h-5 w-5 cursor-pointer accent-[#001F5B]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {assessment.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {assessment.qualification}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {assessment.assessmentType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredAssessments.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No active assessments found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-4 flex items-start justify-between px-2 py-2 text-sm">
        <p className="font-medium text-gray-700">
          Total selected: {selected ? "1/1" : "0/1"}
        </p>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3 text-gray-600">
            <span>
              Showing {filteredAssessments.length > 0 ? 1 : 0}-
              {filteredAssessments.length} of {assessments.length} course
            </span>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-1 font-medium"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              ›
            </button>
          </div>

          <button
            type="button"
            disabled={!selected}
            onClick={onNext}
            className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
              selected
                ? "bg-[#001F5B] hover:bg-[#001746]"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}