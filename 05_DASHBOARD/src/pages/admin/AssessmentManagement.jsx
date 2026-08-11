import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Copy, MoreVertical, RotateCcw, Search, Trash2 } from "lucide-react";
import { supabase } from "../../supabaseClient";

const qualificationLevel = (value) =>
  value?.match(/NC\s+(?:I{1,3}|IV)/)?.[0] || value || "NC II";

const formatStatus = (str) => {
  if (!str) return "Draft";
  const lower = str.toLowerCase();
  if (lower === "active") return "Active";
  if (lower === "archived" || lower === "archive") return "Archived";
  if (lower === "completed") return "Completed";
  return "Draft";
};

const badge = (value) => {
  switch (value) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Completed":
      return "bg-amber-100 text-amber-800";
    case "Archived":
      return "bg-gray-200 text-gray-700";
    case "Draft":
    default:
      return "bg-blue-100 text-blue-800";
  }
};

function MenuItem({ label, Icon, onClick, destructive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
        destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

export default function AssessmentManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [qualification, setQualification] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Last Updated");
  const [openMenu, setOpenMenu] = useState(null);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      // Query assessments with courses and question count
      const { data, error } = await supabase
        .from("assessments")
        .select(`
          id,
          title,
          set_type,
          total_items,
          time_limit_minutes,
          status,
          created_at,
          courses ( id, code, title, qualification_level ),
          questions ( id )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedItems = (data || []).map((assessment) => ({
        id: assessment.id,
        course: assessment.title,
        qualification: qualificationLevel(
          assessment.courses?.qualification_level || assessment.courses?.title || assessment.title
        ),
        type: assessment.set_type || "Written",
        // Count total questions from joined questions table or total_items column
        questions: assessment.questions?.length || assessment.total_items || 0,
        updated: assessment.created_at
          ? new Date(assessment.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Jul 31, 2026",
        status: formatStatus(assessment.status),
        raw: assessment,
      }));

      setItems(formattedItems);
    } catch (err) {
      console.error("Error fetching assessments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const assessments = useMemo(() => {
    return items
      .filter((item) => {
        const matchesQualification = qualification === "All" || item.qualification === qualification;
        const matchesStatus =
          status === "All" ||
          item.status === (status === "Archive" ? "Archived" : status);
        const matchesSearch = item.course.toLowerCase().includes(search.toLowerCase());

        return matchesQualification && matchesStatus && matchesSearch;
      })
      .sort((first, second) =>
        sort === "Last Updated"
          ? String(second.updated).localeCompare(String(first.updated))
          : first.course.localeCompare(second.course)
      );
  }, [items, search, qualification, status, sort]);

  const closeMenu = () => setOpenMenu(null);

  const changeStatus = async (id, nextStatus) => {
    try {
      let { error } = await supabase
        .from("assessments")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) {
        const { error: lowerErr } = await supabase
          .from("assessments")
          .update({ status: nextStatus.toLowerCase() })
          .eq("id", id);

        if (lowerErr) throw lowerErr;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: formatStatus(nextStatus),
                updated: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              }
            : item
        )
      );
    } catch (err) {
      alert(`Unable to update status: ${err.message}`);
    } finally {
      closeMenu();
    }
  };

  const duplicate = async (item) => {
    try {
      const source = item.raw;
      const { error } = await supabase.from("assessments").insert({
        course_id: source?.courses?.id || null,
        title: `${item.course} - Copy`,
        set_type: source?.set_type || "Written",
        total_items: source?.total_items || 0,
        time_limit_minutes: source?.time_limit_minutes || 30,
        status: "Draft",
      });

      if (error) throw error;
      await loadAssessments();
    } catch (err) {
      alert(`Error duplicating assessment: ${err.message}`);
    } finally {
      closeMenu();
    }
  };

  const remove = async (id, permanent = false) => {
    if (
      permanent &&
      !window.confirm("Permanently delete this assessment? This cannot be undone.")
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("assessments").delete().eq("id", id);
      if (error) throw error;

      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      alert(`Error deleting assessment: ${err.message}`);
    } finally {
      closeMenu();
    }
  };

  const actions = (item) => (
    <div
      className={`absolute right-4 top-12 z-10 w-52 origin-top-right overflow-hidden rounded-xl border bg-white py-1 shadow-lg transition-all duration-200 ${
        openMenu === item.id
          ? "visible translate-y-0 scale-100 opacity-100"
          : "invisible -translate-y-2 scale-95 opacity-0"
      }`}
    >
      {item.status === "Archived" ? (
        <>
          <MenuItem
            label="Restore"
            Icon={RotateCcw}
            onClick={() => changeStatus(item.id, "Active")}
          />
          <MenuItem label="Duplicate" Icon={Copy} onClick={() => duplicate(item)} />
          <MenuItem
            label="Delete Permanently"
            Icon={Trash2}
            onClick={() => remove(item.id, true)}
            destructive
          />
        </>
      ) : (
        <>
          <MenuItem label="Duplicate" Icon={Copy} onClick={() => duplicate(item)} />
          <MenuItem
            label="Archive"
            Icon={Archive}
            onClick={() => changeStatus(item.id, "Archived")}
          />
          <MenuItem
            label="Delete"
            Icon={Trash2}
            onClick={() => remove(item.id)}
            destructive
          />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Assessment Library</h1>
          <p className="mt-2 text-gray-600">
            Create, organize, and manage reusable assessment templates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/assessments/create")}
          className="rounded-xl bg-[#002f86] px-5 py-3 font-semibold text-white shadow-md hover:bg-[#001f59]"
        >
          + Create Assessment
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-[#002f86]"
          />
        </label>
        <select
          value={qualification}
          onChange={(event) => setQualification(event.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <option value="All">Qualification</option>
          <option>NC I</option>
          <option>NC II</option>
          <option>NC III</option>
          <option>NC IV</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <option value="All">Status</option>
          <option>Active</option>
          <option>Draft</option>
          <option>Completed</option>
          <option>Archive</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
        >
          <option>Last Updated</option>
          <option>Course Name</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading assessment library...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assessments.map((item) => (
            <article
              key={item.id}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <button
                onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 transition hover:bg-gray-100"
                aria-label="Assessment actions"
              >
                <MoreVertical size={22} />
              </button>

              {actions(item)}

              <h2 className="pr-8 text-xl font-bold text-gray-900">{item.course}</h2>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Qualification</dt>
                  <dd className="font-semibold">{item.qualification}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Assessment Type</dt>
                  <dd className="font-semibold">{item.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Total Questions</dt>
                  <dd className="font-semibold">{item.questions}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last Updated</dt>
                  <dd className="font-semibold">{item.updated}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Status</dt>
                  <dd className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(item.status)}`}>
                    {item.status}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => navigate(`/admin/assessments/${item.id}`)}
                className="mt-6 w-full rounded-lg bg-[#002f86] py-3 font-semibold text-white hover:bg-[#001f59]"
              >
                View Assessment
              </button>
            </article>
          ))}

          {!assessments.length && (
            <p className="col-span-full py-8 text-center text-gray-500">
              No assessments match your filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}