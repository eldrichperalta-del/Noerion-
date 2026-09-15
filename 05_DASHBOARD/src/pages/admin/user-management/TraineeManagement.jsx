import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  supabase,
} from "../../../supabaseClient";

import {
  notifyTrainee,
} from "../../../services/notificationService";

import SearchBar from "../../../components/admin/shared/SearchBar";

import StatusFilter from "../../../components/admin/trainee-management/StatusFilter";

import VerificationFilter from "../../../components/admin/trainee-management/VerificationFilter";

import TraineeTable from "../../../components/admin/trainee-management/TraineeTable";

function TraineeManagement() {
  const navigate = useNavigate();
  // ==========================================
  // STATE
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    verificationFilter,
    setVerificationFilter,
  ] = useState("All");

  const [
    trainees,
    setTrainees,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ==========================================
  // CUSTOM ACTION CONFIRMATION MODAL STATE
  // ==========================================

  const [
    actionModal,
    setActionModal,
  ] = useState(null);

  const [
    processingAction,
    setProcessingAction,
  ] = useState(false);

  // ==========================================
  // FETCH TRAINEES
  // ==========================================

  const fetchTrainees =
    async () => {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select(`
            *,
            trainee_profiles!user_id(*)
          `)
          .ilike(
            "role",
            "trainee"
          );

      if (error) {
        console.error(
          "Error fetching trainees:",
          error.message
        );

        setLoading(false);

        return;
      }

      if (data) {
        const formatted =
          data.map(
            (item) => {
              const training =
                Array.isArray(
                  item.trainee_profiles
                )
                  ? item.trainee_profiles[0]
                  : item.trainee_profiles;

              const rawStatus =
                item.registration_status ||
                "Pending";

              const normalizedStatus =
                String(
                  rawStatus
                )
                  .toLowerCase()
                  .trim();

              let status =
                "Pending";

              let verificationStatus =
                "Not Verified";

              // ==================================
              // STATUS MAPPING
              // ==================================

              if (
                normalizedStatus.includes(
                  "approved"
                )
              ) {
                status =
                  "Approved";

                verificationStatus =
                  "Verified";
              } else if (
                normalizedStatus.includes(
                  "reject"
                )
              ) {
                status =
                  "Rejected";

                verificationStatus =
                  "N/A";
              } else if (
                normalizedStatus.includes(
                  "deactiv"
                )
              ) {
                status =
                  "Deactivated";

                verificationStatus =
                  "Deactivated";
              }

              return {
                ...item,
                ...(training || {}),

                profile_photo_url:
                  item.profile_photo_url || null,

                id:
                  item.id,

                fullName:
                  `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                  "N/A",

                traineeId:
                  item.trainee_id ||
                  `TRN-${item.id.slice(0, 7).toUpperCase()}`,

                email:
                  item.email || "N/A",

                status,

                verificationStatus,

                rejected_reason:
                  item.rejected_reason || null,
              };
            }
          );

        setTrainees(
          formatted
        );
      }

      setLoading(false);
    };

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    fetchTrainees();
  }, []);

  // ==========================================
  // APPROVE TRAINEE
  // ==========================================

  const handleApprove =
    async (id) => {
      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            registration_status:
              "Approved",

            rejected_reason:
              null,
          })
          .eq(
            "id",
            id
          );

      if (error) {
        alert(
          `Failed to approve: ${error.message}`
        );

        return;
      }

      // ========================================
      // SEND APPROVAL NOTIFICATION
      // ========================================

      await notifyTrainee({
        traineeId: id,
        type: "user_registration",
        title: "Registration Approved",
        message:
          "Your trainee registration has been approved. You can now access your trainee account.",
        relatedId: id,
        relatedType: "user_registration",
      });

      // ========================================
      // UPDATE LOCAL STATE
      // ========================================

      setTrainees(
        (prev) =>
          prev.map(
            (trainee) =>
              trainee.id === id
                ? {
                  ...trainee,

                  status:
                    "Approved",

                  verificationStatus:
                    "Verified",

                  registration_status:
                    "Approved",

                  rejected_reason:
                    null,
                }
                : trainee
          )
      );
    };
  // ==========================================
  // REJECT TRAINEE
  // ==========================================

  const handleReject =
    async (
      id,
      rejectionReason
    ) => {
      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            registration_status:
              "Rejected",

            rejected_reason:
              rejectionReason,
          })
          .eq(
            "id",
            id
          );

      if (error) {
        alert(
          `Failed to reject: ${error.message}`
        );

        return;
      }

      // ========================================
      // SEND REJECTION NOTIFICATION
      // ========================================

      await notifyTrainee({
        traineeId: id,
        type: "user_registration",
        title: "Registration Rejected",
        message:
          `Your trainee registration has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        relatedId: id,
        relatedType: "user_registration",
      });

      setTrainees(
        (prev) =>
          prev.map(
            (trainee) =>
              trainee.id === id
                ? {
                  ...trainee,

                  status:
                    "Rejected",

                  verificationStatus:
                    "N/A",

                  registration_status:
                    "Rejected",

                  rejected_reason:
                    rejectionReason,
                }
                : trainee
          )
      );
    };
  // ==========================================
  // OPEN DEACTIVATE MODAL
  // ==========================================

  const handleDeactivate =
    (id) => {
      const trainee =
        trainees.find(
          (item) =>
            item.id === id
        );

      if (!trainee) {
        return;
      }

      setActionModal({
        type:
          "deactivate",

        trainee,
      });
    };

  // ==========================================
  // OPEN REACTIVATE MODAL
  // ==========================================

  const handleReactivate =
    (id) => {
      const trainee =
        trainees.find(
          (item) =>
            item.id === id
        );

      if (!trainee) {
        return;
      }

      setActionModal({
        type:
          "reactivate",

        trainee,
      });
    };

  // ==========================================
  // CLOSE ACTION MODAL
  // ==========================================

  const handleCloseActionModal =
    () => {
      if (
        processingAction
      ) {
        return;
      }

      setActionModal(
        null
      );
    };

  // ==========================================
  // CONFIRM DEACTIVATE
  // ==========================================

  const confirmDeactivate =
    async () => {
      if (
        !actionModal?.trainee
      ) {
        return;
      }

      const id =
        actionModal.trainee.id;

      setProcessingAction(
        true
      );

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            registration_status:
              "Deactivated",
          })
          .eq(
            "id",
            id
          );

      if (error) {
        console.error(
          "Failed to deactivate trainee:",
          error.message
        );

        alert(
          `Failed to deactivate trainee: ${error.message}`
        );

        setProcessingAction(
          false
        );

        return;
      }

      // ========================================
      // UPDATE UI IMMEDIATELY
      // ========================================

      setTrainees(
        (prev) =>
          prev.map(
            (trainee) =>
              trainee.id === id
                ? {
                  ...trainee,

                  status:
                    "Deactivated",

                  verificationStatus:
                    "Deactivated",

                  registration_status:
                    "Deactivated",
                }
                : trainee
          )
      );

      setProcessingAction(
        false
      );

      setActionModal(
        null
      );
    };

  // ==========================================
  // CONFIRM REACTIVATE
  // ==========================================

  const confirmReactivate =
    async () => {
      if (
        !actionModal?.trainee
      ) {
        return;
      }

      const id =
        actionModal.trainee.id;

      setProcessingAction(
        true
      );

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            registration_status:
              "Approved",

            rejected_reason:
              null,
          })
          .eq(
            "id",
            id
          );

      if (error) {
        console.error(
          "Failed to reactivate trainee:",
          error.message
        );

        alert(
          `Failed to reactivate trainee: ${error.message}`
        );

        setProcessingAction(
          false
        );

        return;
      }

      // ========================================
      // UPDATE UI IMMEDIATELY
      // ========================================

      setTrainees(
        (prev) =>
          prev.map(
            (trainee) =>
              trainee.id === id
                ? {
                  ...trainee,

                  status:
                    "Approved",

                  verificationStatus:
                    "Verified",

                  registration_status:
                    "Approved",

                  rejected_reason:
                    null,
                }
                : trainee
          )
      );

      setProcessingAction(
        false
      );

      setActionModal(
        null
      );
    };

  // ==========================================
  // CONFIRM CURRENT ACTION
  // ==========================================

  const handleConfirmAction =
    async () => {
      if (
        actionModal?.type ===
        "deactivate"
      ) {
        await confirmDeactivate();

        return;
      }

      if (
        actionModal?.type ===
        "reactivate"
      ) {
        await confirmReactivate();
      }
    };

  // ==========================================
  // FILTER TRAINEES
  // ==========================================

  const filteredTrainees =
    trainees.filter(
      (trainee) => {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          trainee.fullName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          trainee.email
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          trainee.traineeId
            .toLowerCase()
            .includes(
              searchValue
            );

        const matchesStatus =
          statusFilter ===
          "All" ||
          trainee.status ===
          statusFilter;

        const matchesVerification =
          verificationFilter ===
          "All" ||
          trainee.verificationStatus ===
          verificationFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesVerification
        );
      }
    );

  // ==========================================
  // MODAL VALUES
  // ==========================================

  const isDeactivateAction =
    actionModal?.type ===
    "deactivate";

  const actionTitle =
    isDeactivateAction
      ? "Deactivate Trainee?"
      : "Reactivate Trainee?";

  const actionDescription =
    isDeactivateAction
      ? "This trainee account will be deactivated and the trainee will no longer have access to active trainee functions."
      : "This trainee account will be reactivated and returned to an approved status.";

  const confirmButtonText =
    isDeactivateAction
      ? "Deactivate"
      : "Reactivate";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div
        className="
          p-0
        "
      >
        {/* ======================================
    BREADCRUMBS
======================================= */}

        <nav className="mt-1 mb-3 flex items-center gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/user-management")
            }
            className="text-gray-500 hover:text-[#002f86] hover:underline"
          >
            User Management
          </button>

          <span className="text-gray-400">
            &gt;
          </span>

          <span className="text-[#002f86]">
            Trainee Management
          </span>
        </nav>

        {/* ======================================
    PAGE HEADER
======================================= */}

        <div
          className="
    mb-6
  "
        >
          <h1
            className="
      text-4xl
      font-bold
      text-gray-900
    "
          >
            Trainees
          </h1>

          <p
            className="
      text-gray-600
    "
          >
            Manage and review
            trainee accounts
          </p>
        </div>

        {/* ======================================
            SEARCH AND FILTERS
        ======================================= */}

        <div
          className="
            mb-5
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
            "
          >
            <SearchBar
              search={
                search
              }
              setSearch={
                setSearch
              }
            />

            <div
              className="
    flex
    flex-col
    gap-4
    sm:flex-row
    lg:ml-auto
  "
            >
              <StatusFilter
                value={
                  statusFilter
                }
                onChange={
                  setStatusFilter
                }
              />


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/user-management/add-trainee"
                  )
                }
                className="
      inline-flex
      items-center
      justify-center
      rounded-lg
      bg-[#15294b]
      px-5
      py-2.5
      text-sm
      font-semibold
      text-white
      shadow-sm
      transition
      hover:bg-[#0f1f3a]
      focus:outline-none
      focus:ring-2
      focus:ring-[#15294b]
      focus:ring-offset-2
    "
              >
                + Add Trainee
              </button>
            </div>
          </div>
        </div>

        {/* ======================================
            TABLE CONTAINER
        ======================================= */}

        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
          {loading ? (
            <div
              className="
                py-12
                text-center
                font-medium
                text-gray-500
              "
            >
              Loading trainees
              from database...
            </div>
          ) : (
            <TraineeTable
              trainees={
                filteredTrainees
              }
              onApprove={
                handleApprove
              }
              onReject={
                handleReject
              }
              onDeactivate={
                handleDeactivate
              }
              onReactivate={
                handleReactivate
              }
            />
          )}
        </div>
      </div>

      {/* ======================================
          CUSTOM DEACTIVATE / REACTIVATE MODAL
      ======================================= */}

      {actionModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-xl
              bg-white
              shadow-2xl
            "
          >
            {/* ==================================
                MODAL HEADER
            =================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                bg-[#15294b]
                px-6
                py-4
                text-white
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <AlertTriangle
                  size={20}
                  className="
                    text-white
                  "
                />

                <h2
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  Confirmation
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseActionModal
                }
                disabled={
                  processingAction
                }
                className="
                  transition
                  hover:text-red-300
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                aria-label="
                  Close confirmation dialog
                "
              >
                <X
                  size={20}
                />
              </button>
            </div>

            {/* ==================================
                MODAL CONTENT
            =================================== */}

            <div
              className="
                px-6
                py-6
              "
            >
              <h3
                className="
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                {actionTitle}
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-600
                "
              >
                {actionDescription}
              </p>

              {/* TRAINEE DETAILS */}

              <div
                className="
                  mt-5
                  rounded-lg
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-gray-500
                  "
                >
                  Trainee
                </p>

                <p
                  className="
                    mt-1
                    font-semibold
                    text-gray-900
                  "
                >
                  {
                    actionModal
                      .trainee
                      .fullName
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-600
                  "
                >
                  {
                    actionModal
                      .trainee
                      .email
                  }
                </p>
              </div>

              {/* ==================================
                  MODAL ACTIONS
              =================================== */}

              <div
                className="
                  mt-6
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-gray-200
                  pt-5
                "
              >
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    handleCloseActionModal
                  }
                  disabled={
                    processingAction
                  }
                  className="
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-700
                    shadow-sm
                    transition
                    hover:bg-gray-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                {/* CONFIRM */}

                <button
                  type="button"
                  onClick={
                    handleConfirmAction
                  }
                  disabled={
                    processingAction
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    disabled:cursor-not-allowed
                    disabled:opacity-60

                    ${isDeactivateAction
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#15294b] hover:bg-[#0f1f3a]"
                    }
                  `}
                >
                  {processingAction && (
                    <RefreshCw
                      size={16}
                      className="
                        animate-spin
                      "
                    />
                  )}

                  {processingAction
                    ? isDeactivateAction
                      ? "Deactivating..."
                      : "Reactivating..."
                    : confirmButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TraineeManagement;