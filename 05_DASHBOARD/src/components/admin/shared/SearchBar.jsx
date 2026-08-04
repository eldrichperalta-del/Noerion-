import { Search } from "lucide-react";

function SearchBar({ search, setSearch }) {
  return (
    <div className="relative flex-1 lg:max-w-md">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        placeholder="Search by name, ID, or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

export default SearchBar;
