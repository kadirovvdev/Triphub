import React from "react";

import {
  Link,
} from "react-router-dom";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Heart,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import {
  apiGet,
} from "@/api/apiClient";

import TourCard from "@/components/TourCard";


// ============================================================
// HELPERS
// ============================================================


function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number(value || 0)
  );
}


// ============================================================
// LANDING
// ============================================================


export default function Landing() {

  // ==========================================================
  // TOURS
  // ==========================================================

  const {
    data: tours = [],
    isLoading: toursLoading,
  } = useQuery({
    queryKey: [
      "landing-tours",
    ],

    queryFn: () =>
      apiGet(
        "/tours"
      ),
  });


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const {
    data: categories = [],
  } = useQuery({
    queryKey: [
      "categories",
    ],

    queryFn: () =>
      apiGet(
        "/categories"
      ),
  });


  // ==========================================================
  // ORGANIZERS
  // ==========================================================

  const {
    data: organizers = [],
  } = useQuery({
    queryKey: [
      "landing-organizers",
    ],

    queryFn: () =>
      apiGet(
        "/organizers"
      ),
  });


  // ==========================================================
  // DATA
  // ==========================================================

  const approvedTours =
    tours
      .filter(
        (tour) =>
          tour.status ===
          "approved"
      )
      .sort(
        (a, b) =>
          Number(
            b.rating || 0
          ) -
          Number(
            a.rating || 0
          )
      );


  const featuredTours =
    approvedTours.slice(
      0,
      6
    );


  const verifiedOrganizers =
    organizers.filter(
      (organizer) =>
        organizer.verified ===
          true ||
        organizer.verification_status ===
          "approved"
    );


  const reviewsCount =
    approvedTours.reduce(
      (
        total,
        tour
      ) =>
        total +
        Number(
          tour.reviews_count ||
            0
        ),
      0
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="overflow-hidden bg-background">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative isolate min-h-[690px] overflow-hidden bg-slate-950">

        {/* GRADIENT BACKGROUND */}

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900" />


        {/* DECORATIVE GLOW */}

        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-3xl" />


        {/* GRID */}

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",

            backgroundSize:
              "60px 60px",
          }}
        />


        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-4 pb-20 pt-36 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">

          {/* LEFT */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 backdrop-blur-xl">

              <Sparkles
                size={16}
              />

              Discover Uzbekistan differently

            </div>


            <h1 className="mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">

              Your next

              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                unforgettable trip
              </span>

              starts here.

            </h1>


            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">

              TripNet connects travelers with local
              organizers and unique mini tours across
              Uzbekistan. Find your route, join new
              people and create memories.

            </p>


            <div className="mt-9 flex flex-wrap gap-3">

              <Link
                to="/tours"
                className="inline-flex h-13 items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Explore tours

                <ArrowRight
                  size={17}
                />
              </Link>


              <Link
                to="/organizers"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Meet organizers
              </Link>

            </div>


            {/* MINI STATS */}

            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5">

              <HeroStat
                value={
                  approvedTours.length
                }
                label="Available tours"
              />

              <HeroStat
                value={
                  verifiedOrganizers.length
                }
                label="Organizers"
              />

              <HeroStat
                value={
                  reviewsCount
                }
                label="Traveler reviews"
              />

            </div>

          </div>


          {/* RIGHT */}

          <div className="relative hidden lg:block">

            <div className="relative mx-auto max-w-md">

              <div className="absolute -inset-8 rounded-[3rem] bg-emerald-400/10 blur-3xl" />


              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">

                <div className="rounded-[2rem] bg-white p-6">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                        TripNet
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        Find your adventure
                      </h3>

                    </div>


                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">

                      <Compass
                        size={23}
                      />

                    </div>

                  </div>


                  <div className="mt-7 space-y-3">

                    <FeatureMiniCard
                      icon={
                        MapPin
                      }
                      title="Explore Uzbekistan"
                      description="Mountains, cities, deserts and hidden places."
                    />

                    <FeatureMiniCard
                      icon={
                        ShieldCheck
                      }
                      title="Trusted organizers"
                      description="Discover tours from local organizers."
                    />

                    <FeatureMiniCard
                      icon={
                        Users
                      }
                      title="Travel together"
                      description="Meet people and join memorable group trips."
                    />

                  </div>


                  <Link
                    to="/tours"
                    className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Start exploring

                    <ArrowRight
                      size={16}
                    />
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          TRUST STRIP
      ====================================================== */}

      <section className="border-b border-border bg-white">

        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">

          <TrustItem
            icon={
              BadgeCheck
            }
            title="Local experiences"
            description="Tours created by people who know the destination."
          />

          <TrustItem
            icon={
              Heart
            }
            title="Trips you'll remember"
            description="Small groups, new friends and authentic experiences."
          />

          <TrustItem
            icon={
              ShieldCheck
            }
            title="Built for trust"
            description="Bookings, ratings and organizer profiles in one place."
          />

        </div>

      </section>


      {/* ======================================================
          CATEGORIES
      ====================================================== */}

      {categories.length > 0 && (

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

          <SectionHeading
            eyebrow="Explore your way"
            title="What kind of adventure are you looking for?"
            description="Choose a category and discover experiences made for your mood."
          />


          <div className="mt-9 flex flex-wrap gap-3">

            {categories
              .slice(
                0,
                8
              )
              .map(
                (
                  category
                ) => (

                  <Link
                    key={
                      category.id
                    }
                    to={`/tours?category=${encodeURIComponent(
                      category.slug ||
                        category.name ||
                        ""
                    )}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Mountain
                      size={16}
                      className="transition group-hover:rotate-6"
                    />

                    {
                      category.name
                    }

                  </Link>

                )
              )}

          </div>

        </section>

      )}


      {/* ======================================================
          FEATURED TOURS
      ====================================================== */}

      <section className="bg-slate-50/70">

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <SectionHeading
              eyebrow="Popular right now"
              title="Trips worth discovering"
              description="Explore some of the best-rated experiences available on TripNet."
            />


            <Link
              to="/tours"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600"
            >
              View all tours

              <ArrowRight
                size={16}
              />
            </Link>

          </div>


          {toursLoading ? (

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index
                ) => (

                  <div
                    key={
                      index
                    }
                    className="h-[420px] animate-pulse rounded-3xl bg-slate-200"
                  />

                )
              )}

            </div>

          ) : featuredTours.length > 0 ? (

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {featuredTours.map(
                (
                  tour
                ) => (

                  <TourCard
                    key={
                      tour.id
                    }
                    tour={
                      tour
                    }
                    category={
                      categories.find(
                        (
                          category
                        ) =>
                          Number(
                            category.id
                          ) ===
                          Number(
                            tour.category_id
                          )
                      )
                    }
                  />

                )
              )}

            </div>

          ) : (

            <div className="mt-10 rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">

              <Compass
                className="mx-auto text-muted-foreground"
                size={34}
              />

              <h3 className="mt-4 text-xl font-bold">
                Tours are coming soon
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                New experiences will appear here as organizers publish them.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">

        <SectionHeading
          eyebrow="Simple journey"
          title="From discovery to adventure"
          description="TripNet makes finding and joining a mini tour simple."
          centered
        />


        <div className="mt-12 grid gap-5 md:grid-cols-3">

          <StepCard
            number="01"
            icon={
              Compass
            }
            title="Discover"
            description="Browse tours and find a destination, date and experience that matches you."
          />

          <StepCard
            number="02"
            icon={
              BadgeCheck
            }
            title="Choose"
            description="Check tour information, organizer profiles, ratings and available seats."
          />

          <StepCard
            number="03"
            icon={
              Users
            }
            title="Go"
            description="Book your place, meet your group and enjoy the experience."
          />

        </div>

      </section>


      {/* ======================================================
          ORGANIZER CTA
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">

        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-7 py-14 text-white sm:px-12 lg:px-16 lg:py-16">

          <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />


          <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-center">

            <div className="max-w-2xl">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                For organizers
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Turn your next trip into an experience people can join.
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                Publish your mini tours, manage travelers and grow your community with TripNet.
              </p>

            </div>


            <Link
              to="/register"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Become an organizer

              <ArrowRight
                size={17}
              />
            </Link>

          </div>

        </div>

      </section>


      {/* ======================================================
          CONTACT
      ====================================================== */}

      <section className="border-t border-border bg-white">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center lg:px-8">

          <div>

            <p className="text-sm font-semibold text-emerald-600">
              TripNet Uzbekistan
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Questions, cooperation or support?
            </p>

          </div>


          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium">

            <a
              href="mailto:kadirovvdev@gmail.com"
              className="transition hover:text-emerald-600"
            >
              kadirovvdev@gmail.com
            </a>

            <a
              href="tel:+998942622301"
              className="transition hover:text-emerald-600"
            >
              +998 94 262 23 01
            </a>

          </div>

        </div>

      </section>

    </div>
  );
}


// ============================================================
// COMPONENTS
// ============================================================


function HeroStat({
  value,
  label,
}) {
  return (
    <div>

      <p className="text-2xl font-bold text-white">
        {formatNumber(
          value
        )}
        +
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {label}
      </p>

    </div>
  );
}


function FeatureMiniCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">

      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">

        <Icon
          size={20}
        />

      </div>


      <div>

        <p className="font-semibold text-slate-950">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}


function TrustItem({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl px-4 py-3">

      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">

        <Icon
          size={20}
        />

      </div>


      <div>

        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>

      </div>

    </div>
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}) {
  return (
    <div
      className={
        centered
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl"
      }
    >

      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}


function StepCard({
  number,
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-emerald-600">

          <Icon
            size={21}
          />

        </div>

        <span className="text-4xl font-black text-slate-100">
          {number}
        </span>

      </div>


      <h3 className="mt-7 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}