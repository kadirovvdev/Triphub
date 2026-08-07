import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";
import ImageUploader from "@/components/ImageUploader";
import {
  LayoutDashboard, Compass, Calendar, Star, User as UserIcon,
  Plus, Edit3, Trash2, Loader2, Check, X, Hourglass, CheckCircle2, XCircle,
  ShieldCheck, ExternalLink,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/triphub";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "tours", label: "My Tours", icon: Compass },
  { key: "bookings", label: "Bookings", icon: Calendar },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "profile", label: "Profile", icon: UserIcon },
];

const STATUS_BADGE = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};
const BOOKING_STATUS = {
  pending: { label: "Pending", icon: Hourglass, cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-rose-50 text-rose-700" },
  cancelled: { label: "Cancelled", icon: X, cls: "bg-slate-100 text-slate-600" },
};

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const qc = useQueryClient();

  // Find this user's organizer profile.
  const { data: profiles = [] } = useQuery({
    queryKey: ["my-organizer-profile", user?.id],
    queryFn: () => base44.entities.OrganizerProfile.filter({ created_by_id: user.id }),
    enabled: !!user,
  });
  const profile = profiles[0];

  const { data: tours = [], isLoading: loadingTours } = useQuery({
    queryKey: ["organizer-tours", profile?.id],
    queryFn: () => base44.entities.Tour.filter({ organizer_profile_id: profile.id }, "-created_date", 200),
    enabled: !!profile,
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["organizer-bookings", profile?.id],
    queryFn: () => base44.entities.Booking.filter({ organizer_profile_id: profile.id }, "-created_date", 200),
    enabled: !!profile,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["organizer-reviews", profile?.id],
    queryFn: () => base44.entities.Review.filter({}, "-created_date", 200),
    enabled: !!profile,
  });

  const myTourIds = new Set(tours.map((t) => t.id));
  const myReviews = reviews.filter((r) => myTourIds.has(r.tour_id));

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedTours = tours.filter((t) => t.status === "approved");
  const totalRevenue = bookings.filter((b) => b.status === "approved").reduce((s, b) => s + (b.total_price || 0), 0);

  const actBooking = async (action, bid) => {
    try {
      const res = await base44.functions.invoke("manageBooking", { action, booking_id: bid });
      if (res.status >= 400) throw new Error(res.data?.error || "Failed");
      qc.invalidateQueries(["organizer-bookings", profile.id]);
      qc.invalidateQueries(["organizer-tours", profile.id]);
      qc.invalidateQueries(["my-organizer-profile", user.id]);
    } catch (e) { alert(e.message); }
  };

  const deleteTour = async (tid) => {
    if (!confirm("Delete this tour? This cannot be undone.")) return;
    await base44.entities.Tour.delete(tid);
    qc.invalidateQueries(["organizer-tours", profile.id]);
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <EmptyState icon={Compass} title="No organizer profile" description="Become an organizer to start creating tours." actionLabel="Become an organizer" actionTo="/organizer/onboarding" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.full_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${profile.verification_status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          <ShieldCheck size={13} />
          {profile.verification_status === "approved" ? "Verified organizer" : "Verification pending"}
        </span>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setParams({ tab: t.key })}
            className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${tab === t.key ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon size={16} /> {t.label}
            {t.key === "bookings" && pendingBookings.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{pendingBookings.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Compass} label="Total tours" value={tours.length} hint={`${approvedTours.length} approved`} tone="emerald" />
              <StatCard icon={Calendar} label="Bookings" value={bookings.length} hint={`${pendingBookings.length} pending`} tone="indigo" />
              <StatCard icon={Star} label="Avg. rating" value={profile.rating ? profile.rating.toFixed(1) : "—"} hint={`${myReviews.length} reviews`} tone="amber" />
              <StatCard icon={CheckCircle2} label="Revenue" value={formatPrice(totalRevenue)} hint="approved bookings" tone="sky" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Latest bookings</h3>
              {bookings.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No bookings yet.</p> : (
                <div className="mt-3 divide-y divide-border">
                  {bookings.slice(0, 5).map((b) => <BookingRow key={b.id} b={b} tours={tours} compact />)}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "tours" && (
          <>
            <div className="mb-4 flex justify-end">
              <Link to="/organizer/tours/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                <Plus size={16} /> Create tour
              </Link>
            </div>
            {loadingTours ? <CenterLoader /> : tours.length === 0 ? (
              <EmptyState icon={Compass} title="No tours yet" description="Create your first tour to start receiving bookings." actionLabel="Create tour" actionTo="/organizer/tours/new" />
            ) : (
              <div className="space-y-3">
                {tours.map((t) => (
                  <div key={t.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    <span className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {t.images?.[0] ? <img src={t.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/tours/${t.id}`} className="font-semibold hover:text-emerald-600">{t.title}</Link>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.region} · {formatDate(t.start_date)} · {formatPrice(t.price)} · {t.available_seats} seats</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/organizer/tours/${t.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Edit3 size={13} /> Edit</Link>
                      <button onClick={() => deleteTour(t.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-rose-50"><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "bookings" && (
          bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings" description="Traveler bookings for your tours will appear here." />
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {bookings.map((b) => (
                <div key={b.id} className="p-4">
                  <BookingRow b={b} tours={tours}
                    onApprove={b.status === "pending" ? () => actBooking("approve", b.id) : null}
                    onReject={b.status === "pending" ? () => actBooking("reject", b.id) : null}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {tab === "reviews" && (
          myReviews.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Reviews from travelers will appear here." />
          ) : (
            <div className="space-y-3">
              {myReviews.map((r) => {
                const tour = tours.find((t) => t.id === r.tour_id);
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <Link to={`/tours/${r.tour_id}`} className="font-medium hover:text-emerald-600">{tour?.title}</Link>
                      <RatingStars value={r.rating} size={15} />
                    </div>
                    <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "profile" && <OrganizerProfileEditor profile={profile} />}
      </div>
    </div>
  );
}

function BookingRow({ b, tours, onApprove, onReject, compact }) {
  const tour = tours.find((t) => t.id === b.tour_id);
  const meta = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{tour?.title || "Tour"}</p>
        <p className="text-xs text-muted-foreground">
          {b.full_name} · {b.seats} seat(s) · {formatPrice(b.total_price)} · {b.phone || "no phone"}
          {b.note && <> · “{b.note}”</>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}><meta.icon size={12} /> {meta.label}</span>
        {!compact && onApprove && (
          <button onClick={onApprove} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"><Check size={13} /> Approve</button>
        )}
        {!compact && onReject && (
          <button onClick={onReject} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-rose-50"><X size={13} /> Reject</button>
        )}
        {tour && <Link to={`/tours/${tour.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink size={13} /></Link>}
      </div>
    </div>
  );
}

function OrganizerProfileEditor({ profile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: profile.full_name, bio: profile.bio, phone: profile.phone, avatar_url: profile.avatar_url, cover_url: profile.cover_url });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await base44.entities.OrganizerProfile.update(profile.id, {
        full_name: form.full_name, bio: form.bio, phone: form.phone, avatar_url: form.avatar_url, cover_url: form.cover_url,
      });
      qc.invalidateQueries(["my-organizer-profile"]);
      setMsg({ type: "success", text: "Profile updated." });
    } catch (err) { setMsg({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className="text-sm font-medium">Avatar</label>
        <div className="mt-2"><ImageUploader value={form.avatar_url ? [form.avatar_url] : []} onChange={(v) => setForm((f) => ({ ...f, avatar_url: v[0] || "" }))} max={1} /></div>
      </div>
      <div>
        <label className="text-sm font-medium">Organizer name</label>
        <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label className="text-sm font-medium">Bio</label>
        <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
      </div>
      {msg && <p className={`text-sm ${msg.type === "success" ? "text-emerald-600" : "text-destructive"}`}>{msg.text}</p>}
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
        {saving && <Loader2 size={15} className="animate-spin" />} Save profile
      </button>
    </form>
  );
}

function CenterLoader() {
  return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>;
}