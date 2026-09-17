import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ClipboardList,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";
import { supabase } from "../../supabaseClient";
import useNotifications from "../../hooks/useNotifications";

// ==========================================
// DASHBOARD CARD
// ==========================================

const Card = ({ label, value, Icon, tint }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
    <p className="text-sm font-medium text-gray-900">
      {label}
    </p>

    <div className="mt-4 flex items-center gap-3">
      <div className={`rounded-xl p-3 ${tint}`}>
        <Icon size={22} />
      </div>

      <span className="text-3xl font-bold">
        {value}
      </span>
    </div>
  </div>
);

// ==========================================
// DATE FORMATTER
// ==========================================

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(
    `${String(dateValue).slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Home() {
  const navigate = useNavigate();

  const [adminName, setAdminName] =
    useState("Admin");

  // ==========================================
  // NOTIFICATIONS
  //
  // Uses the exact same notification source
  // as NotificationBell.jsx.
  //
  // This keeps Navbar Notifications and
  // Admin Recent Activity synchronized.
  // ==========================================

  const {
    notifications,
    isLoading: notificationsLoading,
  } = useNotifications();

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  const [dashboardStats, setDashboardStats] =
    useState({
      totalTrainees: 0,
      totalAssessors: 0,
      totalAssessments: 0,
      certificatesIssued: 0,
    });

  const [statsLoading, setStatsLoading] =
    useState(true);

  // ==========================================
  // ASSESSMENTS PANEL
  // ==========================================

  const [assessments, setAssessments] =
    useState([]);

  const [assessmentLoading, setAssessmentLoading] =
    useState(true);

  const [assessmentPage, setAssessmentPage] =
    useState(1);

  const assessmentRowsPerPage = 5;

  // ==========================================
  // CERTIFICATE STATUS PANEL
  // ==========================================

  const [certificates, setCertificates] =
    useState([]);

  const [certificateLoading, setCertificateLoading] =
    useState(false);

  const [certificateError, setCertificateError] =
    useState(null);

  const [certificatePage, setCertificatePage] =
    useState(1);

  const certificateRowsPerPage = 5;

  // ==========================================
  // LOAD ADMIN NAME
  // ==========================================

  useEffect(() => {
    const loadAdminName = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Failed to load admin profile:",
            error
          );

          return;
        }

        const name = [
          data?.first_name,
          data?.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        if (name) {
          setAdminName(name);
        }
      } catch (error) {
        console.error(
          "Failed to load admin name:",
          error
        );
      }
    };

    loadAdminName();
  }, []);

  // ==========================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setStatsLoading(true);

        // ------------------------------------------
        // TOTAL TRAINEES
        // ------------------------------------------

        const {
          count: traineeCount,
          error: traineeError,
        } = await supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "trainee");

        if (traineeError) {
          throw traineeError;
        }

        // ------------------------------------------
        // TOTAL ASSESSORS
        // ------------------------------------------

        const {
          count: assessorCount,
          error: assessorError,
        } = await supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "assessor");

        if (assessorError) {
          throw assessorError;
        }

        // ------------------------------------------
        // TOTAL ASSESSMENTS
        //
        // assessment_batches is the same table
        // used by ScheduleAssessmentPage.jsx.
        // ------------------------------------------

        const {
          count: assessmentCount,
          error: assessmentError,
        } = await supabase
          .from("assessment_batches")
          .select("id", {
            count: "exact",
            head: true,
          });

        if (assessmentError) {
          throw assessmentError;
        }

        // ------------------------------------------
        // CERTIFICATES ISSUED
        //
        // Count certificates whose status is Valid.
        // Revoked certificates are not counted as
        // currently valid/issued certificates.
        // ------------------------------------------

        const {
          count: certificateCount,
          error: certificateError,
        } = await supabase
          .from("certificates")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "Valid");

        if (certificateError) {
          throw certificateError;
        }

        setDashboardStats({
          totalTrainees: traineeCount || 0,
          totalAssessors: assessorCount || 0,
          totalAssessments: assessmentCount || 0,
          certificatesIssued: certificateCount || 0,
        });
      } catch (error) {
        console.error(
          "Failed to load dashboard statistics:",
          error
        );

        setDashboardStats({
          totalTrainees: 0,
          totalAssessors: 0,
          totalAssessments: 0,
          certificatesIssued: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  // ==========================================
  // LOAD ASSESSMENTS PANEL
  // ==========================================

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setAssessmentLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from("assessment_batches")
          .select(`
    id,
    assessment_name,
    qualification,
    assessment_type,
    assessment_date,
    start_time,
    end_time,
    created_at
  `)
          .order("assessment_date", {
            ascending: false,
            nullsFirst: false,
          })
          .order("start_time", {
            ascending: true,
            nullsFirst: false,
          });

        if (error) {
          throw error;
        }

        setAssessments(data || []);
      } catch (error) {
        console.error(
          "Failed to load dashboard assessments:",
          error
        );

        setAssessments([]);
      } finally {
        setAssessmentLoading(false);
      }
    };

    loadAssessments();
  }, []);

  // ==========================================
  // LOAD CERTIFICATES
  // ==========================================

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setCertificateLoading(true);
        setCertificateError(null);

        // ------------------------------------------
        // GET CURRENT SESSION
        // ------------------------------------------

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "Your Supabase session is missing. Please log in again."
          );
        }

        // ------------------------------------------
        // LOAD CERTIFICATES
        // ------------------------------------------

        const {
          data: certificateData,
          error: certificatesError,
        } = await supabase
          .from("certificates")
          .select(`
            id,
            certificate_id,
            trainee_id,
            qualification,
            issued_on,
            status,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          });

        if (certificatesError) {
          throw new Error(
            certificatesError.message ||
            "Unable to load certificates from Supabase."
          );
        }

        // ------------------------------------------
        // GET TRAINEE IDS
        // ------------------------------------------

        const traineeIds = [
          ...new Set(
            (certificateData || [])
              .map(
                (certificate) =>
                  certificate.trainee_id
              )
              .filter(Boolean)
          ),
        ];

        // ------------------------------------------
        // LOAD TRAINEE PROFILES
        // ------------------------------------------

        let profiles = [];

        if (traineeIds.length > 0) {
          const {
            data: profileData,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select(`
              id,
              first_name,
              middle_name,
              last_name,
              suffix
            `)
            .in("id", traineeIds);

          if (profileError) {
            console.warn(
              "Unable to load trainee profiles:",
              profileError
            );
          } else {
            profiles = profileData || [];
          }
        }

        // ------------------------------------------
        // PROFILE MAP
        // ------------------------------------------

        const profileMap = new Map(
          profiles.map((profile) => [
            profile.id,
            profile,
          ])
        );

        // ------------------------------------------
        // FORMAT CERTIFICATE DATA
        // ------------------------------------------

        const formattedCertificates =
          (certificateData || []).map(
            (certificate) => {
              const profile =
                profileMap.get(
                  certificate.trainee_id
                );

              const traineeName = [
                profile?.first_name,
                profile?.middle_name,
                profile?.last_name,
                profile?.suffix,
              ]
                .filter(Boolean)
                .join(" ")
                .trim();

              const normalizedStatus =
                String(
                  certificate.status || ""
                )
                  .trim()
                  .toLowerCase();

              // Certificate Status Panel only
              // accepts Valid / Revoked.
              const displayStatus =
                normalizedStatus === "revoked"
                  ? "Revoked"
                  : "Valid";

              return {
                id: certificate.id,

                certificateId:
                  certificate.certificate_id,

                traineeId:
                  certificate.trainee_id,

                traineeName:
                  traineeName || "—",

                course:
                  certificate.qualification ||
                  "—",

                status:
                  displayStatus,

                dateIssued:
                  certificate.issued_on,

                createdAt:
                  certificate.created_at,
              };
            }
          );

        setCertificates(
          formattedCertificates
        );
      } catch (error) {
        console.error(
          "Failed to load certificate status data:",
          error
        );

        setCertificates([]);

        setCertificateError(
          error?.message ||
          "Failed to load certificate status data."
        );
      } finally {
        setCertificateLoading(false);
      }
    };

    loadCertificates();
  }, []);

  // ==========================================
  // ASSESSMENT PAGINATION
  // ==========================================

  const assessmentTotalPages =
    Math.max(
      Math.ceil(
        assessments.length /
        assessmentRowsPerPage
      ),
      1
    );

  const assessmentStartIndex =
    (assessmentPage - 1) *
    assessmentRowsPerPage;

  const assessmentEndIndex =
    assessmentStartIndex +
    assessmentRowsPerPage;

  const paginatedAssessments =
    assessments.slice(
      assessmentStartIndex,
      assessmentEndIndex
    );

  const assessmentShowingStart =
    assessments.length === 0
      ? 0
      : assessmentStartIndex + 1;

  const assessmentShowingEnd =
    Math.min(
      assessmentEndIndex,
      assessments.length
    );

  // ==========================================
  // CERTIFICATE PAGINATION
  // ==========================================

  const certificateTotalPages =
    Math.max(
      Math.ceil(
        certificates.length /
        certificateRowsPerPage
      ),
      1
    );

  // Keep the current page valid if the
  // certificate data changes.
  const safeCertificatePage =
    Math.min(
      Math.max(certificatePage, 1),
      certificateTotalPages
    );

  const certificateStartIndex =
    (safeCertificatePage - 1) *
    certificateRowsPerPage;

  const certificateEndIndex =
    certificateStartIndex +
    certificateRowsPerPage;

  const paginatedCertificates =
    certificates.slice(
      certificateStartIndex,
      certificateEndIndex
    );

  const certificateShowingStart =
    certificates.length === 0
      ? 0
      : certificateStartIndex + 1;

  const certificateShowingEnd =
    Math.min(
      certificateEndIndex,
      certificates.length
    );

  // ==========================================
  // RESET / CLAMP PAGINATION
  // ==========================================

  useEffect(() => {
    setAssessmentPage(1);
  }, [assessments.length]);

  useEffect(() => {
    setCertificatePage((currentPage) =>
      Math.min(
        Math.max(currentPage, 1),
        certificateTotalPages
      )
    );
  }, [certificateTotalPages]);

  // ==========================================
  // CERTIFICATE STATUS STYLE
  // ==========================================

  const getCertificateStatusClass = (
    status
  ) => {
    const normalizedStatus = String(
      status ?? ""
    )
      .toLowerCase()
      .trim();

    if (normalizedStatus === "valid") {
      return "bg-green-100 text-green-700";
    }

    if (normalizedStatus === "revoked") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Welcome, ${adminName}`}
        subtitle="Here is an overview of your platform activity and management tasks."
      />

      {/* ==========================================
          OVERVIEW CARDS
      ========================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          label="Total Trainees"
          value={
            statsLoading
              ? "..."
              : dashboardStats.totalTrainees
          }
          Icon={Users}
          tint="bg-blue-50"
        />

        <Card
          label="Total Assessors"
          value={
            statsLoading
              ? "..."
              : dashboardStats.totalAssessors
          }
          Icon={UserCheck}
          tint="bg-amber-50"
        />

        <Card
          label="Total Assessments"
          value={
            statsLoading
              ? "..."
              : dashboardStats.totalAssessments
          }
          Icon={ClipboardList}
          tint="bg-green-50"
        />

        <Card
          label="Certificates Issued"
          value={
            statsLoading
              ? "..."
              : dashboardStats.certificatesIssued
          }
          Icon={Award}
          tint="bg-purple-50"
        />
      </div>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">

          {/* ==========================================
              ASSESSMENTS PANEL
          ========================================== */}

          <section>
            <h2 className="mb-4 text-1xl font-bold">
              Assessments Panel
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
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
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 text-sm">
                    {assessmentLoading ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Loading assessments...
                        </td>
                      </tr>
                    ) : assessments.length > 0 ? (
                      paginatedAssessments.map(
                        (assessment) => (
                          <tr
                            key={assessment.id}
                            className="transition-colors hover:bg-gray-50/60"
                          >
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {
                                assessment.assessment_name
                              }
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {
                                assessment.qualification
                              }
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {
                                assessment.assessment_type ||
                                "Written"
                              }
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {formatDate(
                                assessment.assessment_date
                              )}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No scheduled assessments
                          found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ==========================================
                    ASSESSMENT PAGINATION
                ========================================== */}

                {assessments.length >
                  assessmentRowsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
                      <p className="font-medium text-gray-700">
                        Showing{" "}
                        {assessmentShowingStart}-
                        {assessmentShowingEnd}{" "}
                        of{" "}
                        {assessments.length}{" "}
                        assessments
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setAssessmentPage(
                              (page) =>
                                Math.max(
                                  page - 1,
                                  1
                                )
                            )
                          }
                          disabled={
                            assessmentPage === 1
                          }
                          className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft
                            size={16}
                          />

                          Prev
                        </button>

                        <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 shadow-sm">
                          {assessmentPage}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setAssessmentPage(
                              (page) =>
                                Math.min(
                                  page + 1,
                                  assessmentTotalPages
                                )
                            )
                          }
                          disabled={
                            assessmentPage >=
                            assessmentTotalPages
                          }
                          className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next

                          <ChevronRight
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </section>

          {/* ==========================================
              CERTIFICATE STATUS PANEL
          ========================================== */}

          <section>
            <h2 className="mb-4 text-1xl font-bold">
              Certificate Status Panel
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-4">
                        Trainee Name
                      </th>

                      <th className="px-6 py-4">
                        Course
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Date Issued
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 text-sm">
                    {certificateLoading ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Loading certificates...
                        </td>
                      </tr>
                    ) : certificateError ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-red-500"
                        >
                          Unable to load certificates.
                        </td>
                      </tr>
                    ) : certificates.length > 0 ? (
                      paginatedCertificates.length > 0 ? (
                        paginatedCertificates.map(
                          (certificate) => (
                            <tr
                              key={certificate.id}
                              className="transition-colors hover:bg-gray-50/60"
                            >
                              <td className="px-6 py-4 text-gray-900">
                                {
                                  certificate.traineeName
                                }
                              </td>

                              <td className="px-6 py-4 text-gray-600">
                                {
                                  certificate.course
                                }
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-4 py-1 font-medium ${getCertificateStatusClass(
                                    certificate.status
                                  )}`}
                                >
                                  {
                                    certificate.status
                                  }
                                </span>
                              </td>

                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(
                                  certificate.dateIssued
                                )}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            No certificates found
                            for this page.
                          </td>
                        </tr>
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No certificates found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ==========================================
                    CERTIFICATE PAGINATION

                    EXACT SAME BEHAVIOR AS ASSESSMENTS:
                    - 5 certificates per page
                    - Hidden when 5 or fewer
                    - Prev / Next
                    - Current page indicator
                    - Showing X-Y of Z
                ========================================== */}

                {certificates.length >
                  certificateRowsPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">
                      <p className="font-medium text-gray-700">
                        Showing{" "}
                        {certificateShowingStart}-
                        {certificateShowingEnd}{" "}
                        of{" "}
                        {certificates.length}{" "}
                        certificates
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCertificatePage(
                              (page) =>
                                Math.max(
                                  page - 1,
                                  1
                                )
                            )
                          }
                          disabled={
                            safeCertificatePage ===
                            1
                          }
                          className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft
                            size={16}
                          />

                          Prev
                        </button>

                        <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 shadow-sm">
                          {safeCertificatePage}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setCertificatePage(
                              (page) =>
                                Math.min(
                                  page + 1,
                                  certificateTotalPages
                                )
                            )
                          }
                          disabled={
                            safeCertificatePage >=
                            certificateTotalPages
                          }
                          className="flex items-center gap-1 text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next

                          <ChevronRight
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </section>
        </div>

        {/* ==========================================
            RIGHT SIDEBAR
        ========================================== */}

        <aside className="space-y-6">


          <section>
            <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">

              {/* ==========================================
        RECENT ACTIVITY HEADER
    ========================================== */}

              <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Clock
                    size={24}
                    className="text-[#001F5B]"
                    strokeWidth={2.2}
                  />
                </div>

                <h2 className="text-l font-bold text-[#001F5B]">
                  Recent Activity
                </h2>
              </div>

              {/* ==========================================
        ACTIVITY LIST
        Only this area scrolls.
        Approximately 2 activity cards visible.
    ========================================== */}

              <div className="max-h-[260px] overflow-y-auto px-5 pb-5 pr-3">
                <div className="space-y-3">

                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                      Loading recent activity...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                      No recent activity.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                      >
                        <div className="flex items-start gap-4">

                          {/* Activity Dot */}
                          <span
                            className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${notification.is_read
                              ? "bg-gray-300"
                              : "bg-[#2563EB]"
                              }`}
                          />

                          <div className="min-w-0 flex-1">

                            {/* Notification Title */}
                            <p className="text-base font-semibold text-[#001F5B]">
                              {notification.title || "Notification"}
                            </p>

                            {/* Notification Message */}
                            <p className="mt-1.5 text-sm leading-6 text-gray-600">
                              {notification.message ||
                                "No additional details available."}
                            </p>

                            {/* Timestamp */}
                            <p className="mt-1.5 text-xs text-gray-400">
                              {notification.created_at
                                ? new Date(
                                  notification.created_at
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                                : "—"}
                            </p>

                          </div>
                        </div>
                      </div>
                    ))
                  )}

                </div>
              </div>
            </div>
          </section>

          {/* ==========================================
              RESULTS OVERVIEW
          ========================================== */}

          <section>
            <h2 className="mb-4 text-1xl font-bold">
              Results Overview
            </h2>

            <div className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
              <div className="space-y-5">
                <p className="text-sm leading-6 text-gray-600">
                  View course-based assessment
                  performance, completion outcomes,
                  and trainee results.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/results")
                  }
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                >
                  View Results Monitoring
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
