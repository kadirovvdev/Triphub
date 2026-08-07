import React from "react";
import { Link } from "react-router-dom";
import { Plane, Mail, MapPin, Compass, Mountain, Landmark, Sun } from "lucide-react";

export default function Footer() {
  const cols = [
    {
      title: "Explore",
      links: [
        { label: "All Tours", to: "/tours" },
        { label: "Organizers", to: "/organizers" },
        { label: "Become an Organizer", to: "/organizer/onboarding" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About TripHub", to: "/about" },
        { label: "How it works", to: "/about" },
        { label: "Traveler Dashboard", to: "/dashboard" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Plane size={18} />
              </span>
              <span className="text-lg font-bold">Trip<span className="text-emerald-600">Hub</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              TripHub is Uzbekistan's marketplace for verified mini tours — discover the Silk Road,
              mountains, deserts and ancient cities, curated by trusted local organizers.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={15} /> Tashkent, Uzbekistan
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={15} /> hello@triphub.uz
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground transition hover:text-emerald-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} TripHub Uzbekistan. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Compass size={14} />
            <Mountain size={14} />
            <Landmark size={14} />
            <Sun size={14} />
          </div>
        </div>
      </div>
    </footer>
  );
}