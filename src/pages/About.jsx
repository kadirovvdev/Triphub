import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Compass, MapPin, Heart, Users } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
          <Compass size={14} /> About TripHub
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight">A marketplace for Uzbekistan's best mini tours</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          TripHub connects travelers with verified local organizers. We believe travel should be authentic,
          small-group, and run by people who truly know their land.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Verified organizers", text: "Every organizer is reviewed and approved by our team before publishing tours." },
          { icon: Heart, title: "Book with confidence", text: "Transparent pricing, real reviews, and instant seat availability on every tour." },
          { icon: Users, title: "Small groups", text: "We favor intimate mini tours over crowded buses — better stories, better memories." },
        ].map((c) => (
          <div key={c.title} className="rounded-3xl border border-border bg-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <c.icon size={22} />
            </span>
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-6 space-y-5">
          {[
            "Create a free account and choose to travel or to organize.",
            "Search and filter tours by region, category, price and transport.",
            "Book a tour — the organizer reviews your request and confirms seats.",
            "After your trip, leave a review to help future travelers.",
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">{i + 1}</span>
              <p className="pt-1 text-sm text-foreground/90">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/tours" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Explore tours
          </Link>
          <Link to="/organizer/onboarding" className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-accent">
            Become an organizer
          </Link>
        </div>
      </div>

      <p className="mt-10 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <MapPin size={15} /> Made with care in Tashkent, Uzbekistan
      </p>
    </div>
  );
}