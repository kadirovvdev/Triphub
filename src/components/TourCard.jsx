import React from "react";
import {
  Mountain, Landmark, Sun, Utensils, Trees, Building2, Compass, MapPin,
  Calendar, Clock, Users, Star, Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { formatPrice, formatDateRange, timeUntil } from "@/lib/triphub";
import RatingStars from "@/components/RatingStars";

// Map category icon name -> lucide component.
const ICONS = {
  mountain: Mountain,
  landmark: Landmark,
  sun: Sun,
  utensils: Utensils,
  trees: Trees,
  "building-2": Building2,
  compass: Compass,
};

export default function TourCard({ tour, category, favorite, onToggleFavorite }) {
  const cover = tour.images && tour.images[0];
  const Icon = ICONS[category?.icon] || Compass;

  return (
    <Link
      to={`/tours/${tour.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={tour.title}
            className="h-full w-full"
            fittingType="fill"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <Mountain size={40} strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            <Icon size={13} /> {category?.name || "Tour"}
          </span>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(tour.id);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-slate-600 backdrop-blur transition hover:bg-white hover:text-rose-500"
              aria-label="Toggle favorite"
            >
              <Heart size={16} className={favorite ? "fill-rose-500 text-rose-500" : ""} />
            </button>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
            <MapPin size={12} /> {tour.region}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {tour.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} /> {formatDateRange(tour.start_date, tour.end_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {tour.duration}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RatingStars value={tour.rating || 0} size={14} />
            <span className="text-xs text-muted-foreground">
              {tour.rating ? tour.rating.toFixed(1) : "New"}{" "}
              {tour.reviews_count ? `· ${tour.reviews_count}` : ""}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={13} /> {tour.available_seats}/{tour.maximum_people}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">From</p>
            <p className="text-lg font-bold text-foreground">{formatPrice(tour.price)}</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 transition group-hover:opacity-100">
            View details
          </span>
        </div>
        {timeUntil(tour.start_date) && (
          <p className="mt-2 text-[11px] font-medium text-emerald-600">{timeUntil(tour.start_date)}</p>
        )}
      </div>
    </Link>
  );
}