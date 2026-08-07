import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";
import {
  MapPin, Calendar, Clock, Users, Car, Home, Check, X, Heart,
  ShieldCheck, ArrowLeft, Loader2, Star, MessageSquare,
} from "lucide-react";
import { formatPrice, formatDateRange } from "@/lib/triphub";
import { motion } from "framer-motion";

export default function TourDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", id],
    queryFn: () => base44.entities.Tour.get(id),
    enabled: !!id,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: reviews = [] } = useQuery({
    queryKey: ["tour-reviews", id],
    queryFn: () => base44.entities.Review.filter({ tour_id: id }, "-created_date", 100),
    enabled: !!id,
  });
  const organizer = useQuery({
    queryKey: ["organizer", tour?.organizer_profile_id],
    queryFn: () => base44.entities.OrganizerProfile.get(tour.organizer_profile_id),
    enabled: !!tour?.organizer_profile_id,
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => base44.entities.Favorite.filter({ traveler_id: user.id }),
    enabled: !!user,
  });

  const [activeImg, setActiveImg] = useState(0);
  const [booking, setBooking] = useState({ seats: 1, full_name: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!tour) return <div className="mx-auto max-w-3xl px-6 py-24"><EmptyState icon={MapPin} title="Tour not found" description="It may have been removed." actionLabel="Back to tours" actionTo="/tours" /></div>;

  const category = categories.find((c) => c.id === tour.category_id);
  const isFav = favorites.some((f) => f.tour_id === tour.id);
  const canReview = user && reviews.length >= 0; // server enforces approved-booking rule

  const toggleFavorite = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      if (isFav) {
        const fav = favorites.find((f) => f.tour_id === tour.id);
        await base44.entities.Favorite.delete(fav.id);
      } else {
        await base44.entities.Favorite.create({ tour_id: tour.id, traveler_id: user.id });
      }
      qc.invalidateQueries(["favorites", user.id]);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/login"); return; }
    setSubmitting(true); setMsg(null);
    try {
      const res = await base44.functions.invoke("manageBooking", {
        action: "create",
        tour_id: tour.id,
        seats: Number(booking.seats),
        full_name: booking.full_name || user?.full_name,
        phone: booking.phone,
        note: booking.note,
      });
      if (res.status >= 400) throw new Error(res.data?.error || "Booking failed");
      setMsg({ type: "success", text: "Booking request sent! The organizer will review it shortly." });
      setBooking({ seats: 1, full_name: "", phone: "", note: "" });
      qc.invalidateQueries(["tour", id]);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Booking failed" });
    } finally { setSubmitting(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true); setReviewMsg(null);
    try {
      const res = await base44.functions.invoke("manageBooking", {
        action: "review",
        tour_id: tour.id,
        rating: Number(review.rating),
        comment: review.comment,
      });
      if (res.status >= 400) throw new Error(res.data?.error || "Review failed");
      setReviewMsg({ type: "success", text: "Thanks for your review!" });
      setReview({ rating: 5, comment: "" });
      qc.invalidateQueries(["tour-reviews", id]);
      qc.invalidateQueries(["tour", id]);
    } catch (err) {
      setReviewMsg({ type: "error", text: err.message || "Review failed" });
    } finally { setReviewSubmitting(false); }
  };

  const images = tour.images && tour.images.length ? tour.images : [];
  const included = (tour.included || "").split("\n").filter(Boolean);
  const excluded = (tour.excluded || "").split("\n").filter(Boolean);
  const requirements = (tour.requirements || "").split("\n").filter(Boolean);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/tours" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to tours
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {category && <span className="rounded-full bg-accent px-2.5 py-1 font-medium">{category.name}</span>}
                  <span className="inline-flex items-center gap-1"><MapPin size={13} /> {tour.region}{tour.district ? `, ${tour.district}` : ""}</span>
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">{tour.title}</h1>
              </div>
              <button
                onClick={toggleFavorite}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${isFav ? "border-rose-200 bg-rose-50 text-rose-500" : "border-border hover:border-rose-200 hover:text-rose-500"}`}
                aria-label="Toggle favorite"
              >
                <Heart size={20} className={isFav ? "fill-rose-500" : ""} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5"><RatingStars value={tour.rating || 0} size={15} /> <span className="text-muted-foreground">{tour.rating ? `${tour.rating.toFixed(1)} (${tour.reviews_count})` : "No reviews yet"}</span></span>
            </div>

            {/* Gallery */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
              <div className="aspect-[16/10] bg-muted">
                {images.length ? (
                  <Image src={images[activeImg]} alt={tour.title} className="h-full w-full" fittingType="fill" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><MapPin size={40} /></div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((url, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-emerald-500" : "border-transparent"}`}>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick facts */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Calendar, label: "Dates", value: formatDateRange(tour.start_date, tour.end_date) },
                { icon: Clock, label: "Duration", value: tour.duration },
                { icon: Car, label: "Transport", value: tour.transport },
                { icon: Users, label: "Group size", value: `${tour.maximum_people} max` },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl border border-border bg-card p-4">
                  <f.icon size={18} className="text-emerald-600" />
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">About this tour</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{tour.description}</p>
            </section>

            {/* Included / Excluded */}
            <section className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <h3 className="font-semibold text-emerald-700">What's included</h3>
                <ul className="mt-3 space-y-2">
                  {included.length ? included.map((x, i) => (
                    <li key={i} className="flex gap-2 text-sm"><Check size={16} className="shrink-0 text-emerald-600 mt-0.5" /> {x}</li>
                  )) : <li className="text-sm text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                <h3 className="font-semibold text-rose-700">What's excluded</h3>
                <ul className="mt-3 space-y-2">
                  {excluded.length ? excluded.map((x, i) => (
                    <li key={i} className="flex gap-2 text-sm"><X size={16} className="shrink-0 text-rose-500 mt-0.5" /> {x}</li>
                  )) : <li className="text-sm text-muted-foreground">—</li>}
                </ul>
              </div>
            </section>

            {requirements.length > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold">Requirements</h3>
                <ul className="mt-3 space-y-2">
                  {requirements.map((x, i) => <li key={i} className="flex gap-2 text-sm"><Check size={16} className="shrink-0 text-emerald-600 mt-0.5" /> {x}</li>)}
                </ul>
              </section>
            )}

            {tour.meeting_point && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold">Meeting point</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tour.meeting_point}</p>
              </section>
            )}

            {/* Reviews */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Traveler reviews</h2>
              <div className="mt-4 space-y-4">
                {reviews.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to review this tour after joining it." />
                ) : reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                          {(r.comment || "").charAt(0).toUpperCase() || "T"}
                        </span>
                        <div>
                          <p className="text-sm font-medium">Traveler</p>
                          <RatingStars value={r.rating} size={13} />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-foreground/90">{r.comment}</p>
                  </div>
                ))}
              </div>

              {isAuthenticated ? (
                <form onSubmit={submitReview} className="mt-6 rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-semibold">Leave a review</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Only travelers who joined this tour (approved booking) can review.</p>
                  <div className="mt-4 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setReview((r) => ({ ...r, rating: n }))}>
                        <Star size={26} className={n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                    placeholder="Share your experience…"
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-emerald-400"
                  />
                  {reviewMsg && <p className={`mt-2 text-sm ${reviewMsg.type === "success" ? "text-emerald-600" : "text-destructive"}`}>{reviewMsg.text}</p>}
                  <button type="submit" disabled={reviewSubmitting} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                    {reviewSubmitting && <Loader2 size={15} className="animate-spin" />} Submit review
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-emerald-600 hover:underline">Log in</Link> to leave a review.
                </div>
              )}
            </section>
          </div>

          {/* Booking sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Price per person</p>
                  <p className="text-3xl font-bold">{formatPrice(tour.price)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${tour.available_seats > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {tour.available_seats > 0 ? `${tour.available_seats} seats left` : "Sold out"}
                </span>
              </div>

              {organizer.data && (
                <Link to={`/organizers/${organizer.data.id}`} className="mt-5 flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:bg-accent">
                  <span className="h-10 w-10 overflow-hidden rounded-full">
                    <Image src={organizer.data.avatar_url} alt="" className="h-full w-full" fittingType="fill" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{organizer.data.full_name}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck size={12} /> Verified organizer</p>
                  </div>
                </Link>
              )}

              <form onSubmit={submitBooking} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Travelers</label>
                  <input
                    type="number" min={1} max={tour.available_seats || 1}
                    value={booking.seats}
                    onChange={(e) => setBooking((b) => ({ ...b, seats: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Full name</label>
                  <input
                    value={booking.full_name}
                    onChange={(e) => setBooking((b) => ({ ...b, full_name: e.target.value }))}
                    placeholder={user?.full_name || "Your name"}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    value={booking.phone}
                    onChange={(e) => setBooking((b) => ({ ...b, phone: e.target.value }))}
                    placeholder="+998 ..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
                  <textarea
                    value={booking.note}
                    onChange={(e) => setBooking((b) => ({ ...b, note: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold">{formatPrice((tour.price || 0) * Number(booking.seats || 1))}</span>
                </div>

                {msg && <p className={`text-sm ${msg.type === "success" ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>}

                <button
                  type="submit"
                  disabled={submitting || tour.available_seats <= 0 || tour.status !== "approved"}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="mx-auto animate-spin" /> : tour.available_seats > 0 ? "Request booking" : "Sold out"}
                </button>
                {!isAuthenticated && <p className="text-center text-xs text-muted-foreground">You'll be asked to log in.</p>}
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}