import { Search } from "lucide-react";

/**
 * ==========================================
 * CERTIFICATE FILTERS (BACKEND READY UI)
 * ==========================================
 * Supports:
 * - Frontend filtering (current mode)
 * - Backend filtering (future mode via onApply)
 */

export default function CertificateFilters({
  search,
  setSearch,
  status,
  setStatus,
  day,
  setDay,
  month,
  setMonth,
  year,
  setYear,
  onApply,
  onClear,
}) {

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: 25 },
    (_, i) => currentYear - i
  );

  return (
    <div className="certificate-filters">

      {/* =========================
          LEFT FILTER GROUP
      ========================= */}
      <div className="filter-card">

        {/* SEARCH */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />

          <input
            className="search-input"
            placeholder="Search by Name, ID, or Certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATUS FILTER */}
        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Issued">Issued</option>
          <option value="Revoked">Revoked</option>
        </select>

      </div>

      {/* =========================
          RIGHT FILTER GROUP
      ========================= */}
      <div className="filter-card right-card">

        {/* DAY */}
        <select
          className="filter-select"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* MONTH */}
        <select
          className="filter-select"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">Month</option>
          {[
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
          ].map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        {/* YEAR */}
        <select
          className="filter-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* APPLY (BACKEND HOOK READY) */}
        <button
          className="apply-btn"
          onClick={() => {
            /**
             * BACKEND HOOK:
             * GET /api/certificates?search=&status=&day=&month=&year=
             */
            onApply?.();
          }}
        >
          Apply
        </button>

        {/* CLEAR */}
        <button
          className="clear-btn"
          onClick={() => {
            setSearch("");
            setStatus("All");
            setDay("");
            setMonth("");
            setYear("");

            /**
             * BACKEND HOOK (future):
             * refetch default dataset
             */
            onClear?.();
          }}
        >
          Clear
        </button>

      </div>

    </div>
  );
}