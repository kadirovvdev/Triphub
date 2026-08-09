import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { apiGet } from "@/api/apiClient";

import { Image } from "@/components/ui/image";
import RatingStars from "@/components/RatingStars";
import EmptyState from "@/components/EmptyState";

import {
  ShieldCheck,
  Briefcase,
  Loader2,
} from "lucide-react";


export default function Organizers() {

  const {
    data: allOrganizers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organizers"],

    queryFn: () =>
      apiGet("/organizers"),
  });

  // Public page'da faqat
  // admin tasdiqlagan organizerlar.
  const organizers =
    allOrganizers
      .filter(
        (organizer) =>
          organizer.verified ===
          true
      )
      .sort(
        (a, b) =>
          Number(
            b.rating || 0
          ) -
          Number(
            a.rating || 0
          )
      );

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6">

        <div className="grid min-h-[300px] place-items-center">

          <Loader2 className="animate-spin text-muted-foreground" />

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">

        <EmptyState
          icon={ShieldCheck}
          title="Organizersni yuklab bo'lmadi"
          description={
            error?.message ||
            "Server bilan bog'lanishda xatolik."
          }
        />

      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6">

      <h1 className="text-3xl font-bold tracking-tight">

        Verified organizers

      </h1>

      <p className="mt-1 text-sm text-muted-foreground">

        Meet the local experts
        behind TripNet tours.

      </p>

      {organizers.length ===
      0 ? (

        <div className="mt-10">

          <EmptyState
            icon={ShieldCheck}
            title="No verified organizers yet"
            description="Verified organizer profiles will appear here."
          />

        </div>

      ) : (

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {organizers.map(
            (organizer) => (

              <Link
                key={
                  organizer.id
                }
                to={`/organizers/${organizer.id}`}
                className="group flex gap-4 rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md"
              >

                {/* AVATAR */}

                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-700">

                  {organizer.avatar_url ? (

                    <Image
                      src={
                        organizer.avatar_url
                      }
                      alt={
                        organizer.full_name
                      }
                      className="h-full w-full"
                      fittingType="fill"
                    />

                  ) : (

                    (
                      organizer.full_name ||
                      "O"
                    )
                      .charAt(0)
                      .toUpperCase()

                  )}

                </span>

                {/* CONTENT */}

                <div className="min-w-0">

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">

                    <ShieldCheck
                      size={12}
                    />

                    Verified

                  </span>

                  <h3 className="font-semibold leading-tight group-hover:text-emerald-600">

                    {
                      organizer.full_name
                    }

                  </h3>

                  <div className="mt-1 flex items-center gap-1.5">

                    <RatingStars
                      value={
                        organizer.rating ||
                        0
                      }
                      size={13}
                    />

                    <span className="text-xs text-muted-foreground">

                      {organizer.rating
                        ? Number(
                            organizer.rating
                          ).toFixed(
                            1
                          )
                        : "New"}

                    </span>

                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">

                    {
                      organizer.bio ||
                      "Local tour organizer"
                    }

                  </p>

                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">

                    <Briefcase
                      size={12}
                    />

                    {
                      organizer.tours_count ||
                      0
                    }{" "}
                    tours

                  </p>

                </div>

              </Link>

            )
          )}

        </div>

      )}

    </div>
  );
}