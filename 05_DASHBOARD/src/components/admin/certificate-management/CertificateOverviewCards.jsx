import { useMemo } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

/**
 * ==========================================
 * CERTIFICATE OVERVIEW KPI CARDS (STRICT)
 * ==========================================
 * ONLY 4 METRICS:
 * 1. Total Certificates Issued
 * 2. Verified Certificates
 * 3. Pending Certificates
 * 4. Overall Pass Rate
 *
 * Backend note:
 * - status → Issued | Pending | Revoked
 * - verificationStatus → Verified | Never Scanned | Failed
 */

export default function CertificateOverviewCards({ data = [] }) {

  // =========================
  // SAFE DATA GUARD
  // =========================
  const safeData = Array.isArray(data) ? data : [];

  // =========================
  // KPI CALCULATION (BACKEND READY)
  // =========================
  const { totalIssued, verified, pending, passRate } = useMemo(() => {

    // 1. TOTAL ISSUED (not all statuses)
    const totalIssued = safeData.filter(
      (c) => c.status === "Issued"
    ).length;

    // 2. VERIFIED (depends on verification system, NOT status)
    const verified = safeData.filter(
      (c) => c.verificationStatus === "Verified"
    ).length;

    // 3. PENDING (certificates not yet issued or still processing)
    const pending = safeData.filter(
      (c) => c.status === "Pending"
    ).length;

    // 4. PASS RATE (Verified / Total Issued)
    const passRate =
      totalIssued > 0
        ? Math.round((verified / totalIssued) * 100)
        : 0;

    return { totalIssued, verified, pending, passRate };

  }, [safeData]);

  return (
    <div className="overview-section">

      <div className="kpi-grid">

        {/* 1. TOTAL ISSUED */}
        <div className="kpi-card">
          <p>Total Certificates Issued</p>
          <div className="kpi-value-row">
            <FileText className="kpi-icon" />
            <h3>{totalIssued.toLocaleString()}</h3>
          </div>
        </div>

        {/* 2. VERIFIED */}
        <div className="kpi-card">
          <p>Verified Certificates</p>
          <div className="kpi-value-row">
            <CheckCircle className="kpi-icon" />
            <h3>{verified.toLocaleString()}</h3>
          </div>
        </div>

        {/* 3. PENDING */}
        <div className="kpi-card">
          <p>Pending Certificates</p>
          <div className="kpi-value-row">
            <Clock className="kpi-icon" />
            <h3>{pending.toLocaleString()}</h3>
          </div>
        </div>

        {/* 4. PASS RATE */}
        <div className="kpi-card">
          <p>Overall Pass Rate</p>
          <div className="kpi-value-row">
            <TrendingUp className="kpi-icon" />
            <h3>{passRate}%</h3>
          </div>
        </div>

      </div>
    </div>
  );
}