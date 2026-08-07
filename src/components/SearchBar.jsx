import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";

// Hero search bar — searches by text and region, pushes to /tours.
export default function SearchBar({ regions = [], compact = false }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (region) params.set("region", region);
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`flex w-full flex-col gap-2 rounded-2xl bg-white/90 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur sm:flex-row sm:items-center ${
        compact ? "" : "sm:p-2"
      }`}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Where do you want to go? e.g. Samarkand, Aral Sea…"
          className="w-full rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="relative sm:w-56">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full appearance-none rounded-xl border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-foreground outline-none"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Search
      </button>
    </form>
  );
}