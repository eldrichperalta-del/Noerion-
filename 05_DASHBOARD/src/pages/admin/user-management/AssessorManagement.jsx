import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "../../../supabaseClient";

import SearchBar from "../../../components/admin/shared/SearchBar";
import AssessorStatusFilter from "../../../components/admin/assessor-management/AssessorStatusFilter";
import AssessorVerificationFilter from "../../../components/admin/assessor-management/AssessorVerificationFilter";
import AssessorTable from "../../../components/admin/assessor-management/AssessorTable";

function AssessorManagement() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");

  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Assessors from Supabase Profiles Table
  const fetchAssessors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("role", "assessor");

    if (error) {
      console.error("Error fetching assessors:", error.message);
    } else if (data) {
      const formatted = data.map((item) => {
        const rawStatus = item.registration_status || "Pending";

        let status = "Pending";
        let verificationStatus = "Not Verified";

        const lower = rawStatus.toLowerCase().trim();

        if (lower === "active" || lower === "approved") {
          status = "Active";
          verificationStatus = "Verified";
        } else if (lower === "rejected") {
          status = "Rejected";
          verificationStatus = "N/A";
        } else if (lower === "inactive") {
          status = "Inactive";
          verificationStatus = "Verified";
        } else {
          status = "Pending";
          verificationStatus = "Not Verified";
        }

        return {
          ...item,
          id: item.id,
          fullName: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A",
          assessorId: item.assessor_id_number || item.assessor_id || `ASR-${String(item.id).slice(0, 7).toUpperCase()}`,
          email: item.email || "N/A",
          status: status,
          verificationStatus: verificationStatus,
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

  // 2. Approve Assessor (Sets status to Active)
  const handleApprove = async (id) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Active",
        rejected_reason: null,
      })
      .eq("id", id)
      .select();

    if (error) {
      alert(`Failed to approve assessor: ${error.message}`);
    } else if (data && data.length > 0) {
      setAssessors((prev) =>
        prev.map((assessor) =>
          assessor.id === id
            ? {
                ...assessor,
                status: "Active",
                verificationStatus: "Verified",
                registration_status: "Active",
                rejected_reason: null,
              }
            : assessor
        )
      );
    }
  };

  // 3. Reject Assessor (Sets status to Rejected with reason)
  const handleReject = async (id, reason) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Rejected",
        rejected_reason: reason,
      })
      .eq("id", id)
      .select();

    if (error) {
      alert(`Failed to reject assessor: ${error.message}`);
    } else if (data && data.length > 0) {
      setAssessors((prev) =>
        prev.map((assessor) =>
          assessor.id === id
            ? {
                ...assessor,
                status: "Rejected",
                verificationStatus: "N/A",
                registration_status: "Rejected",
                rejected_reason: reason,
              }
            : assessor
        )
      );
    }
  };

  // 4. Deactivate Assessor (Active -> Inactive)
  const handleDeactivate = async (id) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({ registration_status: "Inactive" })
      .eq("id", id)
      .select();

    if (error) {
      alert(`Failed to deactivate: ${error.message}`);
    } else if (data && data.length > 0) {
      setAssessors((prev) =>
        prev.map((assessor) =>
          assessor.id === id
            ? { ...assessor, status: "Inactive", registration_status: "Inactive" }
            : assessor
        )
      );
    }
  };

  // 5. Reactivate Assessor (Inactive -> Active)
  const handleReactivate = async (id) => {
    const { data, error } = await supabase
      .from("profiles")
      .update({ registration_status: "Active" })
      .eq("id", id)
      .select();

    if (error) {
      alert(`Failed to reactivate: ${error.message}`);
    } else if (data && data.length > 0) {
      setAssessors((prev) =>
        prev.map((assessor) =>
          assessor.id === id
            ? { ...assessor, status: "Active", registration_status: "Active" }
            : assessor
        )
      );
    }
  };

  // 6. Delete Assessor
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessor?")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      setAssessors((prev) => prev.filter((assessor) => assessor.id !== id));
    }
  };

  // 7. Frontend Filter Logic
  const filteredAssessors = assessors.filter((assessor) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      assessor.fullName.toLowerCase().includes(searchValue) ||
      assessor.email.toLowerCase().includes(searchValue) ||
      assessor.assessorId.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || assessor.status === statusFilter;

    const matchesVerification =
      verificationFilter === "All" ||
      assessor.verificationStatus === verificationFilter;

    return matchesSearch && matchesStatus && matchesVerification;
  });

  return (
    <div className="p-0">
      {/* Header with restored Add Assessor navigation from v1 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Assessors</h1>
          <p className="text-gray-600">Manage assessor accounts and access</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/user-management/add-assessor")}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-700 px-6 py-3 font-medium text-white transition hover:bg-blue-800 shadow-md self-start sm:self-auto"
        >
          <Plus size={20} />
          Add Assessor
        </button>
      </div>

      {/* Controls Bar */}
      <div className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <SearchBar search={search} setSearch={setSearch} />
          <div className="flex flex-col gap-4 sm:flex-row lg:ml-auto">
            <AssessorStatusFilter value={statusFilter} onChange={setStatusFilter} />
            <AssessorVerificationFilter value={verificationFilter} onChange={setVerificationFilter} />
          </div>
        </div>
      </div>

      {/* Assessors Table */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        {loading ? (
          <div className="py-12 text-center font-medium text-gray-500">
            Loading assessors from database...
          </div>
        ) : (
          <AssessorTable
            assessors={filteredAssessors}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

export default AssessorManagement;
