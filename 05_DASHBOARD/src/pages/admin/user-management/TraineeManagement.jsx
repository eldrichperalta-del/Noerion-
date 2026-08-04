import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

import SearchBar from "../../../components/admin/shared/SearchBar";
import StatusFilter from "../../../components/admin/trainee-management/StatusFilter";
import VerificationFilter from "../../../components/admin/trainee-management/VerificationFilter";
import TraineeTable from "../../../components/admin/trainee-management/TraineeTable";

function TraineeManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");

  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Trainees from Profiles
  const fetchTrainees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, trainee_profiles(*)")
      .ilike("role", "trainee");

    if (error) {
      console.error("Error fetching trainees:", error.message);
    } else if (data) {
      const formatted = data.map((item) => {
        const training = Array.isArray(item.trainee_profiles)
          ? item.trainee_profiles[0]
          : item.trainee_profiles;

        const rawStatus = item.registration_status || "Pending";

        let status = "Pending";
        let verificationStatus = "Not Verified";

        if (rawStatus.toLowerCase().includes("approved")) {
          status = "Approved";
          verificationStatus = "Verified";
        } else if (rawStatus.toLowerCase().includes("reject")) {
          status = "Rejected";
          verificationStatus = "N/A";
        }

        return {
          id: item.id,
          fullName: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A",
          traineeId: item.trainee_id || `TRN-${item.id.slice(0, 7).toUpperCase()}`,
          email: item.email || "N/A",
          status: status,
          verificationStatus: verificationStatus,
          // FIX: Updated to match DB column 'rejected_reason'
          rejected_reason: item.rejected_reason || null,
          ...item,
          ...(training || {}),
        };
      });

      setTrainees(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrainees();
  }, []);

  // Approve Trainee
  const handleApprove = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Approved",
        // FIX: Updated to match DB column 'rejected_reason'
        rejected_reason: null, 
      })
      .eq("id", id);

    if (error) {
      alert(`Failed to approve: ${error.message}`);
      return;
    }

    setTrainees((prev) =>
      prev.map((trainee) =>
        trainee.id === id
          ? {
              ...trainee,
              status: "Approved",
              verificationStatus: "Verified",
              rejected_reason: null,
            }
          : trainee
      )
    );
  };

  // Reject Trainee with Reason
  const handleReject = async (id, rejectionReason) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        registration_status: "Rejected",
        // FIX: Updated to match DB column 'rejected_reason'
        rejected_reason: rejectionReason,
      })
      .eq("id", id);

    if (error) {
      alert(`Failed to reject: ${error.message}`);
      return;
    }

    setTrainees((prev) =>
      prev.map((trainee) =>
        trainee.id === id
          ? {
              ...trainee,
              status: "Rejected",
              verificationStatus: "N/A",
              rejected_reason: rejectionReason,
            }
          : trainee
      )
    );
  };

  // Delete Trainee
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      setTrainees((prev) => prev.filter((trainee) => trainee.id !== id));
    }
  };

  // Filters
  const filteredTrainees = trainees.filter((trainee) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      trainee.fullName.toLowerCase().includes(searchValue) ||
      trainee.email.toLowerCase().includes(searchValue) ||
      trainee.traineeId.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || trainee.status === statusFilter;

    const matchesVerification =
      verificationFilter === "All" ||
      trainee.verificationStatus === verificationFilter;

    return matchesSearch && matchesStatus && matchesVerification;
  });

  return (
    <div className="p-0">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Trainees</h1>
        <p className="text-gray-600">Manage and review trainee accounts</p>
      </div>

      <div className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <SearchBar search={search} setSearch={setSearch} />
          <div className="flex flex-col gap-4 sm:flex-row lg:ml-auto">
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <VerificationFilter value={verificationFilter} onChange={setVerificationFilter} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        {loading ? (
          <div className="py-12 text-center text-gray-500 font-medium">
            Loading trainees from database...
          </div>
        ) : (
          <TraineeTable
            trainees={filteredTrainees}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

export default TraineeManagement;
