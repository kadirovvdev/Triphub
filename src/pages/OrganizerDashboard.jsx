import React, {
  useEffect,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/lib/AuthContext";

import {
  useSearchParams,
  Link,
} from "react-router-dom";

import {
  apiGet,
  apiPatch,
  apiPost,
} from "@/api/apiClient";

import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import ImageUploader from "@/components/ImageUploader";

import {
  LayoutDashboard,
  Compass,
  Calendar,
  Star,
  User as UserIcon,
  Plus,
  Loader2,
  Check,
  X,
  Hourglass,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ExternalLink,
  Pencil,
  Send,
  Clock3,
  Save,
} from "lucide-react";

import {
  formatPrice,
  formatDate,
} from "@/lib/triphub";


const TABS = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    key: "tours",
    label: "My Tours",
    icon: Compass,
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: Calendar,
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: Star,
  },
  {
    key: "profile",
    label: "Profile",
    icon: UserIcon,
  },
];


const STATUS_BADGE = {
  draft:
    "bg-slate-100 text-slate-600",

  pending:
    "bg-amber-50 text-amber-700",

  approved:
    "bg-emerald-50 text-emerald-700",

  rejected:
    "bg-rose-50 text-rose-700",
};


const BOOKING_STATUS = {
  pending: {
    label: "Pending",
    icon: Hourglass,
    cls:
      "bg-amber-50 text-amber-700",
  },

  approved: {
    label: "Approved",
    icon: CheckCircle2,
    cls:
      "bg-emerald-50 text-emerald-700",
  },

  rejected: {
    label: "Rejected",
    icon: XCircle,
    cls:
      "bg-rose-50 text-rose-700",
  },

  cancelled: {
    label: "Cancelled",
    icon: X,
    cls:
      "bg-slate-100 text-slate-600",
  },
};


export default function OrganizerDashboard() {
  const { user } = useAuth();

  const [
    params,
    setParams,
  ] = useSearchParams();

  const tab =
    params.get("tab") ||
    "overview";

  const qc =
    useQueryClient();


  // ============================================================
  // ORGANIZER PROFILE
  // ============================================================

  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: [
      "organizer-me",
    ],

    queryFn: () =>
      apiGet(
        "/organizers/me"
      ),

    enabled:
      Boolean(user) &&
      String(
        user?.role || ""
      ).toLowerCase() ===
        "organizer",

    retry: false,
  });


  // ============================================================
  // ALL TOURS
  // ============================================================

  const {
    data: allTours = [],
    isLoading: loadingTours,
    error: toursError,
  } = useQuery({
    queryKey: [
      "tours",
    ],

    queryFn: () =>
      apiGet(
        "/tours"
      ),

    enabled:
      Boolean(profile),
  });


  // ============================================================
  // ORGANIZER TOURS
  // ============================================================

  const tours =
    profile
      ? allTours.filter(
          (tour) =>
            Number(
              tour.organizer_profile_id
            ) ===
            Number(
              profile.id
            )
        )
      : [];


  // ============================================================
  // BOOKINGS
  // ============================================================

  const {
    data: bookings = [],
    isLoading:
      loadingBookings,
    error:
      bookingsError,
  } = useQuery({
    queryKey: [
      "organizer-bookings",
      profile?.id,
    ],

    queryFn: () =>
      apiGet(
        "/bookings/organizer"
      ),

    enabled:
      Boolean(profile),
  });


  // ============================================================
  // EDIT REQUESTS
  // ============================================================

  const {
    data: editRequests = [],
    isLoading:
      loadingEditRequests,
    error:
      editRequestsError,
  } = useQuery({
    queryKey: [
      "tour-edit-requests",
      "mine",
    ],

    queryFn: () =>
      apiGet(
        "/tour-edit-requests/mine"
      ),

    enabled:
      Boolean(profile),

    retry: false,
  });



  // ============================================================
  // REVIEWS
  // ============================================================

  const {
    data: reviews = [],
    isLoading:
      loadingReviews,
    error:
      reviewsError,
  } = useQuery({
    queryKey: [
      "organizer-reviews",
      profile?.id,
    ],

    queryFn: () =>
      apiGet(
        "/reviews/organizer"
      ),

    enabled:
      Boolean(profile),

    retry: false,
  });


  // ============================================================
  // CALCULATIONS
  // ============================================================

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        "pending"
    );

  const approvedTours =
    tours.filter(
      (tour) =>
        tour.status ===
        "approved"
    );

  const approvedBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        "approved"
    );

  const totalRevenue =
    approvedBookings.reduce(
      (
        sum,
        booking
      ) =>
        sum +
        Number(
          booking.total_price ||
            0
        ),
      0
    );


  // ============================================================
  // ACTIVE BOOKING
  // ============================================================

  const hasActiveBooking = (
    tourId
  ) => {
    return bookings.some(
      (booking) =>
        Number(
          booking.tour_id
        ) ===
          Number(
            tourId
          ) &&
        (
          booking.status ===
            "pending" ||
          booking.status ===
            "approved"
        )
    );
  };


  // ============================================================
  // LATEST EDIT REQUEST
  // ============================================================

  const getLatestEditRequest = (
    tourId
  ) => {
    const requests =
      editRequests
        .filter(
          (request) =>
            Number(
              request.tour_id
            ) ===
            Number(
              tourId
            )
        )
        .sort(
          (a, b) =>
            Number(
              b.id
            ) -
            Number(
              a.id
            )
        );

    return (
      requests[0] ||
      null
    );
  };


  // ============================================================
  // BOOKING STATUS
  // ============================================================

  const actBooking = async (
    action,
    bookingId
  ) => {
    try {
      const newStatus =
        action === "approve"
          ? "approved"
          : action === "reject"
          ? "rejected"
          : null;

      if (!newStatus) {
        throw new Error(
          "Invalid booking action"
        );
      }

      await apiPatch(
        `/bookings/${bookingId}/status`,
        {
          status:
            newStatus,
        }
      );

      await qc.invalidateQueries({
        queryKey: [
          "organizer-bookings",
          profile?.id,
        ],
      });

      await qc.invalidateQueries({
        queryKey: [
          "tours",
        ],
      });

    } catch (error) {
      console.error(
        "BOOKING STATUS ERROR:",
        error
      );

      alert(
        error?.message ||
          "Booking statusini o'zgartirishda xatolik yuz berdi."
      );
    }
  };


  // ============================================================
  // REQUEST EDIT
  // ============================================================

  const requestTourEdit =
    async (
      tour
    ) => {
      const reason =
        window.prompt(
          `Nima uchun "${tour.title}" tourini o'zgartirmoqchisiz?\n\nSababni yozing:`
        );

      if (
        reason === null
      ) {
        return;
      }

      const trimmedReason =
        reason.trim();

      if (
        trimmedReason.length <
        5
      ) {
        alert(
          "Sabab kamida 5 ta belgidan iborat bo'lishi kerak."
        );

        return;
      }

      try {
        await apiPost(
          `/tour-edit-requests/tours/${tour.id}`,
          {
            reason:
              trimmedReason,
          }
        );

        await qc.invalidateQueries({
          queryKey: [
            "tour-edit-requests",
            "mine",
          ],
        });

        alert(
          "Edit so'rovi adminga yuborildi."
        );

      } catch (error) {
        console.error(
          "EDIT REQUEST ERROR:",
          error
        );

        alert(
          error?.message ||
            "Edit so'rovini yuborishda xatolik yuz berdi."
        );
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loadingProfile
  ) {
    return (
      <CenterLoader />
    );
  }


  // ============================================================
  // PROFILE ERROR
  // ============================================================

  if (
    profileError
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">

        <EmptyState
          icon={
            Compass
          }
          title="Organizer profilini yuklab bo'lmadi"
          description={
            profileError?.message ||
            "Server bilan bog'lanishda xatolik yuz berdi."
          }
        />

      </div>
    );
  }


  // ============================================================
  // NO PROFILE
  // ============================================================

  if (
    !profile
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">

        <EmptyState
          icon={
            Compass
          }
          title="Organizer profile topilmadi"
          description="Organizer sifatida tour yaratish uchun organizer profilingiz bo'lishi kerak."
          actionLabel="Become an organizer"
          actionTo="/organizer/onboarding"
        />

      </div>
    );
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">


      {/* HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-3">

        <div>

          <h1 className="text-3xl font-bold tracking-tight">
            Organizer Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              profile.full_name
            }
          </p>

        </div>


        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            profile.verification_status ===
            "approved"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >

          <ShieldCheck
            size={13}
          />

          {profile.verification_status ===
          "approved"
            ? "Verified organizer"
            : "Organizer"}

        </span>

      </div>


      {/* TABS */}

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">

        {TABS.map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            return (
              <button
                key={
                  item.key
                }
                type="button"
                onClick={() =>
                  setParams({
                    tab:
                      item.key,
                  })
                }
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab ===
                  item.key
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >

                <Icon
                  size={16}
                />

                {
                  item.label
                }

                {item.key ===
                  "bookings" &&
                  pendingBookings.length >
                    0 && (

                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">

                      {
                        pendingBookings.length
                      }

                    </span>

                  )}

              </button>
            );
          }
        )}

      </div>


      {/* CONTENT */}

      <div className="mt-8">


        {/* OVERVIEW */}

        {tab ===
          "overview" && (

          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                icon={Compass}
                label="Total tours"
                value={
                  tours.length
                }
                hint={`${approvedTours.length} approved`}
                tone="emerald"
              />

              <StatCard
                icon={Calendar}
                label="Bookings"
                value={
                  bookings.length
                }
                hint={`${pendingBookings.length} pending`}
                tone="indigo"
              />

              <StatCard
                icon={Star}
                label="Avg. rating"
                value={
                  profile.rating
                    ? Number(
                        profile.rating
                      ).toFixed(
                        1
                      )
                    : "—"
                }
                hint={`${profile.reviews_count || reviews.length || 0} review(s)`}
                tone="amber"
              />

              <StatCard
                icon={
                  CheckCircle2
                }
                label="Revenue"
                value={
                  formatPrice(
                    totalRevenue
                  )
                }
                hint="approved bookings"
                tone="sky"
              />

            </div>


            <div className="rounded-2xl border border-border bg-card p-6">

              <h3 className="font-semibold">
                Latest bookings
              </h3>

              {loadingBookings ? (

                <div className="mt-4">

                  <Loader2 className="animate-spin text-muted-foreground" />

                </div>

              ) : bookings.length ===
                0 ? (

                <p className="mt-2 text-sm text-muted-foreground">
                  No bookings yet.
                </p>

              ) : (

                <div className="mt-3 divide-y divide-border">

                  {bookings
                    .slice(
                      0,
                      5
                    )
                    .map(
                      (
                        booking
                      ) => (

                        <div
                          key={
                            booking.id
                          }
                          className="py-3"
                        >

                          <BookingRow
                            b={
                              booking
                            }
                            tours={
                              tours
                            }
                            compact
                          />

                        </div>

                      )
                    )}

                </div>

              )}

            </div>

          </div>

        )}


        {/* TOURS */}

        {tab ===
          "tours" && (

          <>

            <div className="mb-4 flex justify-end">

              <Link
                to="/organizer/tours/new"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >

                <Plus
                  size={16}
                />

                Create tour

              </Link>

            </div>


            {loadingTours ||
            loadingEditRequests ? (

              <CenterLoader />

            ) : toursError ? (

              <EmptyState
                icon={
                  Compass
                }
                title="Tourlarni yuklab bo'lmadi"
                description={
                  toursError?.message ||
                  "Server bilan bog'lanishda xatolik."
                }
              />

            ) : editRequestsError ? (

              <EmptyState
                icon={
                  Pencil
                }
                title="Edit requestlarni yuklab bo'lmadi"
                description={
                  editRequestsError?.message ||
                  "Server bilan bog'lanishda xatolik."
                }
              />

            ) : tours.length ===
              0 ? (

              <EmptyState
                icon={
                  Compass
                }
                title="No tours yet"
                description="Create your first tour to start receiving bookings."
                actionLabel="Create tour"
                actionTo="/organizer/tours/new"
              />

            ) : (

              <div className="space-y-3">

                {tours.map(
                  (
                    tour
                  ) => {
                    const activeBooking =
                      hasActiveBooking(
                        tour.id
                      );

                    const editRequest =
                      getLatestEditRequest(
                        tour.id
                      );

                    const pendingRequest =
                      editRequest?.status ===
                      "pending";

                    const approvedRequest =
                      editRequest?.status ===
                        "approved" &&
                      !editRequest?.used_at;


                    return (
                      <div
                        key={
                          tour.id
                        }
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
                      >

                        {/* IMAGE */}

                        <span className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">

                          {tour.images?.[0] ? (

                            <img
                              src={
                                tour.images[0]
                              }
                              alt={
                                tour.title
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : null}

                        </span>


                        {/* INFO */}

                        <div className="flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <Link
                              to={`/tours/${tour.id}`}
                              className="font-semibold hover:text-emerald-600"
                            >

                              {
                                tour.title
                              }

                            </Link>


                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                STATUS_BADGE[
                                  tour.status
                                ] ||
                                STATUS_BADGE.pending
                              }`}
                            >

                              {
                                tour.status
                              }

                            </span>


                            {activeBooking && (

                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                Active booking
                              </span>

                            )}


                            {pendingRequest && (

                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Edit requested
                              </span>

                            )}


                            {approvedRequest && (

                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Edit approved
                              </span>

                            )}

                          </div>


                          <p className="mt-0.5 text-xs text-muted-foreground">

                            {formatDate(
                              tour.start_date
                            )}

                            {" · "}

                            {formatPrice(
                              tour.price
                            )}

                            {" · "}

                            {
                              tour.available_seats
                            }{" "}
                            seats

                          </p>

                        </div>


                        {/* ACTIONS */}

                        <div className="flex flex-wrap items-center gap-2">


                          {!activeBooking && (

                            <Link
                              to={`/organizer/tours/${tour.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >

                              <Pencil
                                size={13}
                              />

                              Edit

                            </Link>

                          )}


                          {activeBooking &&
                            !pendingRequest &&
                            !approvedRequest && (

                            <button
                              type="button"
                              onClick={() =>
                                requestTourEdit(
                                  tour
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                            >

                              <Send
                                size={13}
                              />

                              Request edit

                            </button>

                          )}


                          {activeBooking &&
                            pendingRequest && (

                            <button
                              type="button"
                              disabled
                              className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                            >

                              <Clock3
                                size={13}
                              />

                              Edit request pending

                            </button>

                          )}


                          {activeBooking &&
                            approvedRequest && (

                            <Link
                              to={`/organizer/tours/${tour.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >

                              <Pencil
                                size={13}
                              />

                              Edit approved

                            </Link>

                          )}


                          <Link
                            to={`/tours/${tour.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                          >

                            <ExternalLink
                              size={13}
                            />

                            Open

                          </Link>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </>

        )}


        {/* BOOKINGS */}

        {tab ===
          "bookings" && (

          loadingBookings ? (

            <CenterLoader />

          ) : bookingsError ? (

            <EmptyState
              icon={
                Calendar
              }
              title="Bookinglarni yuklab bo'lmadi"
              description={
                bookingsError?.message ||
                "Server bilan bog'lanishda xatolik."
              }
            />

          ) : bookings.length ===
            0 ? (

            <EmptyState
              icon={
                Calendar
              }
              title="No bookings"
              description="Traveler bookings for your tours will appear here."
            />

          ) : (

            <div className="divide-y divide-border rounded-2xl border border-border bg-card">

              {bookings.map(
                (
                  booking
                ) => (

                  <div
                    key={
                      booking.id
                    }
                    className="p-4"
                  >

                    <BookingRow
                      b={
                        booking
                      }
                      tours={
                        tours
                      }

                      onApprove={
                        booking.status ===
                        "pending"
                          ? () =>
                              actBooking(
                                "approve",
                                booking.id
                              )
                          : null
                      }

                      onReject={
                        booking.status ===
                        "pending"
                          ? () =>
                              actBooking(
                                "reject",
                                booking.id
                              )
                          : null
                      }
                    />

                  </div>

                )
              )}

            </div>

          )

        )}


        {/* REVIEWS */}

        {tab ===
          "reviews" && (

          loadingReviews ? (

            <CenterLoader />

          ) : reviewsError ? (

            <EmptyState
              icon={Star}
              title="Reviewlarni yuklab bo'lmadi"
              description={
                reviewsError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : reviews.length ===
            0 ? (

            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Travelerlar tourlaringizga review qoldirganda shu yerda ko'rinadi."
            />

          ) : (

            <div className="space-y-4">

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Average rating
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Star
                      size={22}
                      className="text-amber-500"
                      fill="currentColor"
                    />

                    <span className="text-2xl font-bold">
                      {profile.rating
                        ? Number(
                            profile.rating
                          ).toFixed(
                            1
                          )
                        : "—"}
                    </span>
                  </div>
                </div>


                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total reviews
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {profile.reviews_count ||
                      reviews.length}
                  </p>
                </div>


                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Reviewed tours
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {
                      new Set(
                        reviews.map(
                          (review) =>
                            review.tour_id
                        )
                      ).size
                    }
                  </p>
                </div>

              </div>


              <div className="space-y-3">

                {reviews.map(
                  (review) => {

                    const reviewTour =
                      tours.find(
                        (tour) =>
                          Number(
                            tour.id
                          ) ===
                          Number(
                            review.tour_id
                          )
                      );

                    return (
                      <div
                        key={
                          review.id
                        }
                        className="rounded-2xl border border-border bg-card p-5"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div className="flex min-w-0 gap-3">

                            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 font-semibold text-emerald-700">

                              {review.traveler_avatar_url ? (

                                <img
                                  src={
                                    review.traveler_avatar_url
                                  }
                                  alt=""
                                  className="h-full w-full object-cover"
                                />

                              ) : (

                                (
                                  review.traveler_name ||
                                  "T"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()

                              )}

                            </div>


                            <div className="min-w-0">

                              <p className="font-semibold">
                                {review.traveler_name ||
                                  "Traveler"}
                              </p>


                              <div className="mt-1 flex">

                                {[1, 2, 3, 4, 5].map(
                                  (value) => (

                                    <Star
                                      key={
                                        value
                                      }
                                      size={14}
                                      className={
                                        value <=
                                        Number(
                                          review.rating
                                        )
                                          ? "text-amber-500"
                                          : "text-slate-300"
                                      }
                                      fill={
                                        value <=
                                        Number(
                                          review.rating
                                        )
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />

                                  )
                                )}

                              </div>


                              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                                {review.comment}
                              </p>


                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">

                                {reviewTour && (

                                  <Link
                                    to={`/tours/${reviewTour.id}`}
                                    className="font-medium text-emerald-600 hover:underline"
                                  >
                                    {reviewTour.title}
                                  </Link>

                                )}

                                {review.created_at && (
                                  <span>
                                    {formatDate(
                                      review.created_at
                                    )}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>


                          {reviewTour && (

                            <Link
                              to={`/tours/${reviewTour.id}`}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                            >

                              <ExternalLink
                                size={13}
                              />

                              Open tour

                            </Link>

                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          )

        )}


        {/* PROFILE */}

        {tab ===
          "profile" && (

          <OrganizerProfileEditor
            profile={
              profile
            }
            queryClient={
              qc
            }
          />

        )}

      </div>

    </div>
  );
}


// ============================================================
// BOOKING ROW
// ============================================================

function BookingRow({
  b,
  tours,
  onApprove,
  onReject,
  compact,
}) {
  const tour =
    tours.find(
      (item) =>
        Number(
          item.id
        ) ===
        Number(
          b.tour_id
        )
    );

  const meta =
    BOOKING_STATUS[
      b.status
    ] ||
    BOOKING_STATUS.pending;

  const StatusIcon =
    meta.icon;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="font-medium">
          {
            tour?.title ||
            "Tour"
          }
        </p>

        <p className="text-xs text-muted-foreground">

          {
            b.full_name
          }

          {" · "}

          {b.seats} seat(s)

          {" · "}

          {formatPrice(
            b.total_price
          )}

          {" · "}

          {
            b.phone ||
            "no phone"
          }

          {b.note && (
            <>
              {" · "}
              “{b.note}”
            </>
          )}

        </p>

      </div>


      <div className="flex flex-wrap items-center gap-2">

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}
        >

          <StatusIcon
            size={12}
          />

          {
            meta.label
          }

        </span>


        {!compact &&
          onApprove && (

          <button
            type="button"
            onClick={
              onApprove
            }
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >

            <Check
              size={13}
            />

            Approve

          </button>

        )}


        {!compact &&
          onReject && (

          <button
            type="button"
            onClick={
              onReject
            }
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-rose-50"
          >

            <X
              size={13}
            />

            Reject

          </button>

        )}


        {tour && (

          <Link
            to={`/tours/${tour.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >

            <ExternalLink
              size={13}
            />

          </Link>

        )}

      </div>

    </div>
  );
}


// ============================================================
// ORGANIZER PROFILE EDITOR
// ============================================================

function OrganizerProfileEditor({
  profile,
  queryClient,
}) {
  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState({
    full_name: "",
    phone: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
  });


  // ============================================================
  // SYNC PROFILE
  // ============================================================

  useEffect(() => {
    setForm({
      full_name:
        profile?.full_name ||
        "",

      phone:
        profile?.phone ||
        "",

      bio:
        profile?.bio ||
        "",

      avatar_url:
        profile?.avatar_url ||
        "",

      cover_url:
        profile?.cover_url ||
        "",
    });
  }, [
    profile,
  ]);


  const set = (
    key,
    value
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );
  };


  // ============================================================
  // CANCEL
  // ============================================================

  const cancelEdit = () => {
    setEditing(false);

    setError("");
    setSuccess("");

    setForm({
      full_name:
        profile?.full_name ||
        "",

      phone:
        profile?.phone ||
        "",

      bio:
        profile?.bio ||
        "",

      avatar_url:
        profile?.avatar_url ||
        "",

      cover_url:
        profile?.cover_url ||
        "",
    });
  };


  // ============================================================
  // SAVE
  // ============================================================

  const saveProfile =
    async (
      event
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");


      if (
        form.full_name
          .trim()
          .length < 2
      ) {
        setError(
          "Full name kamida 2 ta belgidan iborat bo'lishi kerak."
        );

        return;
      }


      setSaving(true);

      try {
        await apiPatch(
          "/organizers/me",
          {
            full_name:
              form.full_name.trim(),

            phone:
              form.phone.trim() ||
              null,

            bio:
              form.bio.trim() ||
              null,

            avatar_url:
              form.avatar_url ||
              null,

            cover_url:
              form.cover_url ||
              null,
          }
        );


        await queryClient.invalidateQueries({
          queryKey: [
            "organizer-me",
          ],
        });


        await queryClient.invalidateQueries({
          queryKey: [
            "organizers",
          ],
        });


        await queryClient.invalidateQueries({
          queryKey: [
            "admin-organizers",
          ],
        });


        setSuccess(
          "Profile muvaffaqiyatli yangilandi."
        );

        setEditing(false);

      } catch (err) {
        console.error(
          "PROFILE UPDATE ERROR:",
          err
        );

        setError(
          err?.message ||
            "Profilni yangilashda xatolik yuz berdi."
        );

      } finally {
        setSaving(false);
      }
    };


  // ============================================================
  // VIEW MODE
  // ============================================================

  if (!editing) {
    return (
      <div className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">


        {/* COVER */}

        <div className="relative h-44 bg-gradient-to-r from-emerald-600 to-teal-600">

          {profile.cover_url && (

            <img
              src={
                profile.cover_url
              }
              alt=""
              className="h-full w-full object-cover"
            />

          )}

        </div>


        <div className="p-6">


          {/* PROFILE HEADER */}

          <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end">

            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-emerald-100 text-3xl font-bold text-emerald-700">

              {profile.avatar_url ? (

                <img
                  src={
                    profile.avatar_url
                  }
                  alt={
                    profile.full_name
                  }
                  className="h-full w-full object-cover"
                />

              ) : (

                (
                  profile.full_name ||
                  "O"
                )
                  .charAt(0)
                  .toUpperCase()

              )}

            </div>


            <div className="flex flex-1 flex-wrap items-end justify-between gap-4">

              <div>

                <h2 className="text-2xl font-bold">
                  {
                    profile.full_name
                  }
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Organizer profile
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  setSuccess("");
                  setError("");
                  setEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >

                <Pencil
                  size={15}
                />

                Edit profile

              </button>

            </div>

          </div>


          {/* DETAILS */}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </p>

              <p className="mt-1 text-sm">
                {
                  profile.phone ||
                  "—"
                }
              </p>

            </div>


            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Verification
              </p>

              <p className="mt-1 text-sm">
                {
                  profile.verification_status
                }
              </p>

            </div>

          </div>


          <div className="mt-6">

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bio
            </p>

            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
              {
                profile.bio ||
                "—"
              }
            </p>

          </div>


          {success && (

            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>

          )}

        </div>

      </div>
    );
  }


  // ============================================================
  // EDIT MODE
  // ============================================================

  return (
    <form
      onSubmit={
        saveProfile
      }
      className="max-w-3xl space-y-6"
    >

      <div className="rounded-2xl border border-border bg-card p-6">

        <div className="flex items-center justify-between gap-3">

          <div>

            <h2 className="text-xl font-semibold">
              Edit organizer profile
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Update your public organizer information.
            </p>

          </div>


          <button
            type="button"
            onClick={
              cancelEdit
            }
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>

        </div>


        <div className="mt-6 space-y-6">


          {/* FULL NAME */}

          <div>

            <label className="text-sm font-medium">
              Full name
            </label>

            <input
              value={
                form.full_name
              }
              onChange={(
                event
              ) =>
                set(
                  "full_name",
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              required
            />

          </div>


          {/* PHONE */}

          <div>

            <label className="text-sm font-medium">
              Phone
            </label>

            <input
              value={
                form.phone
              }
              onChange={(
                event
              ) =>
                set(
                  "phone",
                  event.target.value
                )
              }
              placeholder="+998 90 123 45 67"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            />

          </div>


          {/* BIO */}

          <div>

            <label className="text-sm font-medium">
              Bio
            </label>

            <textarea
              value={
                form.bio
              }
              onChange={(
                event
              ) =>
                set(
                  "bio",
                  event.target.value
                )
              }
              rows={6}
              maxLength={1200}
              placeholder="Tell travelers about yourself..."
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            />

            <p className="mt-1 text-right text-xs text-muted-foreground">
              {
                form.bio.length
              }
              /1200
            </p>

          </div>


          {/* AVATAR */}

          <div>

            <label className="text-sm font-medium">
              Profile photo
            </label>

            <p className="mt-1 text-xs text-muted-foreground">
              Upload one profile image.
            </p>

            <div className="mt-3 max-w-xs">

              <ImageUploader
                value={
                  form.avatar_url
                    ? [
                        form.avatar_url,
                      ]
                    : []
                }
                onChange={(
                  images
                ) =>
                  set(
                    "avatar_url",
                    images[0] ||
                      ""
                  )
                }
                max={1}
              />

            </div>

          </div>


          {/* COVER */}

          <div>

            <label className="text-sm font-medium">
              Cover image
            </label>

            <p className="mt-1 text-xs text-muted-foreground">
              This image appears at the top of your public organizer profile.
            </p>

            <div className="mt-3 max-w-md">

              <ImageUploader
                value={
                  form.cover_url
                    ? [
                        form.cover_url,
                      ]
                    : []
                }
                onChange={(
                  images
                ) =>
                  set(
                    "cover_url",
                    images[0] ||
                      ""
                  )
                }
                max={1}
              />

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>

          )}


          {/* SAVE */}

          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >

              {saving ? (

                <Loader2
                  size={16}
                  className="animate-spin"
                />

              ) : (

                <Save
                  size={16}
                />

              )}

              {saving
                ? "Saving..."
                : "Save changes"}

            </button>


            <button
              type="button"
              onClick={
                cancelEdit
              }
              disabled={
                saving
              }
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              Cancel
            </button>

          </div>

        </div>

      </div>

    </form>
  );
}


// ============================================================
// LOADER
// ============================================================

function CenterLoader() {
  return (
    <div className="grid place-items-center py-20">

      <Loader2 className="animate-spin text-muted-foreground" />

    </div>
  );
}
