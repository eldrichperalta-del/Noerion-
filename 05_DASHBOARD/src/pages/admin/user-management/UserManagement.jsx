import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../../../supabaseClient.js";

import RegistrationProfileModal from "../../../components/admin/shared/RegistrationProfileModal.jsx";

function UserManagement() {
  // =========================
  // ACTION MENU STATE
  // =========================

  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  // =========================
  // PROFILE MODAL STATE
  // =========================

  const [selectedProfile, setSelectedProfile] =
    useState(null);

  // =========================
  // LIVE METRICS STATE
  // =========================

  const [metrics, setMetrics] =
    useState({
      trainees: {
        active: 0,
        pending: 0,
      },

      assessors: {
        active: 0,
        pending: 0,
      },
    });

  const [loadingMetrics, setLoadingMetrics] =
    useState(true);

  // =========================
  // RECENT ACTIVITY STATE
  // =========================

  const [recentActivities, setRecentActivities] =
    useState([]);

  const [loadingActivities, setLoadingActivities] =
    useState(true);

  // =========================
  // PAGINATION STATE
  // =========================

  const [currentPage, setCurrentPage] =
    useState(1);

  const rowsPerPage =
    10;

  // =========================
  // CLOSE ACTION MENU OUTSIDE
  // =========================

  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setOpenMenuId(null);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // FETCH LIVE METRICS
  // =========================

  useEffect(() => {
    const fetchLiveMetrics =
      async () => {
        try {
          setLoadingMetrics(true);

          const [
            activeTraineesResult,
            pendingTraineesResult,
            activeAssessorsResult,
            pendingAssessorsResult,
          ] =
            await Promise.all([
              // =====================
              // ACTIVE TRAINEES
              // =====================

              supabase
                .from("profiles")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .ilike(
                  "role",
                  "trainee"
                )
                .in(
                  "registration_status",
                  [
                    "Approved",
                    "Active",
                    "approved",
                    "active",
                  ]
                ),

              // =====================
              // PENDING TRAINEES
              // =====================

              supabase
                .from("profiles")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .ilike(
                  "role",
                  "trainee"
                )
                .in(
                  "registration_status",
                  [
                    "Pending",
                    "pending",
                  ]
                ),

              // =====================
              // ACTIVE ASSESSORS
              // =====================

              supabase
                .from("profiles")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .ilike(
                  "role",
                  "assessor"
                )
                .in(
                  "registration_status",
                  [
                    "Approved",
                    "Active",
                    "approved",
                    "active",
                  ]
                ),

              // =====================
              // PENDING ASSESSORS
              // =====================

              supabase
                .from("profiles")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .ilike(
                  "role",
                  "assessor"
                )
                .in(
                  "registration_status",
                  [
                    "Pending",
                    "pending",
                  ]
                ),
            ]);

          if (
            activeTraineesResult.error
          ) {
            console.error(
              "Error fetching active trainees:",
              activeTraineesResult.error
            );
          }

          if (
            pendingTraineesResult.error
          ) {
            console.error(
              "Error fetching pending trainees:",
              pendingTraineesResult.error
            );
          }

          if (
            activeAssessorsResult.error
          ) {
            console.error(
              "Error fetching active assessors:",
              activeAssessorsResult.error
            );
          }

          if (
            pendingAssessorsResult.error
          ) {
            console.error(
              "Error fetching pending assessors:",
              pendingAssessorsResult.error
            );
          }

          setMetrics({
            trainees: {
              active:
                activeTraineesResult.count ||
                0,

              pending:
                pendingTraineesResult.count ||
                0,
            },

            assessors: {
              active:
                activeAssessorsResult.count ||
                0,

              pending:
                pendingAssessorsResult.count ||
                0,
            },
          });
        } catch (
        error
        ) {
          console.error(
            "Unexpected error fetching live metrics:",
            error
          );
        } finally {
          setLoadingMetrics(false);
        }
      };

    fetchLiveMetrics();
  }, []);

  // =========================
  // FETCH RECENT ACTIVITY
  // =========================

  useEffect(() => {
    const fetchRecentActivities =
      async () => {
        try {
          setLoadingActivities(true);

          const {
            data,
            error,
          } =
            await supabase
              .from("profiles")
              .select(`
                id,
                first_name,
                middle_name,
                last_name,
                suffix,
                email,
                role,
                registration_status,
                is_approved,
                created_at,
                rejected_reason,
                profile_photo_url,
                gender,
                date_of_birth,
                contact_number,

                assessor_profiles (
                  assessor_id_number,
                  qualification_specialization,
                  assessment_center,
                  years_of_experience,
                  accreditation_cert_url,
                  government_id_url
                )
              `)
              .in(
                "role",
                [
                  "trainee",
                  "assessor",
                ]
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            error
          ) {
            console.error(
              "Error fetching recent activity:",
              error
            );

            return;
          }

          console.log(
            "RECENT ACTIVITY RAW DATA:",
            data
          );

          const formattedActivities =
            data?.map(
              (profile) => {
                // =================================
                // GET ASSESSOR PROFILE
                //
                // Supports either object or array
                // =================================

                const assessorProfile =
                  Array.isArray(
                    profile.assessor_profiles
                  )
                    ? profile
                      .assessor_profiles[0] ||
                    null
                    : profile.assessor_profiles ||
                    null;

                // =================================
                // NORMALIZE STATUS
                // =================================

                const rawStatus =
                  profile.registration_status ||
                  "Pending";

                const normalizedStatus =
                  String(
                    rawStatus
                  )
                    .toLowerCase()
                    .trim();

                let status =
                  "Pending";

                if (
                  normalizedStatus.includes(
                    "approved"
                  ) ||
                  normalizedStatus.includes(
                    "active"
                  )
                ) {
                  status =
                    "Approved";
                } else if (
                  normalizedStatus.includes(
                    "reject"
                  )
                ) {
                  status =
                    "Rejected";
                } else if (
                  normalizedStatus.includes(
                    "deactiv"
                  ) ||
                  normalizedStatus.includes(
                    "inactiv"
                  )
                ) {
                  status =
                    "Deactivated";
                }

                // =================================
                // RETURN FLATTENED PROFILE
                //
                // IMPORTANT:
                //
                // The document fields are placed
                // directly on the activity object
                // so RegistrationProfileModal can
                // access them easily.
                // =================================

                return {
                  ...profile,

                  // =============================
                  // REMOVE NESTED DATA
                  // =============================

                  assessor_profiles:
                    assessorProfile,

                  // =============================
                  // BASIC PROFILE
                  // =============================

                  name:
                    `${profile.first_name || ""} ${profile.last_name || ""
                      }`.trim() ||
                    "Unknown User",

                  date:
                    profile.created_at
                      ? new Date(
                        profile.created_at
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",

                          day:
                            "numeric",

                          year:
                            "numeric",
                        }
                      )
                      : "N/A",

                  status,

                  type:
                    profile.role,

                  // =============================
                  // ASSESSOR INFORMATION
                  // =============================

                  assessor_id_number:
                    assessorProfile
                      ?.assessor_id_number ||
                    null,

                  qualification_specialization:
                    assessorProfile
                      ?.qualification_specialization ||
                    null,

                  assessment_center:
                    assessorProfile
                      ?.assessment_center ||
                    null,

                  years_of_experience:
                    assessorProfile
                      ?.years_of_experience ||
                    null,

                  // =============================
                  // SUPPORTING DOCUMENTS
                  // =============================

                  accreditation_cert_url:
                    assessorProfile
                      ?.accreditation_cert_url ||
                    null,

                  government_id_url:
                    assessorProfile
                      ?.government_id_url ||
                    null,
                };
              }
            ) || [];

          console.log(
            "FORMATTED RECENT ACTIVITIES:",
            formattedActivities
          );

          setRecentActivities(
            formattedActivities
          );

          setCurrentPage(
            1
          );
        } catch (
        error
        ) {
          console.error(
            "Unexpected error fetching recent activity:",
            error
          );
        } finally {
          setLoadingActivities(
            false
          );
        }
      };

    fetchRecentActivities();
  }, []);

  // =========================
  // PAGINATION COMPUTATIONS
  // =========================

  const totalPages =
    Math.max(
      Math.ceil(
        recentActivities.length /
        rowsPerPage
      ),
      1
    );

  const startIndex =
    (currentPage - 1) *
    rowsPerPage;

  const endIndex =
    startIndex +
    rowsPerPage;

  const paginatedActivities =
    recentActivities.slice(
      startIndex,
      endIndex
    );

  const showingStart =
    recentActivities.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd =
    Math.min(
      endIndex,
      recentActivities.length
    );

  // =========================
  // VIEW PROFILE
  // =========================

  const handleViewProfile =
    (activity) => {
      console.log(
        "SELECTED PROFILE:",
        activity
      );

      console.log(
        "PROFILE PHOTO:",
        activity.profile_photo_url
      );

      console.log(
        "ACCREDITATION CERTIFICATE:",
        activity.accreditation_cert_url
      );

      console.log(
        "GOVERNMENT ID:",
        activity.government_id_url
      );

      setSelectedProfile(
        activity
      );

      setOpenMenuId(
        null
      );
    };

  // =========================
  // CLOSE PROFILE MODAL
  // =========================

  const handleCloseProfile =
    () => {
      setSelectedProfile(
        null
      );
    };

  // =========================
  // PAGE RENDER
  // =========================

  return (
    <div className="min-h-screen px-6 py-0">

      {/* =====================
          PAGE HEADER
      ===================== */}

      <div className="relative mb-12 text-left">

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          User Management
        </h1>

        <p className="mt-2 text-gray-500">
          Manage trainee and assessor accounts
          across the platform.
        </p>

      </div>

      {/* =====================
          USER MANAGEMENT CARDS
      ===================== */}

      <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2">

        {/* =====================
            TRAINEES CARD
        ===================== */}

        <div className="flex flex-col gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                TRAINEES
              </h2>

              <p className="mt-3 text-lg text-gray-600">
                Manage trainee accounts and approvals.
              </p>

            </div>

            <Users
              size={64}
              className="text-slate-800"
            />

          </div>

          <div>

            <h4 className="mb-4 text-lg font-bold text-gray-900">
              Live Metrics
            </h4>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">

                <span className="block text-3xl font-bold text-gray-900">
                  {loadingMetrics
                    ? "..."
                    : metrics
                      .trainees
                      .active}
                </span>

                <span className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">

                  Active

                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                </span>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">

                <span className="block text-3xl font-bold text-gray-900">
                  {loadingMetrics
                    ? "..."
                    : metrics
                      .trainees
                      .pending}
                </span>

                <span className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">

                  Pending Approval

                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />

                </span>

              </div>

            </div>

          </div>

          <Link
            to="/admin/user-management/trainees"
            className="mt-auto block w-full rounded-xl bg-[#002f86] py-3 text-center text-lg font-semibold text-white transition-all duration-300 hover:bg-[#001f5a] active:bg-[#001f5a]"
          >
            Manage Trainees
          </Link>

        </div>

        {/* =====================
            ASSESSORS CARD
        ===================== */}

        <div className="flex flex-col gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                ASSESSORS
              </h2>

              <p className="mt-3 text-lg text-gray-600">
                Manage assessors and evaluation roles.
              </p>

            </div>

            <UserCheck
              size={64}
              className="text-slate-800"
            />

          </div>

          <div>

            <h4 className="mb-4 text-lg font-bold text-gray-900">
              Live Metrics
            </h4>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">

                <span className="block text-3xl font-bold text-gray-900">
                  {loadingMetrics
                    ? "..."
                    : metrics
                      .assessors
                      .active}
                </span>

                <span className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">

                  Active

                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                </span>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">

                <span className="block text-3xl font-bold text-gray-900">
                  {loadingMetrics
                    ? "..."
                    : metrics
                      .assessors
                      .pending}
                </span>

                <span className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">

                  Pending Approval

                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />

                </span>

              </div>

            </div>

          </div>

          <Link
            to="/admin/user-management/assessors"
            className="mt-auto block w-full rounded-xl bg-[#002f86] py-3 text-center text-lg font-semibold text-white transition-all duration-300 hover:bg-[#001f5a] active:bg-[#001f5a]"
          >
            Manage Assessors
          </Link>

        </div>

      </div>

      {/* =====================
          RECENT ACTIVITY TABLE
      ===================== */}

      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.20)]">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

          <h3 className="text-2xl font-bold text-gray-900">
            RECENT ACTIVITY
          </h3>

          <div className="text-gray-500">
            Recent user registrations
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full table-fixed">

            <colgroup>

              <col className="w-[25%]" />

              <col className="w-[18%]" />

              <col className="w-[20%]" />

              <col className="w-[20%]" />

              <col className="w-[17%]" />

            </colgroup>

            <thead className="bg-gray-200">

              <tr>

                <th className="px-4 py-4 text-center font-bold text-gray-900">
                  Name
                </th>

                <th className="px-4 py-4 text-center font-bold text-gray-900">
                  Role
                </th>

                <th className="px-4 py-4 text-center font-bold text-gray-900">
                  Date
                </th>

                <th className="px-4 py-4 text-center font-bold text-gray-900">
                  Status
                </th>

                <th className="px-4 py-4 text-center font-bold text-gray-900">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loadingActivities ? (

                <tr>

                  <td
                    colSpan="5"
                    className="py-10 text-center text-gray-500"
                  >
                    Loading recent activity...
                  </td>

                </tr>

              ) : paginatedActivities.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="py-10 text-center text-gray-500"
                  >
                    No recent user activity found.
                  </td>

                </tr>

              ) : (

                paginatedActivities.map(
                  (
                    activity
                  ) => (

                    <tr
                      key={
                        activity.id
                      }
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-100"
                    >

                      <td className="px-4 py-4 text-center capitalize text-gray-600">
                        {
                          activity.name
                        }
                      </td>

                      <td className="px-4 py-5 text-center capitalize text-gray-600">
                        {
                          activity.role
                        }
                      </td>

                      <td className="px-4 py-5 text-center text-gray-600">
                        {
                          activity.date
                        }
                      </td>

                      <td className="px-4 py-5 text-center">

                        <div className="flex items-center">

                          <span
                            className={
                              activity.status ===
                                "Pending"
                                ? "rounded-lg bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800"
                                : activity.status ===
                                  "Approved" ||
                                  activity.status ===
                                  "Active"
                                  ? "rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
                                  : activity.status ===
                                    "Rejected"
                                    ? "rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-800"
                                    : "rounded-lg bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-800"
                            }
                          >
                            {
                              activity.status
                            }
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-5">

                        <div
                          ref={
                            openMenuId ===
                              activity.id
                              ? menuRef
                              : null
                          }
                          className="relative flex items-center"
                        >

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  activity.id
                                  ? null
                                  : activity.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-blue-100 hover:text-blue-600"
                            aria-label="Open user actions"
                          >

                            <span className="flex flex-col gap-1">

                              <span className="h-1 w-1 rounded-full bg-current" />

                              <span className="h-1 w-1 rounded-full bg-current" />

                              <span className="h-1 w-1 rounded-full bg-current" />

                            </span>

                          </button>

                          {openMenuId ===
                            activity.id && (

                              <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewProfile(
                                      activity
                                    )
                                  }
                                  className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                                >
                                  View Profile
                                </button>

                              </div>

                            )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

          {/* =====================
              PAGINATION FOOTER
          ===================== */}

          {!loadingActivities &&
            recentActivities.length >
            0 && (

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

                <p className="font-medium text-gray-700">

                  Showing {
                    showingStart
                  }-
                  {
                    showingEnd
                  }{" "}
                  of {
                    recentActivities.length
                  }{" "}
                  recent registrations

                </p>

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          page
                        ) =>
                          Math.max(
                            page -
                            1,
                            1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex items-center gap-1 text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <ChevronLeft
                      size={
                        16
                      }
                    />

                    Prev

                  </button>

                  <span className="rounded-lg border border-gray-200 px-3 py-2 font-semibold text-[#15294b] shadow-sm">

                    {
                      currentPage
                    }

                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (
                          page
                        ) =>
                          Math.min(
                            page +
                            1,
                            totalPages
                          )
                      )
                    }
                    disabled={
                      currentPage >=
                      totalPages
                    }
                    className="flex items-center gap-1 text-gray-500 transition hover:text-[#15294b] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    Next

                    <ChevronRight
                      size={
                        16
                      }
                    />

                  </button>

                </div>

              </div>

            )}

        </div>

      </div>

      {/* =====================
          PROFILE MODAL
      ===================== */}

      {selectedProfile && (

        <RegistrationProfileModal
          profile={
            selectedProfile
          }
          title={
            selectedProfile.role ===
              "assessor"
              ? "Assessor Profile"
              : "Trainee Profile"
          }
          onClose={
            handleCloseProfile
          }
          onApprove={() => { }}
          onReject={() => { }}
        />

      )}

    </div>
  );
}

export default UserManagement;
