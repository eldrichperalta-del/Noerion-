import { Search } from "lucide-react";

export default function AssessorSearchBar({
  search,
  setSearch,
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-gray-400
        "
      />

      <input
        type="text"
        placeholder="Search Assessors by Name or ID"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="
          w-full
          rounded-xl
          border
          border-gray-400
          py-3
          pl-12
          pr-4
          shadow-[0_4px_12px_rgba(0,0,0,0.15)]
          focus:border-blue-500
          focus:outline-none
        "
      />
    </div>
  );
}