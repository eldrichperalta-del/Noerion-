import { useMemo } from "react";

import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function CertificateOverviewCards({
  data = [],
}) {

  // =========================
  // SAFE DATA GUARD
  // =========================

  const safeData = Array.isArray(data)
    ? data
    : [];


  // =========================
  // KPI CALCULATION
  // =========================

  const {
    totalIssued,
    verified,
    pending,
    passRate,
  } = useMemo(() => {

    // 1. TOTAL ISSUED
    const totalIssued =
      safeData.filter(
        (certificate) =>
          certificate.status === "Issued"
      ).length;


    // 2. VERIFIED
    const verified =
      safeData.filter(
        (certificate) =>
          certificate.verificationStatus ===
          "Verified"
      ).length;


    // 3. PENDING
    const pending =
      safeData.filter(
        (certificate) =>
          certificate.status === "Pending"
      ).length;


    // 4. OVERALL PASS RATE
    const passRate =
      totalIssued > 0
        ? Math.round(
            (verified / totalIssued) * 100
          )
        : 0;


    return {
      totalIssued,
      verified,
      pending,
      passRate,
    };

  }, [safeData]);


  return (
    <div className="overview-section">

      {/* ==========================================================
          KPI CARDS
      =========================================================== */}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* ========================================================
            TOTAL CERTIFICATES ISSUED
        ========================================================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          <p className="mb-3 text-sm font-medium text-gray-500">
            Total Certificates Issued
          </p>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">

              <FileText
                className="h-6 w-6 text-blue-600"
                strokeWidth={2}
              />

            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {totalIssued.toLocaleString()}
            </h3>

          </div>

        </div>


        {/* ========================================================
            VERIFIED CERTIFICATES
        ========================================================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          <p className="mb-3 text-sm font-medium text-gray-500">
            Verified Certificates
          </p>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">

              <CheckCircle
                className="h-6 w-6 text-green-600"
                strokeWidth={2}
              />

            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {verified.toLocaleString()}
            </h3>

          </div>

        </div>


        {/* ========================================================
            PENDING CERTIFICATES
        ========================================================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          <p className="mb-3 text-sm font-medium text-gray-500">
            Pending Certificates
          </p>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">

              <Clock
                className="h-6 w-6 text-yellow-600"
                strokeWidth={2}
              />

            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {pending.toLocaleString()}
            </h3>

          </div>

        </div>


        {/* ========================================================
            OVERALL PASS RATE
        ========================================================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

          <p className="mb-3 text-sm font-medium text-gray-500">
            Overall Pass Rate
          </p>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">

              <TrendingUp
                className="h-6 w-6 text-purple-600"
                strokeWidth={2}
              />

            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {passRate}%
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}

