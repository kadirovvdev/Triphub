import React, { useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/lib/AuthContext";

import {
  apiGet,
  apiPost,
  apiDelete,
} from "@/api/apiClient";

import { Image } from "@/components/ui/image";
import EmptyState from "@/components/EmptyState";

import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Car,
  Check,
  X,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Heart,
  Star,
} from "lucide-react";

import {
  formatPrice,
  formatDateRange,
} from "@/lib/triphub";


export default function TourDetail() {
  const { id } = useParams();

  const navigate =
    useNavigate();

  const qc =
    useQueryClient();

  const {
    user,
    isAuthenticated,
  } = useAuth();


  const isTraveler =
    String(
      user?.role || ""
    ).toLowerCase() ===
    "traveler";


  // ============================================================
  // TOUR
  // ============================================================

  const {
    data: tour,
    isLoading: tourLoading,
    error: tourError,
  } = useQuery({
    queryKey: [
      "tour",
      id,
    ],

    queryFn: () =>
      apiGet(
        `/tours/${id}`
      ),

    enabled:
      Boolean(id),
  });


  // ============================================================
  // CATEGORIES
  // ============================================================

  const {
    data: categories = [],
  } = useQuery({
    queryKey: [
      "categories",
    ],

    queryFn: () =>
      apiGet(
        "/categories"
      ),
  });


  // ============================================================
  // ORGANIZER
  // ============================================================

  const {
    data: organizer,
  } = useQuery({
    queryKey: [
      "organizer",
      tour?.organizer_profile_id,
    ],

    queryFn: () =>
      apiGet(
        `/organizers/${tour.organizer_profile_id}`
      ),

    enabled:
      Boolean(
        tour?.organizer_profile_id
      ),
  });


  // ============================================================
  // FAVORITES
  // ============================================================

  const {
    data: favorites = [],
    isLoading: favoritesLoading,
  } = useQuery({
    queryKey: [
      "favorites",
      user?.id,
    ],

    queryFn: () =>
      apiGet(
        "/favorites"
      ),

    enabled:
      isAuthenticated &&
      isTraveler,

    retry: false,
  });


  const isFavorite =
    favorites.some(
      (favorite) =>
        Number(
          favorite.tour_id
        ) ===
        Number(id)
    );


  const [
    favoriteBusy,
    setFavoriteBusy,
  ] = useState(false);


  const toggleFavorite =
    async () => {
      if (!isAuthenticated) {
        navigate(
          "/login"
        );

        return;
      }


      if (!isTraveler) {
        alert(
          "Favorites faqat traveler account uchun mavjud."
        );

        return;
      }


      if (!tour) {
        return;
      }


      setFavoriteBusy(
        true
      );


      try {
        if (isFavorite) {
          await apiDelete(
            `/favorites/${tour.id}`
          );
        } else {
          await apiPost(
            `/favorites/${tour.id}`
          );
        }


        await qc.invalidateQueries({
          queryKey: [
            "favorites",
            user?.id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "traveler-favorites",
            user?.id,
          ],
        });

      } catch (error) {
        console.error(
          "FAVORITE ERROR:",
          error
        );

        alert(
          error?.message ||
            "Favorite amalida xatolik yuz berdi."
        );

      } finally {
        setFavoriteBusy(
          false
        );
      }
    };


  // ============================================================
  // REVIEWS
  // ============================================================

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: [
      "tour-reviews",
      id,
    ],

    queryFn: () =>
      apiGet(
        `/reviews/tour/${id}`
      ),

    enabled:
      Boolean(id),

    retry: false,
  });


  // ============================================================
  // MY BOOKINGS FOR REVIEW ELIGIBILITY
  // ============================================================

  const {
    data: myBookings = [],
  } = useQuery({
    queryKey: [
      "traveler-bookings",
      user?.id,
    ],

    queryFn: () =>
      apiGet(
        "/bookings"
      ),

    enabled:
      isAuthenticated &&
      isTraveler,

    retry: false,
  });


  const hasApprovedBooking =
    myBookings.some(
      (bookingItem) =>
        Number(
          bookingItem.tour_id
        ) ===
          Number(id) &&
        bookingItem.status ===
          "approved"
    );


  const myExistingReview =
    reviews.find(
      (review) =>
        Number(
          review.traveler_id
        ) ===
        Number(
          user?.id
        )
    );


  const [
    reviewRating,
    setReviewRating,
  ] = useState(5);


  const [
    reviewComment,
    setReviewComment,
  ] = useState("");


  const [
    reviewBusy,
    setReviewBusy,
  ] = useState(false);


  const [
    reviewMessage,
    setReviewMessage,
  ] = useState(null);


  // ============================================================
  // CREATE REVIEW
  // ============================================================

  const submitReview =
    async (
      event
    ) => {
      event.preventDefault();

      setReviewMessage(
        null
      );


      if (!isAuthenticated) {
        navigate(
          "/login"
        );

        return;
      }


      if (!isTraveler) {
        setReviewMessage({
          type: "error",
          text:
            "Faqat traveler review yozishi mumkin.",
        });

        return;
      }


      if (
        !hasApprovedBooking
      ) {
        setReviewMessage({
          type: "error",
          text:
            "Review yozish uchun ushbu tour bo'yicha approved booking bo'lishi kerak.",
        });

        return;
      }


      if (
        myExistingReview
      ) {
        setReviewMessage({
          type: "error",
          text:
            "Siz bu tourga allaqachon review yozgansiz.",
        });

        return;
      }


      const comment =
        reviewComment.trim();


      if (
        comment.length < 3
      ) {
        setReviewMessage({
          type: "error",
          text:
            "Review kamida 3 ta belgidan iborat bo'lishi kerak.",
        });

        return;
      }


      setReviewBusy(
        true
      );


      try {
        await apiPost(
          "/reviews",
          {
            tour_id:
              Number(
                tour.id
              ),

            rating:
              Number(
                reviewRating
              ),

            comment,
          }
        );


        setReviewComment(
          ""
        );

        setReviewRating(
          5
        );


        setReviewMessage({
          type: "success",
          text:
            "Review muvaffaqiyatli qo'shildi.",
        });


        await qc.invalidateQueries({
          queryKey: [
            "tour-reviews",
            id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "tour",
            id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "traveler-reviews",
            user?.id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "organizer-reviews",
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "organizer",
            tour.organizer_profile_id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "organizer-me",
          ],
        });

      } catch (error) {
        console.error(
          "REVIEW ERROR:",
          error
        );


        setReviewMessage({
          type: "error",

          text:
            error?.message ||
            "Review qo'shishda xatolik yuz berdi.",
        });

      } finally {
        setReviewBusy(
          false
        );
      }
    };


  // ============================================================
  // BOOKING STATE
  // ============================================================

  const [
    booking,
    setBooking,
  ] = useState({
    seats: 1,
    full_name: "",
    phone: "",
    note: "",
  });


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    msg,
    setMsg,
  ] = useState(null);


  // ============================================================
  // IMAGE STATE
  // ============================================================

  const [
    activeImg,
    setActiveImg,
  ] = useState(0);


  // ============================================================
  // BOOKING
  // ============================================================

  const submitBooking =
    async (
      event
    ) => {
      event.preventDefault();

      setMsg(null);


      if (!isAuthenticated) {
        navigate(
          "/login"
        );

        return;
      }


      if (!tour) {
        return;
      }


      const seats =
        Number(
          booking.seats ||
            1
        );


      if (
        seats < 1
      ) {
        setMsg({
          type: "error",
          text:
            "Travelers soni kamida 1 bo'lishi kerak.",
        });

        return;
      }


      if (
        seats >
        Number(
          tour.available_seats ||
            0
        )
      ) {
        setMsg({
          type: "error",

          text:
            `Faqat ${tour.available_seats} ta joy mavjud.`,
        });

        return;
      }


      setSubmitting(
        true
      );


      try {
        await apiPost(
          "/bookings",
          {
            tour_id:
              Number(
                tour.id
              ),

            seats,

            full_name:
              booking.full_name ||
              user?.full_name ||
              "Traveler",

            phone:
              booking.phone,

            note:
              booking.note ||
              null,
          }
        );


        setMsg({
          type: "success",

          text:
            "Booking muvaffaqiyatli yuborildi. Organizer tasdiqlashini kuting.",
        });


        setBooking({
          seats: 1,
          full_name: "",
          phone: "",
          note: "",
        });


        await qc.invalidateQueries({
          queryKey: [
            "tour",
            id,
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });


        await qc.invalidateQueries({
          queryKey: [
            "traveler-bookings",
            user?.id,
          ],
        });

      } catch (error) {
        console.error(
          "BOOKING ERROR:",
          error
        );


        setMsg({
          type: "error",

          text:
            error?.message ||
            "Booking yaratishda xatolik yuz berdi.",
        });

      } finally {
        setSubmitting(
          false
        );
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (tourLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="h-[500px] animate-pulse rounded-3xl bg-muted lg:col-span-2" />

          <div className="h-[500px] animate-pulse rounded-3xl bg-muted" />

        </div>

      </div>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (tourError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">

        <EmptyState
          icon={
            MessageSquare
          }
          title="Tourni yuklab bo'lmadi"
          description={
            tourError?.message ||
            "Server bilan bog'lanishda xatolik yuz berdi."
          }
        />

      </div>
    );
  }


  if (!tour) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">

        <EmptyState
          icon={
            MapPin
          }
          title="Tour topilmadi"
          description="Bu tour mavjud emas yoki o'chirilgan."
        />

      </div>
    );
  }


  // ============================================================
  // DATA
  // ============================================================

  const category =
    categories.find(
      (item) =>
        Number(
          item.id
        ) ===
        Number(
          tour.category_id
        )
    );


  const images =
    Array.isArray(
      tour.images
    )
      ? tour.images
      : [];


  const included =
    (
      tour.included ||
      ""
    )
      .split(
        /\n|,\s*/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );


  const excluded =
    (
      tour.excluded ||
      ""
    )
      .split(
        /\n|,\s*/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );


  const requirements =
    (
      tour.requirements ||
      ""
    )
      .split(
        /\n|,\s*/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );


  const totalPrice =
    Number(
      tour.price ||
        0
    ) *
    Number(
      booking.seats ||
        1
    );


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">


      <Link
        to="/tours"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >

        <ArrowLeft
          size={16}
        />

        Back to tours

      </Link>


      <div className="mt-4 grid gap-8 lg:grid-cols-3">


        {/* ====================================================
            LEFT
        ==================================================== */}

        <div className="lg:col-span-2">


          {/* HEADER */}

          <div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">

              {category && (

                <span className="rounded-full bg-accent px-2.5 py-1 font-medium">

                  {
                    category.name
                  }

                </span>

              )}


              <span className="inline-flex items-center gap-1">

                <MapPin
                  size={13}
                />

                {tour.region_name ||
                  tour.region ||
                  ""}

                {tour.district
                  ? `, ${tour.district}`
                  : ""}

              </span>

            </div>


            <div className="mt-2 flex items-start justify-between gap-4">

              <div>

                <h1 className="text-3xl font-bold tracking-tight">

                  {
                    tour.title
                  }

                </h1>


                <div className="mt-2 flex items-center gap-2">

                  <Star
                    size={17}
                    className="text-amber-500"
                    fill="currentColor"
                  />

                  <span className="font-semibold">

                    {tour.reviews_count >
                    0
                      ? Number(
                          tour.rating
                        ).toFixed(
                          1
                        )
                      : "New"}

                  </span>


                  <span className="text-sm text-muted-foreground">

                    {tour.reviews_count ||
                      0}{" "}
                    review(s)

                  </span>

                </div>

              </div>


              {(
                !isAuthenticated ||
                isTraveler
              ) && (

                <button
                  type="button"
                  onClick={
                    toggleFavorite
                  }
                  disabled={
                    favoriteBusy ||
                    favoritesLoading
                  }
                  title={
                    isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                    isFavorite
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-border bg-card text-muted-foreground hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  } disabled:opacity-60`}
                >

                  {favoriteBusy ? (

                    <Loader2
                      size={19}
                      className="animate-spin"
                    />

                  ) : (

                    <Heart
                      size={20}
                      fill={
                        isFavorite
                          ? "currentColor"
                          : "none"
                      }
                    />

                  )}

                </button>

              )}

            </div>

          </div>


          {/* GALLERY */}

          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">

            <div className="aspect-[16/10] bg-muted">

              {images.length >
              0 ? (

                <Image
                  src={
                    images[
                      Math.min(
                        activeImg,
                        images.length -
                          1
                      )
                    ]
                  }
                  alt={
                    tour.title
                  }
                  className="h-full w-full"
                  fittingType="fill"
                />

              ) : (

                <div className="grid h-full place-items-center text-muted-foreground">

                  <MapPin
                    size={48}
                  />

                </div>

              )}

            </div>


            {images.length >
              1 && (

              <div className="flex gap-2 overflow-x-auto p-3">

                {images.map(
                  (
                    url,
                    index
                  ) => (

                    <button
                      key={
                        index
                      }
                      type="button"
                      onClick={() =>
                        setActiveImg(
                          index
                        )
                      }
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                        activeImg ===
                        index
                          ? "border-emerald-500"
                          : "border-transparent"
                      }`}
                    >

                      <img
                        src={
                          url
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* QUICK FACTS */}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            {[
              {
                icon:
                  Calendar,
                label:
                  "Dates",
                value:
                  formatDateRange(
                    tour.start_date,
                    tour.end_date
                  ),
              },

              {
                icon:
                  Clock,
                label:
                  "Duration",
                value:
                  tour.duration,
              },

              {
                icon:
                  Car,
                label:
                  "Transport",
                value:
                  tour.transport,
              },

              {
                icon:
                  Users,
                label:
                  "Group size",
                value:
                  `${tour.maximum_people} max`,
              },
            ].map(
              (
                item
              ) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      item.label
                    }
                    className="rounded-2xl border border-border bg-card p-4"
                  >

                    <Icon
                      size={18}
                      className="text-emerald-600"
                    />

                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">

                      {
                        item.label
                      }

                    </p>

                    <p className="text-sm font-semibold">

                      {
                        item.value ||
                        "—"
                      }

                    </p>

                  </div>
                );
              }
            )}

          </div>


          {/* DESCRIPTION */}

          <section className="mt-8">

            <h2 className="text-xl font-semibold">
              About this tour
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">

              {
                tour.description
              }

            </p>

          </section>


          {/* INCLUDED / EXCLUDED */}

          <section className="mt-8 grid gap-6 sm:grid-cols-2">

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">

              <h3 className="font-semibold text-emerald-700">
                What's included
              </h3>

              <ul className="mt-3 space-y-2">

                {included.length >
                0 ? (

                  included.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                        className="flex gap-2 text-sm"
                      >

                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        {
                          item
                        }

                      </li>

                    )
                  )

                ) : (

                  <li className="text-sm text-muted-foreground">
                    —
                  </li>

                )}

              </ul>

            </div>


            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">

              <h3 className="font-semibold text-rose-700">
                What's excluded
              </h3>

              <ul className="mt-3 space-y-2">

                {excluded.length >
                0 ? (

                  excluded.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={
                          index
                        }
                        className="flex gap-2 text-sm"
                      >

                        <X
                          size={16}
                          className="mt-0.5 shrink-0 text-rose-500"
                        />

                        {
                          item
                        }

                      </li>

                    )
                  )

                ) : (

                  <li className="text-sm text-muted-foreground">
                    —
                  </li>

                )}

              </ul>

            </div>

          </section>


          {/* REQUIREMENTS */}

          {requirements.length >
            0 && (

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <h3 className="font-semibold">
                Requirements
              </h3>

              <ul className="mt-3 space-y-2">

                {requirements.map(
                  (
                    item,
                    index
                  ) => (

                    <li
                      key={
                        index
                      }
                      className="flex gap-2 text-sm"
                    >

                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      {
                        item
                      }

                    </li>

                  )
                )}

              </ul>

            </section>

          )}


          {/* MEETING POINT */}

          {tour.meeting_point && (

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <h3 className="font-semibold">
                Meeting point
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">

                {
                  tour.meeting_point
                }

              </p>

            </section>

          )}


          {/* ====================================================
              REVIEWS
          ==================================================== */}

          <section className="mt-10">

            <div className="flex flex-wrap items-end justify-between gap-3">

              <div>

                <h2 className="text-2xl font-bold">
                  Reviews
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Travelers' experiences with this tour.
                </p>

              </div>


              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2">

                <Star
                  size={19}
                  className="text-amber-500"
                  fill="currentColor"
                />

                <span className="font-bold">

                  {tour.reviews_count >
                  0
                    ? Number(
                        tour.rating
                      ).toFixed(
                        1
                      )
                    : "—"}

                </span>

                <span className="text-xs text-muted-foreground">

                  ({tour.reviews_count ||
                    0})

                </span>

              </div>

            </div>


            {/* REVIEW FORM */}

            {isAuthenticated &&
              isTraveler &&
              hasApprovedBooking &&
              !myExistingReview && (

              <form
                onSubmit={
                  submitReview
                }
                className="mt-6 rounded-2xl border border-border bg-card p-5"
              >

                <h3 className="font-semibold">
                  Leave a review
                </h3>


                <p className="mt-1 text-sm text-muted-foreground">
                  Sizning bookingingiz organizer tomonidan tasdiqlangan.
                </p>


                <div className="mt-5">

                  <p className="text-sm font-medium">
                    Your rating
                  </p>


                  <div className="mt-2 flex gap-1">

                    {[1, 2, 3, 4, 5].map(
                      (
                        value
                      ) => (

                        <button
                          key={
                            value
                          }
                          type="button"
                          onClick={() =>
                            setReviewRating(
                              value
                            )
                          }
                          className="p-1"
                        >

                          <Star
                            size={30}
                            className={
                              value <=
                              reviewRating
                                ? "text-amber-500"
                                : "text-slate-300"
                            }
                            fill={
                              value <=
                              reviewRating
                                ? "currentColor"
                                : "none"
                            }
                          />

                        </button>

                      )
                    )}

                  </div>


                  <p className="mt-1 text-xs text-muted-foreground">

                    {
                      reviewRating
                    }
                    /5

                  </p>

                </div>


                <div className="mt-4">

                  <label className="text-sm font-medium">
                    Your experience
                  </label>

                  <textarea
                    value={
                      reviewComment
                    }
                    onChange={(
                      event
                    ) =>
                      setReviewComment(
                        event.target.value
                      )
                    }
                    rows={5}
                    maxLength={2000}
                    placeholder="Sayohat haqida fikringizni yozing..."
                    className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-emerald-400"
                  />

                  <p className="mt-1 text-right text-xs text-muted-foreground">

                    {
                      reviewComment.length
                    }
                    /2000

                  </p>

                </div>


                {reviewMessage && (

                  <div
                    className={`mt-4 rounded-xl p-3 text-sm ${
                      reviewMessage.type ===
                      "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >

                    {
                      reviewMessage.text
                    }

                  </div>

                )}


                <button
                  type="submit"
                  disabled={
                    reviewBusy
                  }
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >

                  {reviewBusy ? (

                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                  ) : (

                    <Star
                      size={16}
                    />

                  )}

                  {reviewBusy
                    ? "Submitting..."
                    : "Submit review"}

                </button>

              </form>

            )}


            {/* ALREADY REVIEWED */}

            {isTraveler &&
              myExistingReview && (

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">

                  <CheckCircleIcon />

                  You already reviewed this tour.

                </div>

              </div>

            )}


            {/* NOT ELIGIBLE */}

            {isAuthenticated &&
              isTraveler &&
              !hasApprovedBooking &&
              !myExistingReview && (

              <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">

                Review yozish uchun ushbu tour bo‘yicha organizer tasdiqlagan booking bo‘lishi kerak.

              </div>

            )}


            {/* LOGIN */}

            {!isAuthenticated && (

              <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm">

                Review yozish uchun{" "}

                <Link
                  to="/login"
                  className="font-semibold text-emerald-600"
                >
                  login
                </Link>{" "}

                qiling.

              </div>

            )}


            {/* REVIEWS LIST */}

            <div className="mt-6">

              {reviewsLoading ? (

                <div className="grid place-items-center py-12">

                  <Loader2 className="animate-spin text-muted-foreground" />

                </div>

              ) : reviewsError ? (

                <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">

                  {reviewsError?.message ||
                    "Reviewlarni yuklab bo'lmadi."}

                </div>

              ) : reviews.length ===
                0 ? (

                <div className="rounded-2xl border border-dashed border-border p-8 text-center">

                  <Star
                    size={30}
                    className="mx-auto text-muted-foreground"
                  />

                  <p className="mt-3 font-semibold">
                    No reviews yet
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first traveler to share an experience.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {reviews.map(
                    (
                      review
                    ) => (

                      <ReviewCard
                        key={
                          review.id
                        }
                        review={
                          review
                        }
                      />

                    )
                  )}

                </div>

              )}

            </div>

          </section>

        </div>


        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside className="lg:col-span-1">

          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-sm">


            <div className="flex items-end justify-between gap-3">

              <div>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Price per person
                </p>

                <p className="text-3xl font-bold">

                  {formatPrice(
                    tour.price
                  )}

                </p>

              </div>


              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tour.available_seats >
                  0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >

                {tour.available_seats >
                0
                  ? `${tour.available_seats} seats left`
                  : "Sold out"}

              </span>

            </div>


            {/* FAVORITE */}

            {(
              !isAuthenticated ||
              isTraveler
            ) && (

              <button
                type="button"
                onClick={
                  toggleFavorite
                }
                disabled={
                  favoriteBusy ||
                  favoritesLoading
                }
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  isFavorite
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-border hover:bg-rose-50 hover:text-rose-600"
                }`}
              >

                <Heart
                  size={17}
                  fill={
                    isFavorite
                      ? "currentColor"
                      : "none"
                  }
                />

                {isFavorite
                  ? "Saved to favorites"
                  : "Add to favorites"}

              </button>

            )}


            {/* ORGANIZER */}

            {organizer && (

              <Link
                to={`/organizers/${organizer.id}`}
                className="mt-5 flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:bg-accent"
              >

                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">

                  {organizer.avatar_url ? (

                    <Image
                      src={
                        organizer.avatar_url
                      }
                      alt=""
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


                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold">

                    {
                      organizer.full_name
                    }

                  </p>


                  <div className="flex items-center gap-2">

                    <p className="inline-flex items-center gap-1 text-xs text-emerald-600">

                      <ShieldCheck
                        size={12}
                      />

                      Verified organizer

                    </p>


                    {Number(
                      organizer.reviews_count ||
                        0
                    ) > 0 && (

                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">

                        <Star
                          size={11}
                          fill="currentColor"
                        />

                        {Number(
                          organizer.rating ||
                            0
                        ).toFixed(
                          1
                        )}

                      </span>

                    )}

                  </div>

                </div>

              </Link>

            )}


            {/* BOOKING */}

            <form
              onSubmit={
                submitBooking
              }
              className="mt-5 space-y-4"
            >

              <div>

                <label className="text-xs font-medium text-muted-foreground">
                  Travelers
                </label>

                <input
                  type="number"
                  min={1}
                  max={
                    tour.available_seats ||
                    1
                  }
                  value={
                    booking.seats
                  }
                  onChange={(
                    event
                  ) =>
                    setBooking(
                      (
                        current
                      ) => ({
                        ...current,
                        seats:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                />

              </div>


              <div>

                <label className="text-xs font-medium text-muted-foreground">
                  Full name
                </label>

                <input
                  value={
                    booking.full_name
                  }
                  onChange={(
                    event
                  ) =>
                    setBooking(
                      (
                        current
                      ) => ({
                        ...current,
                        full_name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Your name"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                />

              </div>


              <div>

                <label className="text-xs font-medium text-muted-foreground">
                  Phone
                </label>

                <input
                  value={
                    booking.phone
                  }
                  onChange={(
                    event
                  ) =>
                    setBooking(
                      (
                        current
                      ) => ({
                        ...current,
                        phone:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="+998 ..."
                  required
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                />

              </div>


              <div>

                <label className="text-xs font-medium text-muted-foreground">
                  Note (optional)
                </label>

                <textarea
                  value={
                    booking.note
                  }
                  onChange={(
                    event
                  ) =>
                    setBooking(
                      (
                        current
                      ) => ({
                        ...current,
                        note:
                          event.target.value,
                      })
                    )
                  }
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                />

              </div>


              <div className="flex items-center justify-between border-t border-border pt-4">

                <span className="text-sm text-muted-foreground">
                  Total
                </span>

                <span className="text-xl font-bold">

                  {formatPrice(
                    totalPrice
                  )}

                </span>

              </div>


              {msg && (

                <div
                  className={`rounded-xl p-3 text-sm ${
                    msg.type ===
                    "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >

                  {
                    msg.text
                  }

                </div>

              )}


              <button
                type="submit"
                disabled={
                  submitting ||
                  tour.available_seats <=
                    0 ||
                  tour.status !==
                    "approved"
                }
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {submitting ? (

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                ) : tour.status !==
                  "approved" ? (

                  "Tour not available"

                ) : tour.available_seats <=
                  0 ? (

                  "Sold out"

                ) : (

                  "Request booking"

                )}

              </button>


              {!isAuthenticated && (

                <p className="text-center text-xs text-muted-foreground">
                  You'll be asked to log in.
                </p>

              )}

            </form>

          </div>

        </aside>

      </div>

    </div>
  );
}


// ============================================================
// REVIEW CARD
// ============================================================

function ReviewCard({
  review,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">

      <div className="flex items-start gap-3">


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
              .charAt(0)
              .toUpperCase()

          )}

        </div>


        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-start justify-between gap-2">

            <div>

              <p className="font-semibold">

                {review.traveler_name ||
                  "Traveler"}

              </p>


              <div className="mt-1 flex">

                {[1, 2, 3, 4, 5].map(
                  (
                    value
                  ) => (

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

            </div>


            <span className="text-xs text-muted-foreground">

              {
                formatReviewDate(
                  review.created_at
                )
              }

            </span>

          </div>


          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">

            {
              review.comment
            }

          </p>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// DATE
// ============================================================

function formatReviewDate(
  value
) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(
      new Date(
        value
      )
    );

  } catch {
    return "";
  }
}


// ============================================================
// SMALL ICON
// ============================================================

function CheckCircleIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white">
      <Check
        size={12}
      />
    </span>
  );
}