import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Compass, Briefcase, Loader2 } from "lucide-react";
import { slugify } from "@/lib/triphub";

// Shown to logged-in users who have no role yet — lets them pick Traveler or Organizer.
export default function RoleOnboarding() {
  const { user, checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const choose = async (role) => {
    setError("");
    setLoading(role);
    try {
      await base44.auth.updateMe({ role });
      if (role === "organizer") {
        // Create a pending organizer profile if none exists.
        const existing = await base44.entities.OrganizerProfile.filter({ created_by_id: user.id });
        if (!existing.length) {
          await base44.entities.OrganizerProfile.create({
            full_name: user.full_name || "New Organizer",
            bio: "",
            verification_status: "pending",
            verified: false,
          });
        }
      }
      await checkUserAuth();
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 backdrop-blur p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight">Welcome to TripHub 👋</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose how you want to use TripHub. You can change your role later from your profile settings.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => choose("traveler")}
            disabled={!!loading}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 disabled:opacity-60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
              <Compass size={22} />
            </span>
            <span className="font-semibold">I'm a Traveler</span>
            <span className="text-xs text-muted-foreground">Search, book and review mini tours.</span>
            {loading === "traveler" && <Loader2 size={16} className="animate-spin" />}
          </button>

          <button
            onClick={() => choose("organizer")}
            disabled={!!loading}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50/50 disabled:opacity-60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
              <Briefcase size={22} />
            </span>
            <span className="font-semibold">I'm an Organizer</span>
            <span className="text-xs text-muted-foreground">Create and manage tours, accept bookings.</span>
            {loading === "organizer" && <Loader2 size={16} className="animate-spin" />}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}