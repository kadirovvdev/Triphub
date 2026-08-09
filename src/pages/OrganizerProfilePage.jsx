import React from "react";
import {
  useParams,
  Link,
} from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/api/apiClient";

import { Image } from "@/components/ui/image";
import TourCard from "@/components/TourCard";
import EmptyState from "@/components/EmptyState";
import RatingStars from "@/components/RatingStars";

import {
  ShieldCheck,
  Phone,
  Loader2,
  Compass,
  MapPin,
} from "lucide-react";


export default function OrganizerProfilePage() {
  const { id } =
    useParams();

  // ============================================================
  // ORGANIZER
  // ============================================================

  const {
    data: organizer,
    isLoading: loadingOrganizer,
    error: organizerError,
  } = useQuery({
    queryKey: [
      "organizer",
      id,
    ],

    queryFn: () =>
      apiGet(
        `/organizers/${id}`
      ),

    enabled: !!id,
  });

  // ============================================================
  // CATEGORIES
  // ============================================================

  const {
    data: categories = [],
  } = useQuery({
    queryKey: ["categories"],

    queryFn: () =>
      apiGet("/categories"),
  });

  // ============================================================
  // TOURS
  // ============================================================

  const {
    data: allTours = [],
    isLoading: loadingTours,
  } = useQuery({
    queryKey: ["tours"],

    queryFn: () =>
      apiGet("/tours"),

    enabled: !!id,
  });

  // ============================================================
  // LOADING
  // ============================================================

  if (
    loadingOrganizer ||
    loadingTours
  ) {
    return (
      <div className="grid min-h-[60vh] place-items-center">

        <Loader2 className="animate-spin text-muted-foreground" />

      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (
    organizerError ||
    !organizer
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">

        <EmptyState
          icon={MapPin}
          title="Organizer not found"
          description={
            organizerError?.message
          }
          actionLabel="Back"
          actionTo="/organizers"
        />

      </div>
    );
  }

  // ============================================================
  // ONLY APPROVED TOURS FROM THIS ORGANIZER
  // ============================================================

  const tours =
    allTours.filter(
      (tour) =>
        Number(
          tour.organizer_profile_id
        ) ===
          Number(
            organizer.id
          ) &&
        tour.status ===
          "approved"
    );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      {/* COVER */}

      <div className="relative h-48 overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 sm:h-56">

        {organizer.cover_url && (

          <img
            src={
              organizer.cover_url
            }
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

        )}

        <div className="absolute inset-0 bg-black/10" />

      </div>

      {/* PROFILE */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="-mt-16 flex flex-col items-start gap-5 sm:flex-row sm:items-end">

          {/* AVATAR */}

          <span className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-background bg-emerald-100 text-3xl font-bold text-emerald-700">

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

          {/* PROFILE INFO */}

          <div className="flex-1 pb-2">

            {organizer.verified ? (

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">

                <ShieldCheck
                  size={13}
                />

                Verified organizer

              </span>

            ) : (

              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">

                Verification pending

              </span>

            )}

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">

              {
                organizer.full_name
              }

            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">

              <span className="inline-flex items-center gap-1.5">

                <RatingStars
                  value={
                    organizer.rating ||
                    0
                  }
                  size={15}
                />

                {organizer.rating
                  ? Number(
                      organizer.rating
                    ).toFixed(
                      1
                    )
                  : "New"}

                {" · "}

                {
                  organizer.reviews_count ||
                  0
                }{" "}
                reviews

              </span>

              {organizer.phone && (

                <span className="inline-flex items-center gap-1.5">

                  <Phone
                    size={14}
                  />

                  {
                    organizer.phone
                  }

                </span>

              )}

              <span className="inline-flex items-center gap-1.5">

                <Compass
                  size={14}
                />

                {tours.length} tours

              </span>

            </div>

          </div>

        </div>

        {/* BIO */}

        {organizer.bio && (

          <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-foreground/90">

            {
              organizer.bio
            }

          </p>

        )}

        {/* TOURS */}

        <h2 className="mt-10 text-xl font-semibold">

          Tours by{" "}
          {
            organizer.full_name
          }

        </h2>

        {tours.length ===
        0 ? (

          <div className="mt-6">

            <EmptyState
              icon={Compass}
              title="No tours yet"
              description="This organizer hasn't published approved tours yet."
            />

          </div>

        ) : (

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {tours.map(
              (tour) => (

                <TourCard
                  key={
                    tour.id
                  }
                  tour={
                    tour
                  }
                  category={
                    categories.find(
                      (
                        category
                      ) =>
                        Number(
                          category.id
                        ) ===
                        Number(
                          tour.category_id
                        )
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </div>

      <div className="h-16" />

      <Link
        to="/organizers"
        className="mx-auto block max-w-7xl px-6 pb-10 text-sm text-muted-foreground hover:text-foreground"
      >

        ← All organizers

      </Link>

    </div>
  );
}