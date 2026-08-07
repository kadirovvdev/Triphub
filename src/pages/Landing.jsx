import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Mountain, Landmark, Sun, Utensils, Trees, Building2, Compass,
  ArrowRight, ShieldCheck, Star, Users, MapPin, Sparkles,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import SearchBar from "@/components/SearchBar";
import TourCard from "@/components/TourCard";
import RatingStars from "@/components/RatingStars";
import { motion } from "framer-motion";

const ICONS = { mountain: Mountain, landmark: Landmark, sun: Sun, utensils: Utensils, trees: Trees, "building-2": Building2, compass: Compass };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

export default function Landing() {
  const { data: tours = [] } = useQuery({
    queryKey: ["popular-tours"],
    queryFn: () => base44.entities.Tour.filter({ status: "approved" }, "-rating", 8),
  });
  const { data: organizers = [] } = useQuery({
    queryKey: ["popular-organizers"],
    queryFn: () => base44.entities.OrganizerProfile.filter({ verified: true }, "-rating", 4),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list(),
  });
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: () => base44.entities.Region.list(),
  });

  const popularTours = tours.slice(0, 6);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[640px]">
        <div className="absolute inset-0">
          <img
            src="https://media.base44.com/images/public/6a7651e5805c74c22618cfda/e604e2176_generated_image.png"
            alt="Samarkand Registan"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-900/85" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-36 text-center sm:px-6 sm:pt-44">
          <motion.span
            initial="hidden" animate="show" variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur ring-1 ring-white/20"
          >
            <Sparkles size={14} /> Uzbekistan's verified mini-tour marketplace
          </motion.span>

          <motion.h1
            custom={1} initial="hidden" animate="show" variants={fadeUp}
            className="mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight text-white sm:text-6xl"
          >
            Discover the Silk Road, one{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">mini tour</span>{" "}
            at a time
          </motion.h1>

          <motion.p
            custom={2} initial="hidden" animate="show" variants={fadeUp}
            className="mt-5 max-w-xl text-pretty text-base text-white/80 sm:text-lg"
          >
            From the turquoise domes of Samarkand to the dunes of Kyzylkum — book authentic journeys curated by
            verified local organizers.
          </motion.p>

          <motion.div
            custom={3} initial="hidden" animate="show" variants={fadeUp}
            className="mt-8 w-full max-w-3xl"
          >
            <SearchBar regions={regions} />
          </motion.div>

          <motion.div
            custom={4} initial="hidden" animate="show" variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70"
          >
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} /> Verified organizers</span>
            <span className="inline-flex items-center gap-1.5"><Star size={16} /> Real traveler reviews</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={16} /> 12 regions covered</span>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find the experience that fits your mood.</p>
          </div>
          <Link to="/tours" className="hidden text-sm font-medium text-emerald-600 hover:underline sm:inline">
            View all tours →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => {
            const Icon = ICONS[c.icon] || Compass;
            return (
              <motion.div
                key={c.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              >
                <Link
                  to={`/tours?category=${c.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-medium leading-tight">{c.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* POPULAR TOURS */}
      <section className="bg-gradient-to-b from-emerald-50/40 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Popular mini tours</h2>
              <p className="mt-1 text-sm text-muted-foreground">Top-rated experiences, ready to book.</p>
            </div>
            <Link to="/tours" className="hidden items-center text-sm font-medium text-emerald-600 hover:underline sm:inline-flex">
              Explore all <ArrowRight size={15} className="ml-1" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularTours.map((t) => (
              <motion.div
                key={t.id} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
              >
                <TourCard tour={t} category={categories.find((c) => c.id === t.category_id)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR ORGANIZERS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Trusted organizers</h2>
        <p className="mt-1 text-sm text-muted-foreground">Verified local experts behind every tour.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {organizers.map((o, i) => (
            <motion.div
              key={o.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            >
              <Link
                to={`/organizers/${o.id}`}
                className="group flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-emerald-100">
                  <Image src={o.avatar_url} alt={o.full_name} className="h-full w-full" fittingType="fill" />
                </div>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ShieldCheck size={13} /> Verified
                </span>
                <h3 className="mt-2 font-semibold leading-tight group-hover:text-emerald-600">{o.full_name}</h3>
                <div className="mt-2 flex items-center gap-1.5">
                  <RatingStars value={o.rating || 0} size={14} />
                  <span className="text-xs text-muted-foreground">{o.rating ? o.rating.toFixed(1) : "New"} · {o.tours_count || 0} tours</span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{o.bio}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 lg:grid-cols-4">
          {[
            { icon: Compass, value: tours.length + "+", label: "Mini tours live" },
            { icon: Users, value: organizers.length + "+", label: "Verified organizers" },
            { icon: MapPin, value: regions.length, label: "Regions covered" },
            { icon: Star, value: "4.8", label: "Avg. traveler rating" },
          ].map((s, i) => (
            <motion.div
              key={s.label} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              <s.icon className="text-emerald-400" size={26} />
              <p className="mt-3 text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-white/60">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Are you a local tour organizer?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Join TripHub, get verified, and reach thousands of travelers searching for authentic Uzbek experiences.
          </p>
          <Link
            to="/organizer/onboarding"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Become an organizer <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}