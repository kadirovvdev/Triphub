import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import TourCard from "@/components/TourCard";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";
import { ShieldCheck, Phone, Loader2, Compass, MapPin } from "lucide-react";

export default function OrganizerProfilePage() {
  const { id } = useParams();
  const { data: organizer, isLoading } = useQuery({
    queryKey: ["organizer", id],
    queryFn: () => base44.entities.OrganizerProfile.get(id),
    enabled: !!id,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: tours = [] } = useQuery({
    queryKey: ["organizer-tours", id],
    queryFn: () => base44.entities.Tour.filter({ organizer_profile_id: id, status: "approved" }, "-created_date", 100),
    enabled: !!id,
  });

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!organizer) return <div className="mx-auto max-w-3xl px-6 py-24"><EmptyState icon={MapPin} title="Organizer not found" actionLabel="Back" actionTo="/organizers" /></div>;

  return (
    <div>
      <div className="relative h-48 bg-gradient-to-r from-emerald-600 to-teal-600 sm:h-56">
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
          <span className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-background bg-card">
            <Image src={organizer.avatar_url} alt={organizer.full_name} className="h-full w-full" fittingType="fill" />
          </span>
          <div className="flex-1 pb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck size={13} /> Verified organizer
            </span>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{organizer.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><RatingStars value={organizer.rating || 0} size={15} /> {organizer.rating ? organizer.rating.toFixed(1) : "New"} · {organizer.reviews_count || 0} reviews</span>
              {organizer.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {organizer.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><Compass size={14} /> {organizer.tours_count || tours.length} tours</span>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-foreground/90">{organizer.bio}</p>

        <h2 className="mt-10 text-xl font-semibold">Tours by {organizer.full_name}</h2>
        {tours.length === 0 ? (
          <EmptyState icon={Compass} title="No tours yet" description="This organizer hasn't published approved tours yet." />
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => <TourCard key={t.id} tour={t} category={categories.find((c) => c.id === t.category_id)} />)}
          </div>
        )}
      </div>
      <div className="h-16" />
      <Link to="/organizers" className="mx-auto block max-w-7xl px-6 pb-10 text-sm text-muted-foreground hover:text-foreground">← All organizers</Link>
    </div>
  );
}