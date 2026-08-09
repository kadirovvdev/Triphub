import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  Search,
  X,
  Compass,
  Mountain,
  Landmark,
  Sun,
  Utensils,
  Trees,
  Building2,
} from "lucide-react";

import TourCard from "@/components/TourCard";
import EmptyState from "@/components/EmptyState";

const API_URL = "http://127.0.0.1:8000";

// ============================================================
// ICONS
// ============================================================

const ICONS = {
  mountain: Mountain,
  landmark: Landmark,
  sun: Sun,
  utensils: Utensils,
  trees: Trees,
  "building-2": Building2,
  compass: Compass,
};

// ============================================================
// SORT OPTIONS
// ============================================================

const SORTS = [
  {
    value: "-rating",
    label: "Top rated",
  },
  {
    value: "-created_date",
    label: "Newest",
  },
  {
    value: "price",
    label: "Price: low to high",
  },
  {
    value: "-price",
    label: "Price: high to low",
  },
  {
    value: "start_date",
    label: "Date",
  },
];

// ============================================================
// API FETCH
// ============================================================

async function apiFetch(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Request failed: ${response.status}`
    );
  }

  return data;
}

// ============================================================
// MAIN
// ============================================================

export default function Tours() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });

  // ==========================================================
  // REGIONS
  // ==========================================================

  const {
    data: regions = [],
    isLoading: regionsLoading,
    error: regionsError,
  } = useQuery({
    queryKey: ["regions"],
    queryFn: () => apiFetch("/regions"),
  });

  // ==========================================================
  // TOURS
  // ==========================================================

  const {
    data: tours = [],
    isLoading: toursLoading,
    error: toursError,
  } = useQuery({
    queryKey: ["all-tours"],
    queryFn: () => apiFetch("/tours"),
  });

  // ==========================================================
  // URL FILTERS
  // ==========================================================

  const q = params.get("q") || "";
  const region = params.get("region") || "";
  const category = params.get("category") || "";
  const transport = params.get("transport") || "";
  const maxPrice = params.get("maxPrice") || "";
  const sort = params.get("sort") || "-rating";

  // ==========================================================
  // SET URL PARAMETER
  // ==========================================================

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setParams(next, {
      replace: true,
    });
  };

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filtered = useMemo(() => {
    let list = [...tours];

    // --------------------------------------------------------
    // ONLY APPROVED TOURS
    // --------------------------------------------------------

    list = list.filter(
      (tour) => tour.status === "approved"
    );

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (q) {
      const searchText = q.toLowerCase();

      list = list.filter((tour) => {
        const regionObject = regions.find(
          (r) => r.id === tour.region_id
        );

        const regionName =
          regionObject?.name || "";

        const text = [
          tour.title,
          tour.description,
          tour.district,
          tour.meeting_point,
          regionName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(searchText);
      });
    }

    // --------------------------------------------------------
    // REGION
    // --------------------------------------------------------

    if (region) {
      const selectedRegion = regions.find(
        (r) => r.name === region
      );

      if (selectedRegion) {
        list = list.filter(
          (tour) =>
            tour.region_id === selectedRegion.id
        );
      }
    }

    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (category) {
      const selectedCategory = categories.find(
        (c) => c.slug === category
      );

      if (selectedCategory) {
        list = list.filter(
          (tour) =>
            tour.category_id === selectedCategory.id
        );
      }
    }

    // --------------------------------------------------------
    // TRANSPORT
    // --------------------------------------------------------

    if (transport) {
      list = list.filter(
        (tour) =>
          tour.transport === transport
      );
    }

    // --------------------------------------------------------
    // MAX PRICE
    // --------------------------------------------------------

    if (maxPrice) {
      const maximum = Number(maxPrice);

      list = list.filter(
        (tour) =>
          Number(tour.price || 0) <= maximum
      );
    }

    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    const [field, direction] =
      sort.startsWith("-")
        ? [sort.slice(1), -1]
        : [sort, 1];

    list.sort((a, b) => {
      let av = a[field];
      let bv = b[field];

      // Dates
      if (
        field === "start_date" ||
        field === "created_date"
      ) {
        av = av
          ? new Date(av).getTime()
          : 0;

        bv = bv
          ? new Date(bv).getTime()
          : 0;
      }

      // Numbers
      if (
        field === "price" ||
        field === "rating"
      ) {
        av = Number(av || 0);
        bv = Number(bv || 0);
      }

      // Strings
      if (
        typeof av === "string" &&
        typeof bv === "string"
      ) {
        return (
          av.localeCompare(bv) *
          direction
        );
      }

      return (
        (av - bv) *
        direction
      );
    });

    return list;
  }, [
    tours,
    categories,
    regions,
    q,
    region,
    category,
    transport,
    maxPrice,
    sort,
  ]);

  // ==========================================================
  // ACTIVE FILTER COUNT
  // ==========================================================

  const activeCount = [
    q,
    region,
    category,
    transport,
    maxPrice,
  ].filter(Boolean).length;

  // ==========================================================
  // RESET
  // ==========================================================

  const reset = () => {
    setParams(
      {},
      {
        replace: true,
      }
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  const isLoading =
    toursLoading ||
    categoriesLoading ||
    regionsLoading;

  // ==========================================================
  // ERROR
  // ==========================================================

  const error =
    toursError ||
    categoriesError ||
    regionsError;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Explore tours
        </h1>

        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Loading tours..."
            : `${filtered.length} mini tours across Uzbekistan`}
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <p className="font-semibold">
            Failed to load tours
          </p>

          <p className="mt-1">
            {error.message ||
              "Something went wrong"}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">

        {/* ====================================================
            FILTER SIDEBAR
        ==================================================== */}

        <aside className="lg:w-72 lg:shrink-0">

          <button
            onClick={() =>
              setShowFilters((value) => !value)
            }
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal size={16} />

            Filters

            {activeCount
              ? ` (${activeCount})`
              : ""}
          </button>

          <div
            className={`${
              showFilters
                ? "block"
                : "hidden"
            } lg:block`}
          >
            <div className="rounded-2xl border border-border bg-card p-5">

              {/* FILTER HEADER */}

              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Filters
                </h3>

                {activeCount > 0 && (
                  <button
                    onClick={reset}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-5">

                {/* SEARCH */}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Search
                  </label>

                  <div className="relative mt-1.5">

                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <input
                      value={q}
                      onChange={(event) =>
                        setParam(
                          "q",
                          event.target.value
                        )
                      }
                      placeholder="Keywords..."
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-400"
                    />

                  </div>
                </div>

                {/* REGION */}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Region
                  </label>

                  <select
                    value={region}
                    onChange={(event) =>
                      setParam(
                        "region",
                        event.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  >
                    <option value="">
                      All regions
                    </option>

                    {regions.map((item) => (
                      <option
                        key={item.id}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Category
                  </label>

                  <div className="mt-2 flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        setParam(
                          "category",
                          ""
                        )
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        !category
                          ? "bg-emerald-600 text-white"
                          : "border border-border bg-background"
                      }`}
                    >
                      All
                    </button>

                    {categories.map(
                      (item) => {
                        const Icon =
                          ICONS[item.icon] ||
                          Compass;

                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              setParam(
                                "category",
                                item.slug
                              )
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                              category ===
                              item.slug
                                ? "bg-emerald-600 text-white"
                                : "border border-border bg-background"
                            }`}
                          >
                            <Icon size={12} />

                            {item.name}
                          </button>
                        );
                      }
                    )}

                  </div>
                </div>

                {/* TRANSPORT */}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Transport
                  </label>

                  <select
                    value={transport}
                    onChange={(event) =>
                      setParam(
                        "transport",
                        event.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  >
                    <option value="">
                      Any
                    </option>

                    {[
                      "None",
                      "Bus",
                      "Minivan",
                      "Car",
                      "Train",
                      "Flight",
                    ].map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MAX PRICE */}

                <div>

                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Max price{" "}

                    {maxPrice &&
                      `· ${(Number(maxPrice) / 1000).toFixed(
                        0
                      )}k so'm`}
                  </label>

                  <input
                    type="range"
                    min={300000}
                    max={3000000}
                    step={100000}
                    value={
                      maxPrice
                        ? Number(maxPrice)
                        : 3000000
                    }
                    onChange={(event) =>
                      setParam(
                        "maxPrice",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full accent-emerald-600"
                  />

                </div>

              </div>
            </div>
          </div>
        </aside>

        {/* ====================================================
            RESULTS
        ==================================================== */}

        <div className="flex-1">

          {/* SORT + ACTIVE FILTERS */}

          <div className="mb-4 flex items-center justify-between gap-3">

            <div className="flex flex-wrap gap-2">

              {q && (
                <Chip
                  label={`"${q}"`}
                  onClear={() =>
                    setParam("q", "")
                  }
                />
              )}

              {region && (
                <Chip
                  label={region}
                  onClear={() =>
                    setParam(
                      "region",
                      ""
                    )
                  }
                />
              )}

              {category && (
                <Chip
                  label={category}
                  onClear={() =>
                    setParam(
                      "category",
                      ""
                    )
                  }
                />
              )}

              {transport && (
                <Chip
                  label={transport}
                  onClear={() =>
                    setParam(
                      "transport",
                      ""
                    )
                  }
                />
              )}

              {maxPrice && (
                <Chip
                  label={`Max ${(Number(maxPrice) / 1000).toFixed(
                    0
                  )}k`}
                  onClear={() =>
                    setParam(
                      "maxPrice",
                      ""
                    )
                  }
                />
              )}

            </div>

            <select
              value={sort}
              onChange={(event) =>
                setParam(
                  "sort",
                  event.target.value
                )
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-emerald-400"
            >
              {SORTS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-3xl border border-border bg-muted/40"
                />
              ))}

            </div>
          ) : filtered.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <EmptyState
              icon={Compass}
              title="No tours match your filters"
              description="Try widening your search or resetting filters."
            />

          ) : (

            /* =================================================
               TOUR CARDS
            ================================================= */

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {filtered.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  category={categories.find(
                    (item) =>
                      item.id ===
                      tour.category_id
                  )}
                />
              ))}

            </div>

          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHIP
// ============================================================

function Chip({ label, onClear }) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
    >
      {label}

      <X size={13} />
    </button>
  );
}