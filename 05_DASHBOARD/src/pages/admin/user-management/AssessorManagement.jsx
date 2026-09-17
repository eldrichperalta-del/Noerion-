import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "../../../supabaseClient";

import SearchBar from "../../../components/admin/shared/SearchBar";
import AssessorStatusFilter from "../../../components/admin/assessor-management/AssessorStatusFilter";
import AssessorTable from "../../../components/admin/assessor-management/AssessorTable";

function AssessorManagement() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Deactivate / Reactivate
  const [actionModal, setActionModal] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // ==========================================
  // FETCH ASSESSORS
  // ==========================================
  const fetchAssessors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("role", "assessor");

    if (error) {
      console.error("Error fetching assessors:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const formatted = data.map((item) => {
        const rawStatus = item.registration_status || "Pending";
        const normalizedStatus = String(rawStatus).toLowerCase().trim();

        let status = "Pending";
        let verificationStatus = "Not Verified";

        if (normalizedStatus === "approved") {
          status = "Approved";
          verificationStatus = "Verified";
        } else if (normalizedStatus === "rejected") {
          status = "Rejected";
          verificationStatus = "N/A";
        } else if (normalizedStatus === "deactivated") {
          status = "Deactivated";
          verificationStatus = "Deactivated";
        }

        return {
          ...item,
          id: item.id,
          fullName:
            `${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A",
          assessorId:
            item.assessor_id_number ||
            item.assessor_id ||
            `ASR-${String(item.id).slice(0, 7).toUpperCase()}`,
          email: item.email || "N/A",
          status,
          verificationStatus,
          registration_status: rawStatus,
          rejected_reason: item.rejected_reason || null,
        };
      });

      setAssessors(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssessors();
  }, []);

  // ==========================================
  // APPROVE ASSESSOR
  // ==========================================
  const handleApprove = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Approved",
        rejected_reason: null,
      })
      .eq("id", id);

    if (error) {
      alert(`Failed to approve: ${error.message}`);
      return;
    }

    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
            ...assessor,
            status: "Approved",
            verificationStatus: "Verified",
            registration_status: "Approved",
            rejected_reason: null,
          }
          : assessor
      )
    );
  };

  // ==========================================
  // REJECT ASSESSOR
  // ==========================================
  const handleReject = async (id, rejectionReason) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Rejected",
        rejected_reason: rejectionReason,
      })
      .eq("id", id);

    if (error) {
      alert(`Failed to reject: ${error.message}`);
      return;
    }

    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
            ...assessor,
            status: "Rejected",
            verificationStatus: "N/A",
            registration_status: "Rejected",
            rejected_reason: rejectionReason,
          }
          : assessor
      )
    );
  };

  // ==========================================
  // OPEN MODALS
  // ==========================================
  const handleDeactivate = (id) => {
    const assessor = assessors.find((item) => item.id === id);
    if (!assessor) return;
    setActionModal({ type: "deactivate", assessor });
  };

  const handleReactivate = (id) => {
    const assessor = assessors.find((item) => item.id === id);
    if (!assessor) return;
    setActionModal({ type: "reactivate", assessor });
  };

  const handleCloseActionModal = () => {
    if (processingAction) return;
    setActionModal(null);
  };

  // ==========================================
  // CONFIRM DEACTIVATE
  // ==========================================
  const confirmDeactivate = async () => {
    if (!actionModal?.assessor) return;
    const id = actionModal.assessor.id;

    setProcessingAction(true);

    const { error } = await supabase
      .from("profiles")
      .update({ registration_status: "Deactivated" })
      .eq("id", id);

    if (error) {
      console.error("Failed to deactivate assessor:", error.message);
      alert(`Failed to deactivate assessor: ${error.message}`);
      setProcessingAction(false);
      return;
    }

    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
            ...assessor,
            status: "Deactivated",
            verificationStatus: "Deactivated",
            registration_status: "Deactivated",
          }
          : assessor
      )
    );

    setProcessingAction(false);
    setActionModal(null);
  };

  // ==========================================
  // CONFIRM REACTIVATE
  // ==========================================
  const confirmReactivate = async () => {
    if (!actionModal?.assessor) return;
    const id = actionModal.assessor.id;

    setProcessingAction(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Approved",
        rejected_reason: null,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to reactivate assessor:", error.message);
      alert(`Failed to reactivate assessor: ${error.message}`);
      setProcessingAction(false);
      return;
    }

    setAssessors((prev) =>
      prev.map((assessor) =>
        assessor.id === id
          ? {
            ...assessor,
            status: "Approved",
            verificationStatus: "Verified",
            registration_status: "Approved",
            rejected_reason: null,
          }
          : assessor
      )
    );

    setProcessingAction(false);
    setActionModal(null);
  };

  const handleConfirmAction = async () => {
    if (actionModal?.type === "deactivate") {
      await confirmDeactivate();
    } else if (actionModal?.type === "reactivate") {
      await confirmReactivate();
    }
  };

  // ==========================================
  // FILTER ASSESSORS
  // ==========================================
  const filteredAssessors = assessors.filter((assessor) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      assessor.fullName.toLowerCase().includes(searchValue) ||
      assessor.email.toLowerCase().includes(searchValue) ||
      assessor.assessorId.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || assessor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // MODAL VALUES
  // ==========================================
  const isDeactivateAction = actionModal?.type === "deactivate";

  const actionTitle = isDeactivateAction
    ? "Deactivate Assessor?"
    : "Reactivate Assessor?";

  const actionDescription = isDeactivateAction
    ? "This assessor account will be deactivated and the assessor will no longer have active system access."
    : "This assessor account will be reactivated and returned to an approved status.";

  const confirmButtonText = isDeactivateAction ? "Deactivate" : "Reactivate";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <div className="p-0">
        {/* BREADCRUMBS */}
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
            Assessor Management
          </span>
        </nav>

        {/* PAGE HEADER */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">
            Assessors
          </h1>

          <p className="text-gray-600">
            Manage assessor accounts and access
          </p>
        </div>

        {/* SEARCH, STATUS FILTER, AND ADD ASSESSOR BUTTON */}
        <div className="mb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">

            {/* LEFT CONTROL: SEARCH */}
            <div className="flex-1 max-w-md">
              <SearchBar
                search={search}
                setSearch={setSearch}
              />
            </div>

            {/* RIGHT CONTROLS: STATUS FILTER & ADD ASSESSOR */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <AssessorStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
              />

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/user-management/add-assessor")
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
                + Add Assessor
              </button>

            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.20)]">
          {loading ? (
            <div className="py-12 text-center font-medium text-gray-500">
              Loading assessors from database...
            </div>
          ) : (
            <AssessorTable
              assessors={filteredAssessors}
              onApprove={handleApprove}
              onReject={handleReject}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
          )}
        </div>
      </div >

      {/* CONFIRMATION MODAL */}
      {
        actionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between bg-[#15294b] px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-white" />
                  <h2 className="text-lg font-semibold">Confirmation</h2>
                </div>

                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  disabled={processingAction}
                  className="transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close confirmation dialog"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-6">
                <h3 className="text-lg font-bold text-gray-900">{actionTitle}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {actionDescription}
                </p>

                <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Assessor
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {actionModal.assessor.fullName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {actionModal.assessor.email}
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
                  <button
                    type="button"
                    onClick={handleCloseActionModal}
                    disabled={processingAction}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={processingAction}
                    className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${isDeactivateAction
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#15294b] hover:bg-[#0f1f3a]"
                      }`}
                  >
                    {processingAction && (
                      <RefreshCw size={16} className="animate-spin" />
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
        )
      }
    </>
  );
}

export default AssessorManagement;