import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Loader2, ShieldCheck } from "lucide-react";

// Converts a logged-in traveler into an organizer with a pending profile.
export default function OrganizerOnboarding() {
  const { user, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await base44.auth.updateMe({ role: "organizer" });
      const existing = await base44.entities.OrganizerProfile.filter({ created_by_id: user.id });
      if (!existing.length) {
        await base44.entities.OrganizerProfile.create({
          full_name: name || user.full_name || "New Organizer",
          bio,
          phone,
          avatar_url: avatar,
          verification_status: "pending",
          verified: false,
        });
      }
      await checkUserAuth();
      qc.invalidateQueries();
      navigate("/organizer");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600"><Briefcase size={24} /></span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Become an organizer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your organizer profile. Our admin team reviews new organizers before tours go live.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Organizer name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" placeholder="+998 ..." />
          </div>
          <div>
            <label className="text-sm font-medium">About your business</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400" placeholder="What kind of tours do you run? What makes you special?" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Submit for verification
          </button>
        </form>
      </div>
    </div>
  );
}