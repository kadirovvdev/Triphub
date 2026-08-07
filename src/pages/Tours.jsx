import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, X, Compass } from "lucide-react";
import TourCard from "@/components/TourCard";
import EmptyState from "@/components/EmptyState";
import {
  Mountain, Landmark, Sun, Utensils, Trees, Building2,
} from "lucide-react";

const ICONS = { mountain: Mountain, landmark: Landmark, sun: Sun, utensils: Utensils, trees: Trees, "building-2": Building2, compass: Compass };

const SORTS = [
  { value: "-rating", label: "Top rated" },
  { value: "-created_date", label: "Newest" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
  { value: "start_date", label: "Date" },
];

export default function Tours() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: regions = [] } = useQuery({ queryKey: ["regions"], queryFn: () => base44.entities.Region.list() });
  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["all-tours"],
    queryFn: () => base44.entities.Tour.filter({ status: "approved" }, "-rating", 200),
  });

  const q = params.get("q") || "";
  const region = params.get("region") || "";
  const category = params.get("category") || "";
  const transport = params.get("transport") || "";
  const maxPrice = params.get("maxPrice") || "";
  const sort = params.get("sort") || "-rating";

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = [...tours];
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((x) =>
        (x.title + " " + x.description + " " + (x.region || "") + " " + (x.district || "")).toLowerCase().includes(t)
      );
    }
    if (region) list = list.filter((x) => x.region === region);
    if (category) {
      const cat = categories.find((c) => c.slug === category);
      if (cat) list = list.filter((x) => x.category_id === cat.id);
    }
    if (transport) list = list.filter((x) => x.transport === transport);
    if (maxPrice) list = list.filter((x) => (x.price || 0) <= Number(maxPrice));

    const [field, dir] = sort.startsWith("-") ? [sort.slice(1), -1] : [sort, 1];
    list.sort((a, b) => {
      const av = a[field] || 0, bv = b[field] || 0;
      return dir === 1 ? av - bv : bv - av;
    });
    return list;
  }, [tours, q, region, category, transport, maxPrice, sort, categories]);

  const activeCount = [q, region, category, transport, maxPrice].filter(Boolean).length;

  const reset = () => setParams({}, { replace: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Explore tours</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} mini tours across Uzbekistan
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar (desktop) + drawer (mobile) */}
        <aside className="lg:w-72 lg:shrink-0">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filters {activeCount ? `(${activeCount})` : ""}
          </button>

          <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {activeCount > 0 && (
                  <button onClick={reset} className="text-xs font-medium text-emerald-600 hover:underline">
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-5">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</label>
                  <div className="relative mt-1.5">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={q}
                      onChange={(e) => setParam("q", e.target.value)}
                      placeholder="Keywords…"
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Region</label>
                  <select value={region} onChange={(e) => setParam("region", e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-emerald-400">
                    <option value="">All regions</option>
                    {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setParam("category", "")}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${!category ? "bg-emerald-600 text-white" : "border border-border bg-background"}`}
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setParam("category", c.slug)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${category === c.slug ? "bg-emerald-600 text-white" : "border border-border bg-background"}`}
                      >
                        {(() => { const I = ICONS[c.icon] || Compass; return <I size={12} />; })()}
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transport</label>
                  <select value={transport} onChange={(e) => setParam("transport", e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-emerald-400">
                    <option value="">Any</option>
                    {["None", "Bus", "Minivan", "Car", "Train", "Flight"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Max price {maxPrice && `· ${(Number(maxPrice) / 1000).toFixed(0)}k so'm`}
                  </label>
                  <input
                    type="range" min={300000} max={3000000} step={100000}
                    value={maxPrice ? Number(maxPrice) : 3000000}
                    onChange={(e) => setParam("maxPrice", e.target.value)}
                    className="mt-2 w-full accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {q && <Chip label={`"${q}"`} onClear={() => setParam("q", "")} />}
              {region && <Chip label={region} onClear={() => setParam("region", "")} />}
              {category && <Chip label={category} onClear={() => setParam("category", "")} />}
              {transport && <Chip label={transport} onClear={() => setParam("transport", "")} />}
            </div>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="rounded-lg border border-border bg-card py-2 px-3 text-sm outline-none focus:border-emerald-400"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-3xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No tours match your filters"
              description="Try widening your search or resetting filters."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <TourCard key={t.id} tour={t} category={categories.find((c) => c.id === t.category_id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      {label}
      <button onClick={onClear} className="grid h-4 w-4 place-items-center rounded-full hover:bg-emerald-200">
        <X size={11} />
      </button>
    </span>
  );
}