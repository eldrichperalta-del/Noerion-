import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Mail,
  MoreVertical,
  Plus,
  School,
  Search,
  User,
  Users,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../../supabaseClient";


// =========================================================
// TIME FORMATTER
// =========================================================

function formatTime12Hour(timeStr) {
  if (!timeStr) return "N/A";

  const cleanStr = timeStr
    .replace(/(AM|PM)/gi, "")
    .trim();

  const [hourStr, minuteStr] =
    cleanStr.split(":");

  let hours = parseInt(hourStr, 10);

  const minutes = minuteStr
    ? minuteStr.substring(0, 2)
    : "00";

  if (isNaN(hours)) {
    return timeStr;
  }

  const ampm =
    hours >= 12
      ? "PM"
      : "AM";

  hours =
    hours % 12 || 12;

  const formattedHours =
    String(hours).padStart(2, "0");

  return `${formattedHours}:${minutes} ${ampm}`;
}


// =========================================================
// SCHEDULE STATUS
// =========================================================

function getScheduleStatus(batch) {
  if (!batch.assessment_date) {
    return "Pending";
  }

  const now = new Date();

  const start = new Date(
    `${batch.assessment_date}T${batch.start_time || "00:00:00"
    }`
  );

  const end = new Date(
    `${batch.assessment_date}T${batch.end_time || "23:59:59"
    }`
  );

  if (now < start) {
    return "Pending";
  }

  if (
    now >= start &&
    now <= end
  ) {
    return "Ongoing";
  }

  return "Completed";
}


// =========================================================
// VIEW DETAILS MODAL
// =========================================================


function DetailsModal({
  batch,
  onClose,
}) {
  const traineeCount =
    batch.assignments?.length || 0;

  const assessorName =
    batch.assessor_profile
      ? `${batch.assessor_profile.first_name || ""} ${batch.assessor_profile.last_name || ""
        }`.trim()
      : "N/A";

  const assessorEmail =
    batch.assessor_profile?.email || "N/A";

  const scheduleStatus =
    getScheduleStatus(batch);

  const statusStyles = {
    Pending:
      "bg-yellow-100 text-yellow-700",

    Ongoing:
      "bg-blue-100 text-blue-700",

    Completed:
      "bg-green-100 text-green-700",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-[#15294b] px-6 py-4 text-white">

          <div className="flex items-center gap-2">

            <Calendar
              size={18}
              className="text-white"
            />

            <h2 className="text-lg font-semibold">
              Scheduled Assessment Details
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white transition hover:text-red-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>

        </header>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="p-6">

          {/* ===================================================
              ASSESSMENT SUMMARY
          =================================================== */}

          <div className="mb-8 border-b border-[#e5e7eb] pb-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

              <div>

                <h2 className="text-2xl font-bold text-[#111827]">
                  {batch.assessment_name || "N/A"}
                </h2>

                <p className="mt-1 text-sm text-[#6b7280]">
                  Scheduled assessment details
                </p>

              </div>

              <span
                className={`w-fit rounded-lg px-4 py-2 text-sm font-semibold ${statusStyles[scheduleStatus]
                  }`}
              >
                {scheduleStatus}
              </span>

            </div>

          </div>


          {/* ===================================================
              ASSESSMENT INFORMATION
          =================================================== */}

          <section>

            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              Assessment Information
            </h3>

            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">

              {/* COURSE */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <BookOpen
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Course

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {batch.assessment_name || "Not provided"}

                </dd>

              </div>


              {/* QUALIFICATION */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <School
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Qualification

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {batch.qualification || "Not provided"}

                </dd>

              </div>


              {/* ASSESSMENT TYPE */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <ClipboardList
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Assessment Type

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {batch.assessment_type || "Written"}

                </dd>

              </div>


              {/* NUMBER OF TRAINEES */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <Users
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Selected Trainees

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {traineeCount}{" "}
                  {traineeCount === 1
                    ? "Trainee"
                    : "Trainees"}

                </dd>

              </div>

            </dl>


            {/* INSTRUCTIONS */}

            <div className="mt-4 flex flex-col gap-1">

              <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                <FileText
                  size={14}
                  className="text-[#9ca3af]"
                />

                Instructions

              </dt>

              <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm leading-relaxed text-[#111827]">

                {batch.instructions || "Not provided"}

              </dd>

            </div>

          </section>


          {/* ===================================================
              SCHEDULE INFORMATION
          =================================================== */}

          <section className="mt-10">

            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              Schedule &amp; Duration
            </h3>

            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">

              {/* DATE */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <Calendar
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Schedule Date

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {batch.assessment_date
                    ? new Date(
                      `${batch.assessment_date}T00:00:00`
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                    : "Not provided"}

                </dd>

              </div>


              {/* START TIME */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <Clock
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Start Time

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {formatTime12Hour(
                    batch.start_time
                  )}

                </dd>

              </div>


              {/* END TIME */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <Clock
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  End Time

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {formatTime12Hour(
                    batch.end_time
                  )}

                </dd>

              </div>

            </dl>

          </section>


          {/* ===================================================
              ASSIGNED ASSESSOR
          =================================================== */}

          <section className="mt-10">

            <h3 className="mb-6 text-xl font-bold text-[#111827]">
              Assigned Assessor
            </h3>

            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">

              {/* NAME */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <User
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Assessor Name

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {assessorName}

                </dd>

              </div>


              {/* EMAIL */}

              <div className="flex flex-col gap-1">

                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">

                  <Mail
                    size={14}
                    className="text-[#9ca3af]"
                  />

                  Email Address

                </dt>

                <dd className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#111827]">

                  {assessorEmail}

                </dd>

              </div>

            </dl>

          </section>


          {/* ===================================================
              SELECTED TRAINEES
          =================================================== */}

          <section className="mt-10">

            <div className="mb-6 flex items-center justify-between gap-4">

              <h3 className="text-xl font-bold text-[#111827]">
                Selected Trainees
              </h3>

              <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                {traineeCount}{" "}
                {traineeCount === 1
                  ? "Trainee"
                  : "Trainees"}
              </span>

            </div>


            {batch.assignments &&
              batch.assignments.length > 0 ? (

              <div className="grid gap-4 sm:grid-cols-2">

                {batch.assignments.map(
                  (item, idx) => {

                    const traineeName =
                      item.trainee_profile
                        ? `${item.trainee_profile.first_name || ""} ${item.trainee_profile.last_name || ""
                          }`.trim()
                        : "Unknown Trainee";

                    const traineeEmail =
                      item.trainee_profile?.email ||
                      "Not provided";

                    return (

                      <div
                        key={
                          item.id ||
                          idx
                        }
                        className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4"
                      >

                        <div className="flex items-start gap-3">

                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-[#15294b] shadow-sm">

                            {idx + 1}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-[#111827]">
                              {traineeName}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#6b7280]">
                              {traineeEmail}
                            </p>

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            ) : (

              <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 text-sm text-[#6b7280]">
                No trainees assigned.
              </div>

            )}

          </section>


          {/* ===================================================
              FOOTER
          =================================================== */}

          <footer className="mt-12 flex items-center justify-end gap-4 border-t border-[#e5e7eb] pt-6">

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#15294b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f1f3b]"
            >
              Close
            </button>

          </footer>

        </div>

      </div>

    </div>
  );
}


// =========================================================
// MAIN PAGE
// =========================================================

export default function ScheduleAssessmentPage() {

  const navigate =
    useNavigate();


  // =======================================================
  // STATE
  // =======================================================

  const [batches, setBatches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [openMenu, setOpenMenu] =
    useState(null);

  const [selectedDetails, setSelectedDetails] =
    useState(null);


  // =======================================================
  // PAGINATION
  // Same style as Trainee Management
  // =======================================================

  const [currentPage, setCurrentPage] =
    useState(1);

  const ITEMS_PER_PAGE = 6;


  // =======================================================
  // FETCH SCHEDULES
  // =======================================================

  useEffect(() => {

    const fetchBatches =
      async () => {

        try {

          setLoading(true);


          const {
            data,
            error,
          } = await supabase

            .from(
              "assessment_batches"
            )

            .select(`
              *,
              assessor_profile:profiles!assessment_batches_assessor_id_fkey(
                first_name,
                last_name,
                email
              ),
              assignments(
                id,
                trainee_profile:profiles!assignments_trainee_id_fkey(
                  first_name,
                  last_name,
                  email
                )
              )
            `)

            .order(
              "created_at",
              {
                ascending: false,
              }
            );


          if (error) {
            throw error;
          }


          setBatches(
            data || []
          );

        } catch (err) {

          console.error(
            "Fetch error:",
            err.message
          );

        } finally {

          setLoading(false);

        }
      };


    fetchBatches();

  }, []);


  // =======================================================
  // FILTER
  // =======================================================

  const filtered = useMemo(() => {

    return batches.filter(
      (item) => {

        const searchTerm =
          search
            .toLowerCase()
            .trim();


        const scheduleDate =
          item.assessment_date
            ? new Date(
              `${item.assessment_date}T00:00:00`
            ).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )
            : "";


        return `${item.assessment_name || ""} ${item.qualification || ""
          } ${scheduleDate}`
          .toLowerCase()
          .includes(searchTerm);

      }
    );

  }, [
    batches,
    search,
  ]);


  // =======================================================
  // RESET PAGINATION WHEN SEARCH CHANGES
  // =======================================================

  useEffect(() => {

    setCurrentPage(1);

  }, [search]);


  // =======================================================
  // PAGINATION CALCULATIONS
  // =======================================================

  const totalPages =
    Math.ceil(
      filtered.length /
      ITEMS_PER_PAGE
    );


  const paginatedBatches =
    useMemo(() => {

      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      const endIndex =
        startIndex +
        ITEMS_PER_PAGE;

      return filtered.slice(
        startIndex,
        endIndex
      );

    }, [
      filtered,
      currentPage,
    ]);


  const showingStart =
    filtered.length === 0
      ? 0
      : (currentPage - 1) *
      ITEMS_PER_PAGE +
      1;


  const showingEnd =
    filtered.length === 0
      ? 0
      : Math.min(
        currentPage *
        ITEMS_PER_PAGE,
        filtered.length
      );


  // =======================================================
  // PAGE NAVIGATION
  // =======================================================

  const goToPage = (
    page
  ) => {

    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);

  };


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="space-y-6">

      {/* PAGE HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Assessment Scheduling
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Organize assessment schedules, participants, and assessor assignments.
          </p>

        </div>

      </header>


      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* SEARCH */}
        <div className="relative w-full sm:max-w-md">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search course, qualification and date"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm focus:border-[#002f86] focus:outline-none focus:ring-1 focus:ring-[#002f86]"
          />

        </div>


        {/* CREATE SCHEDULE */}
        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/assessments/schedule/choose"
            )
          }
          className="flex items-center gap-2 rounded-xl bg-[#002f86] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#001f59]"
        >

          <Plus size={18} />

          Schedule Assessment

        </button>

      </div>


      {/* ===================================================
          TABLE
      =================================================== */}

      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            {/* TABLE HEADER */}
            <thead className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">

              <tr>

                <th className="px-6 py-4">
                  Course
                </th>

                <th className="px-6 py-4">
                  Qualification
                </th>

                <th className="px-6 py-4">
                  Assessment Type
                </th>

                <th className="px-6 py-4">
                  Schedule Date
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="w-20 px-6 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>


            {/* TABLE BODY */}
            <tbody className="divide-y divide-gray-100 text-sm">

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading schedules...
                  </td>

                </tr>

              ) : paginatedBatches.length > 0 ? (

                paginatedBatches.map(
                  (batch) => (

                    <tr
                      key={batch.id}
                      className="transition-colors hover:bg-gray-50/60"
                    >

                      {/* COURSE */}
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {batch.assessment_name}
                      </td>


                      {/* QUALIFICATION */}
                      <td className="px-6 py-4 text-gray-600">
                        {batch.qualification ||
                          "TESDA NC IV IT"}
                      </td>


                      {/* TYPE */}
                      <td className="px-6 py-4 text-gray-600">
                        {batch.assessment_type ||
                          "Written"}
                      </td>


                      {/* DATE */}
                      <td className="px-6 py-4 text-gray-600">

                        {batch.assessment_date
                          ? new Date(
                            `${batch.assessment_date}T00:00:00`
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                          : "N/A"}

                      </td>


                      {/* STATUS */}
                      <td className="px-6 py-4">

                        {(() => {

                          const status =
                            getScheduleStatus(
                              batch
                            );


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
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[
                                status
                              ]
                                }`}
                            >
                              {status}
                            </span>

                          );

                        })()}

                      </td>


                      {/* ACTIONS */}
                      <td className="relative px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                batch.id
                                ? null
                                : batch.id
                            )
                          }
                          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                        >
                          <MoreVertical
                            size={18}
                          />
                        </button>


                        {openMenu ===
                          batch.id && (

                            <div className="absolute right-6 top-12 z-20 w-36 rounded-xl border bg-white py-1 text-left shadow-lg">

                              <button
                                type="button"
                                onClick={() => {

                                  setSelectedDetails(
                                    batch
                                  );

                                  setOpenMenu(
                                    null
                                  );

                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View details
                              </button>

                            </div>

                          )}

                      </td>

                    </tr>

                  )
                )

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


        {/* =================================================
            PAGINATION

        ================================================= */}

        {!loading &&
          filtered.length >=
          ITEMS_PER_PAGE && (

            <div className="mt-4 flex items-center justify-end px-2 py-2 text-sm">

              <div className="flex items-center gap-3 text-gray-600">

                {/* SHOWING COUNT */}
                <span>

                  Showing{" "}

                  {showingStart}

                  -

                  {showingEnd}

                  {" "}of{" "}

                  {filtered.length}

                  {" "}schedules

                </span>


                {/* PREVIOUS */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.max(
                          prev - 1,
                          1
                        )
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ‹
                </button>


                {/* PAGE NUMBERS */}
                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map(
                  (page) => (

                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        goToPage(page)
                      }
                      className={`rounded-md border px-3 py-1 font-medium ${currentPage === page
                        ? "border-gray-300 bg-gray-100"
                        : "border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>

                  )
                )}


                {/* NEXT */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (prev) =>
                        Math.min(
                          prev + 1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ›
                </button>

              </div>

            </div>

          )}

      </section>


      {/* DETAILS MODAL */}
      {selectedDetails && (

        <DetailsModal
          batch={
            selectedDetails
          }
          onClose={() =>
            setSelectedDetails(
              null
            )
          }
        />

      )}

    </div>

  );
}