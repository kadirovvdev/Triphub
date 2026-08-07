import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";
import TourCard from "@/components/TourCard";
import ImageUploader from "@/components/ImageUploader";
import {
  Calendar, Heart, Star, Settings, Loader2, MapPin, X, Check,
  Clock, XCircle, CheckCircle2, Hourglass,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/triphub";

const TABS = [
  { key: "bookings", label: "Bookings", icon: Calendar },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "reviews", label: "My reviews", icon: Star },
  { key: "settings", label: "Settings", icon: Settings },
];

const STATUS_META = {
  pending: { label: "Pending", icon: Hourglass, cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-rose-50 text-rose-700" },
  cancelled: { label: "Cancelled", icon: X, cls: "bg-slate-100 text-slate-600" },
};

export default function TravelerDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "bookings";
  const qc = useQueryClient();

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["traveler-bookings", user?.id],
    queryFn: () => base44.entities.Booking.filter({ traveler_id: user.id }, "-created_date", 100),
    enabled: !!user,
  });
  const { data: allTours = [] } = useQuery({
    queryKey: ["all-tours-raw"],
    queryFn: () => base44.entities.Tour.list("-created_date", 200),
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => base44.entities.Favorite.filter({ traveler_id: user.id }, "-created_date", 100),
    enabled: !!user,
  });
  const { data: myReviews = [] } = useQuery({
    queryKey: ["traveler-reviews", user?.id],
    queryFn: () => base44.entities.Review.filter({ traveler_id: user.id }, "-created_date", 100),
    enabled: !!user,
  });

  const tourById = (tid) => allTours.find((t) => t.id === tid);
  const favoriteTours = favorites.map((f) => tourById(f.tour_id)).filter(Boolean);

  const cancelBooking = async (bid) => {
    try {
      const res = await base44.functions.invoke("manageBooking", { action: "cancel", booking_id: bid });
      if (res.status >= 400) throw new Error(res.data?.error || "Failed");
      qc.invalidateQueries(["traveler-bookings", user.id]);
      qc.invalidateQueries(["tour"]);
    } catch (e) { alert(e.message); }
  };

  const removeFavorite = async (favId) => {
    await base44.entities.Favorite.delete(favId);
    qc.invalidateQueries(["favorites", user.id]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">My Traveler Hub</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back, {user?.full_name}.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setParams({ tab: t.key })}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${active ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === "bookings" && (
          loadingBookings ? <CenterLoader /> :
          bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings yet" description="When you book a tour, it'll show up here." actionLabel="Explore tours" actionTo="/tours" />
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const tour = tourById(b.tour_id);
                const meta = STATUS_META[b.status] || STATUS_META.pending;
                return (
                  <div key={b.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row">
                    <Link to={`/tours/${b.tour_id}`} className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40">
                      {tour?.images?.[0] ? <img src={tour.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><MapPin /></div>}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={`/tours/${b.tour_id}`} className="font-semibold hover:text-emerald-600">{tour?.title || "Tour"}</Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">{tour ? `${tour.region} · ${formatDate(tour.start_date)}` : ""}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}><meta.icon size={12} /> {meta.label}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span>{b.seats} traveler(s)</span>
                        <span>Total: <b className="text-foreground">{formatPrice(b.total_price)}</b></span>
                        {b.phone && <span>📞 {b.phone}</span>}
                      </div>
                      {(b.status === "pending" || b.status === "approved") && (
                        <button onClick={() => cancelBooking(b.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-rose-50">
                          <X size={13} /> Cancel booking
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "favorites" && (
          favoriteTours.length === 0 ? (
            <EmptyState icon={Heart} title="No favorites yet" description="Tap the heart on any tour to save it here." actionLabel="Explore tours" actionTo="/tours" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((f) => {
                const t = tourById(f.tour_id);
                if (!t) return null;
                return (
                  <div key={f.id} className="relative">
                    <TourCard tour={t} />
                    <button
                      onClick={() => removeFavorite(f.id)}
                      className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow hover:bg-white"
                      aria-label="Remove favorite"
                    >
                      <Heart size={15} className="fill-rose-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "reviews" && (
          myReviews.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Review tours you've joined to help other travelers." actionLabel="Browse tours" actionTo="/tours" />
          ) : (
            <div className="space-y-4">
              {myReviews.map((r) => {
                const tour = tourById(r.tour_id);
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <Link to={`/tours/${r.tour_id}`} className="font-medium hover:text-emerald-600">{tour?.title || "Tour"}</Link>
                      <RatingStars value={r.rating} size={15} />
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "settings" && <ProfileSettings />}
      </div>
    </div>
  );
}

function CenterLoader() {
  return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>;
}

// Reusable profile editor used in traveler settings.
export function ProfileSettings() {
  const { user, checkUserAuth } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: user?.full_name || "", phone: user?.phone || "", bio: user?.bio || "" });
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await base44.auth.updateMe({
        full_name: form.full_name,
        phone: form.phone,
        bio: form.bio,
        avatar_url: avatar,
      });
      await checkUserAuth();
      qc.invalidateQueries();
      setMsg({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to update" });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="text-sm font-medium">Avatar</label>
        <div className="mt-2"><ImageUploader value={avatar ? [avatar] : []} onChange={(v) => setAvatar(v[0] || "")} max={1} /></div>
      </div>
      <div>
        <label className="text-sm font-medium">Full name</label>
        <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-sm font-medium">Bio</label>
        <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      {msg && <p className={`text-sm ${msg.type === "success" ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>}
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
        {saving && <Loader2 size={15} className="animate-spin" />} Save changes
      </button>
    </form>
  );
}