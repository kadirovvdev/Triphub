import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import RatingStars from "@/components/RatingStars";
import { ShieldCheck, Users, Briefcase } from "lucide-react";

export default function Organizers() {
  const { data: organizers = [], isLoading } = useQuery({
    queryKey: ["organizers"],
    queryFn: () => base44.entities.OrganizerProfile.filter({ verified: true }, "-rating", 100),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Verified organizers</h1>
      <p className="mt-1 text-sm text-muted-foreground">Meet the local experts behind every TripHub tour.</p>

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted/40" />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.map((o) => (
            <Link key={o.id} to={`/organizers/${o.id}`} className="group flex gap-4 rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md">
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                <Image src={o.avatar_url} alt={o.full_name} className="h-full w-full" fittingType="fill" />
              </span>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><ShieldCheck size={12} /> Verified</span>
                <h3 className="font-semibold leading-tight group-hover:text-emerald-600">{o.full_name}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <RatingStars value={o.rating || 0} size={13} />
                  <span className="text-xs text-muted-foreground">{o.rating ? o.rating.toFixed(1) : "New"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{o.bio}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Briefcase size={12} /> {o.tours_count || 0} tours</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}