import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

import {
  Briefcase,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function OrganizerOnboarding() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState(
    user?.phone || ""
  );
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(
    user?.avatar_url || ""
  );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!user) {
      setError(
        "You must be logged in."
      );
      return;
    }

    // Backendda organizer profile
    // faqat ORGANIZER role uchun yaratiladi.
    if (
      String(user.role).toLowerCase() !==
      "organizer"
    ) {
      setError(
        "Your account is not an organizer account. Please register as an Organizer."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Organizer name is required."
      );
      return;
    }

    setBusy(true);

    try {
      // ========================================================
      // PROFILE ALREADY EXISTS?
      // ========================================================

      const organizers =
        await apiGet("/organizers");

      const existing =
        organizers.find(
          (item) =>
            Number(item.user_id) ===
            Number(user.id)
        );

      // Agar profile mavjud bo'lsa,
      // qayta yaratmaymiz.
      if (existing) {
        await qc.invalidateQueries({
          queryKey: ["organizers"],
        });

        navigate("/organizer");
        return;
      }

      // ========================================================
      // CREATE ORGANIZER PROFILE
      // ========================================================

      await apiPost("/organizers", {
        full_name: name.trim(),


        bio:
          bio.trim() || null,

        phone:
          phone.trim() || null,

        avatar_url:
          avatar.trim() || null,

        cover_url: null,
      });

      // ========================================================
      // REFRESH CACHE
      // ========================================================

      await qc.invalidateQueries({
        queryKey: ["organizers"],
      });

      await qc.invalidateQueries({
        queryKey: [
          "my-organizer-profile",
        ],
      });

      // ========================================================
      // GO TO DASHBOARD
      // ========================================================

      navigate("/organizer");

    } catch (err) {
      console.error(
        "ORGANIZER ONBOARDING ERROR:",
        err
      );

      setError(
        err?.message ||
          "Organizer profile yaratishda xatolik yuz berdi."
      );

    } finally {
      setBusy(false);
    }
  };

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">

        <div className="rounded-2xl border border-border bg-card p-8 text-center">

          <AlertTriangle
            size={32}
            className="mx-auto text-amber-500"
          />

          <h1 className="mt-4 text-xl font-semibold">
            Login required
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You must log in before creating an organizer profile.
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // TRAVELER ACCOUNT
  // ============================================================

  if (
    String(user.role).toLowerCase() !==
    "organizer"
  ) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">

          <AlertTriangle
            size={32}
            className="text-amber-600"
          />

          <h1 className="mt-4 text-xl font-semibold text-amber-900">
            Organizer account required
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            Sizning hozirgi accountingiz traveler.
            Hozirgi backendda traveler accountni
            organizerga aylantirish endpointi hali
            mavjud emas.
          </p>

          <p className="mt-3 text-sm text-amber-800">
            Yangi organizer account register
            qilayotganda Account type sifatida
            Organizer tanlang.
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // FORM
  // ============================================================

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">

        {/* HEADER */}

        <div className="flex items-start gap-4">

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">

            <Briefcase size={24} />

          </div>

          <div>

            <h1 className="text-2xl font-bold tracking-tight">
              Become an organizer
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Set up your organizer profile.
              Your tours will be reviewed by
              admin before going live.
            </p>

          </div>

        </div>

        {/* FORM */}

        <form
          onSubmit={submit}
          className="mt-8 space-y-5"
        >

          {/* ORGANIZER NAME */}

          <div>

            <label className="text-sm font-medium">
              Organizer name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              placeholder="e.g. TripNet Adventures"
              required
            />

          </div>

          {/* PHONE */}

          <div>

            <label className="text-sm font-medium">
              Phone
            </label>

            <input
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              placeholder="+998 90 123 45 67"
            />

          </div>

          {/* BIO */}

          <div>

            <label className="text-sm font-medium">
              About your business
            </label>

            <textarea
              value={bio}
              onChange={(e) =>
                setBio(
                  e.target.value
                )
              }
              rows={5}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              placeholder="What kind of tours do you organize? Tell travelers about your experience..."
            />

          </div>

          {/* AVATAR URL */}

          <div>

            <label className="text-sm font-medium">
              Logo / Avatar URL
            </label>

            <input
              type="url"
              value={avatar}
              onChange={(e) =>
                setAvatar(
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              placeholder="https://..."
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Image uploadni keyin alohida
              storage backend bilan ulaymiz.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {busy ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Creating profile...
              </>
            ) : (
              <>
                <ShieldCheck
                  size={16}
                />

                Create organizer profile
              </>
            )}

          </button>

        </form>

      </div>

    </div>
  );
}