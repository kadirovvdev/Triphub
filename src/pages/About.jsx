import React from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  Compass,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";


export default function About() {
  return (
    <div className="bg-background">

      {/* HERO */}

      <section className="relative overflow-hidden bg-slate-950">

        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />


        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-200">

              <Sparkles
                size={15}
              />

              About TripNet

            </div>


            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Travel differently.
              <span className="block text-emerald-300">
                Discover together.
              </span>
            </h1>


            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              TripNet is a marketplace for discovering
              mini tours and local experiences across
              Uzbekistan.
            </p>

          </div>

        </div>

      </section>


      {/* ABOUT */}

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Our idea
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One platform for local adventures
            </h2>

            <p className="mt-5 leading-8 text-muted-foreground">
              Uzbekistan has thousands of interesting
              destinations and local organizers creating
              unique trips. TripNet brings those
              experiences together in one convenient
              platform.
            </p>

            <p className="mt-4 leading-8 text-muted-foreground">
              Travelers can discover tours, check
              organizers, save favorites, book their
              place and share reviews after their trip.
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-2">

            <ValueCard
              icon={Compass}
              title="Discover"
              text="Find new destinations and experiences across Uzbekistan."
            />

            <ValueCard
              icon={ShieldCheck}
              title="Trust"
              text="Organizer profiles, bookings and reviews help create transparency."
            />

            <ValueCard
              icon={Users}
              title="Community"
              text="Meet new people and enjoy small-group adventures."
            />

            <ValueCard
              icon={Heart}
              title="Memories"
              text="Save experiences worth remembering and share your journey."
            />

          </div>

        </div>

      </section>


      {/* CONTACT */}

      <section className="bg-slate-50">

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Contact us
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Get in touch with TripNet
            </h2>

            <p className="mt-4 text-muted-foreground">
              For questions, cooperation, technical
              support or suggestions, contact us.
            </p>

          </div>


          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">

            <ContactCard
              icon={Mail}
              label="Email"
              value="kadirovvdev@gmail.com"
              href="mailto:kadirovvdev@gmail.com"
            />

            <ContactCard
              icon={Phone}
              label="Phone"
              value="+998 94 262 23 01"
              href="tel:+998942622301"
            />

            <ContactCard
              icon={MapPin}
              label="Location"
              value="Tashkent, Uzbekistan"
            />

          </div>


          <div className="mt-12 text-center">

            <Link
              to="/tours"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Explore tours

              <ArrowRight
                size={16}
              />
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}


function ValueCard({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">

      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">

        <Icon
          size={20}
        />

      </div>

      <h3 className="mt-5 font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {text}
      </p>

    </div>
  );
}


function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}) {

  const content = (
    <>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">

        <Icon
          size={21}
        />

      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>
    </>
  );


  if (href) {
    return (
      <a
        href={href}
        className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
      >
        {content}
      </a>
    );
  }


  return (
    <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm">
      {content}
    </div>
  );
}