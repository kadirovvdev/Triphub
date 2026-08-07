import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ImageUploader from "@/components/ImageUploader";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { slugify } from "@/lib/triphub";

const TRANSPORTS = ["None", "Bus", "Minivan", "Car", "Train", "Flight"];

const empty = {
  title: "", description: "", category_id: "", region: "", district: "",
  meeting_point: "", price: "", duration: "", start_date: "", end_date: "",
  maximum_people: 10, transport: "Bus", accommodation: "",
  included: "", excluded: "", requirements: "", images: [],
};

// Convert an ISO string to a value suitable for datetime-local input.
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TourForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => base44.entities.Category.list() });
  const { data: regions = [] } = useQuery({ queryKey: ["regions"], queryFn: () => base44.entities.Region.list() });
  const { data: profiles = [] } = useQuery({
    queryKey: ["my-organizer-profile", user?.id],
    queryFn: () => base44.entities.OrganizerProfile.filter({ created_by_id: user.id }),
    enabled: !!user,
  });
  const profile = profiles[0];

  const { data: existing } = useQuery({
    queryKey: ["tour", id],
    queryFn: () => base44.entities.Tour.get(id),
    enabled: isEdit,
  });

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        title: existing.title || "",
        description: existing.description || "",
        category_id: existing.category_id || "",
        region: existing.region || "",
        district: existing.district || "",
        meeting_point: existing.meeting_point || "",
        price: existing.price ?? "",
        duration: existing.duration || "",
        start_date: toLocalInput(existing.start_date),
        end_date: toLocalInput(existing.end_date),
        maximum_people: existing.maximum_people ?? 10,
        transport: existing.transport || "Bus",
        accommodation: existing.accommodation || "",
        included: existing.included || "",
        excluded: existing.excluded || "",
        requirements: existing.requirements || "",
        images: existing.images || [],
        status: existing.status || "pending",
      });
    }
  }, [isEdit, existing]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">You need an organizer profile to create tours.</p>
        <Link to="/organizer/onboarding" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">Become an organizer</Link>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description || !form.region || !form.price || !form.start_date) {
      setError("Please fill in title, description, region, price and start date.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      slug: slugify(form.title),
      description: form.description,
      category_id: form.category_id || null,
      region: form.region,
      district: form.district,
      meeting_point: form.meeting_point,
      price: Number(form.price),
      duration: form.duration,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      maximum_people: Number(form.maximum_people) || 10,
      available_seats: isEdit ? (existing?.available_seats ?? (Number(form.maximum_people) || 10)) : (Number(form.maximum_people) || 10),
      transport: form.transport,
      accommodation: form.accommodation,
      included: form.included,
      excluded: form.excluded,
      requirements: form.requirements,
      images: form.images,
      organizer_profile_id: profile.id,
      status: isEdit ? (form.status || "pending") : "pending",
    };
    try {
      if (isEdit) {
        await base44.entities.Tour.update(id, payload);
      } else {
        await base44.entities.Tour.create(payload);
      }
      qc.invalidateQueries(["organizer-tours", profile.id]);
      navigate("/organizer?tab=tours");
    } catch (err) {
      setError(err.message || "Failed to save tour");
    } finally { setSaving(false); }
  };

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/organizer?tab=tours" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to tours
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{isEdit ? "Edit tour" : "Create a new tour"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">New tours are submitted for admin approval before going live.</p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Basics</h2>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={`mt-1 ${input}`} placeholder="e.g. Samarkand Heritage Walk" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className={`mt-1 ${input}`} placeholder="Describe the experience, itinerary and highlights…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={`mt-1 ${input}`}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Region</label>
              <select value={form.region} onChange={(e) => set("region", e.target.value)} className={`mt-1 ${input}`}>
                <option value="">Select region</option>
                {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">District</label>
              <input value={form.district} onChange={(e) => set("district", e.target.value)} className={`mt-1 ${input}`} />
            </div>
            <div>
              <label className="text-sm font-medium">Meeting point</label>
              <input value={form.meeting_point} onChange={(e) => set("meeting_point", e.target.value)} className={`mt-1 ${input}`} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Schedule & pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Start date & time</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={`mt-1 ${input}`} />
            </div>
            <div>
              <label className="text-sm font-medium">End date & time</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={`mt-1 ${input}`} />
            </div>
            <div>
              <label className="text-sm font-medium">Duration</label>
              <input value={form.duration} onChange={(e) => set("duration", e.target.value)} className={`mt-1 ${input}`} placeholder="e.g. 2 days" />
            </div>
            <div>
              <label className="text-sm font-medium">Price per person (so'm)</label>
              <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} className={`mt-1 ${input}`} />
            </div>
            <div>
              <label className="text-sm font-medium">Max people</label>
              <input type="number" min={1} value={form.maximum_people} onChange={(e) => set("maximum_people", e.target.value)} className={`mt-1 ${input}`} />
            </div>
            <div>
              <label className="text-sm font-medium">Transport</label>
              <select value={form.transport} onChange={(e) => set("transport", e.target.value)} className={`mt-1 ${input}`}>
                {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Accommodation</label>
              <input value={form.accommodation} onChange={(e) => set("accommodation", e.target.value)} className={`mt-1 ${input}`} placeholder="e.g. Boutique guesthouse, Yurt camp, None" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Details</h2>
          <div>
            <label className="text-sm font-medium">Included (one per line)</label>
            <textarea value={form.included} onChange={(e) => set("included", e.target.value)} rows={4} className={`mt-1 ${input}`} placeholder={"Guide\nMeals\nTransfers"} />
          </div>
          <div>
            <label className="text-sm font-medium">Excluded (one per line)</label>
            <textarea value={form.excluded} onChange={(e) => set("excluded", e.target.value)} rows={4} className={`mt-1 ${input}`} placeholder={"Flights\nInsurance"} />
          </div>
          <div>
            <label className="text-sm font-medium">Requirements (one per line)</label>
            <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={3} className={`mt-1 ${input}`} placeholder={"Comfortable shoes\nPassport copy"} />
          </div>
          <div>
            <label className="text-sm font-medium">Images</label>
            <div className="mt-2"><ImageUploader value={form.images} onChange={(v) => set("images", v)} max={8} /></div>
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isEdit ? "Save changes" : "Create tour"}
        </button>
      </form>
    </div>
  );
}