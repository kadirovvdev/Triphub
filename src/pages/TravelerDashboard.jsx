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
  apiDelete,
} from "@/api/apiClient";

import EmptyState from "@/components/EmptyState";
import ImageUploader from "@/components/ImageUploader";

import {
  Calendar,
  Heart,
  Star,
  Settings,
  Loader2,
  MapPin,
  X,
  XCircle,
  CheckCircle2,
  Hourglass,
  User as UserIcon,
  Pencil,
  Save,
  Trash2,
  ExternalLink,
} from "lucide-react";

import {
  formatPrice,
  formatDate,
} from "@/lib/triphub";


const TABS = [
  {
    key: "bookings",
    label: "Bookings",
    icon: Calendar,
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
  },
  {
    key: "reviews",
    label: "My reviews",
    icon: Star,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
  },
];


const STATUS_META = {
  pending: {
    label: "Pending",
    icon: Hourglass,
    cls: "bg-amber-50 text-amber-700",
  },

  approved: {
    label: "Approved",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700",
  },

  rejected: {
    label: "Rejected",
    icon: XCircle,
    cls: "bg-rose-50 text-rose-700",
  },

  cancelled: {
    label: "Cancelled",
    icon: X,
    cls: "bg-slate-100 text-slate-600",
  },
};


export default function TravelerDashboard() {
  const { user } = useAuth();

  const [
    params,
    setParams,
  ] = useSearchParams();

  const tab =
    params.get("tab") ||
    "bookings";

  const qc =
    useQueryClient();


  // ============================================================
  // PROFILE
  // ============================================================

  const {
    data: profileUser,
    isLoading: loadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: [
      "traveler-profile",
    ],

    queryFn: () =>
      apiGet(
        "/auth/me"
      ),

    enabled:
      Boolean(user),

    retry: false,
  });


  // ============================================================
  // BOOKINGS
  // ============================================================

  const {
    data: bookings = [],
    isLoading: loadingBookings,
    error: bookingsError,
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
      Boolean(user),
  });


  // ============================================================
  // TOURS
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
  });


  // ============================================================
  // FAVORITES
  // ============================================================

  const {
    data: favorites = [],
    isLoading: loadingFavorites,
    error: favoritesError,
  } = useQuery({
    queryKey: [
      "traveler-favorites",
      user?.id,
    ],

    queryFn: () =>
      apiGet(
        "/favorites"
      ),

    enabled:
      Boolean(user),

    retry: false,
  });


  // ============================================================
  // REVIEWS
  // ============================================================

  const {
    data: reviews = [],
    isLoading: loadingReviews,
    error: reviewsError,
  } = useQuery({
    queryKey: [
      "traveler-reviews",
      user?.id,
    ],

    queryFn: () =>
      apiGet(
        "/reviews/me"
      ),

    enabled:
      Boolean(user),

    retry: false,
  });


  // ============================================================
  // HELPERS
  // ============================================================

  const tourById = (
    tourId
  ) =>
    allTours.find(
      (tour) =>
        Number(
          tour.id
        ) ===
        Number(
          tourId
        )
    );


  const favoriteTours =
    favorites
      .map(
        (favorite) => {
          const tour =
            tourById(
              favorite.tour_id
            );

          if (!tour) {
            return null;
          }

          return {
            favorite,
            tour,
          };
        }
      )
      .filter(Boolean);


  // ============================================================
  // CANCEL BOOKING
  // ============================================================

  const cancelBooking =
    async (
      bookingId
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this booking?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await apiPatch(
          `/bookings/${bookingId}/cancel`
        );

        await qc.invalidateQueries({
          queryKey: [
            "traveler-bookings",
            user?.id,
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });

      } catch (error) {
        console.error(
          "CANCEL BOOKING ERROR:",
          error
        );

        alert(
          error?.message ||
            "Bookingni bekor qilishda xatolik yuz berdi."
        );
      }
    };


  // ============================================================
  // REMOVE FAVORITE
  // ============================================================

  const removeFavorite =
    async (
      tourId
    ) => {
      try {
        await apiDelete(
          `/favorites/${tourId}`
        );

        await qc.invalidateQueries({
          queryKey: [
            "traveler-favorites",
            user?.id,
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "favorites",
            user?.id,
          ],
        });

      } catch (error) {
        console.error(
          "REMOVE FAVORITE ERROR:",
          error
        );

        alert(
          error?.message ||
            "Favorite'ni o'chirishda xatolik yuz berdi."
        );
      }
    };


  // ============================================================
  // DELETE REVIEW
  // ============================================================

  const deleteReview =
    async (
      reviewId
    ) => {
      const confirmed =
        window.confirm(
          "Reviewni o'chirmoqchimisiz?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await apiDelete(
          `/reviews/${reviewId}`
        );

        await qc.invalidateQueries({
          queryKey: [
            "traveler-reviews",
            user?.id,
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "organizer-me",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "organizer-reviews",
          ],
        });

      } catch (error) {
        console.error(
          "DELETE REVIEW ERROR:",
          error
        );

        alert(
          error?.message ||
            "Reviewni o'chirishda xatolik yuz berdi."
        );
      }
    };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6">

      <h1 className="text-3xl font-bold tracking-tight">
        My Traveler Hub
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back,{" "}
        {profileUser?.email ||
          user?.email ||
          "Traveler"}.
      </p>


      {/* TABS */}

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">

        {TABS.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              tab ===
              item.key;

            let count = 0;

            if (
              item.key ===
              "favorites"
            ) {
              count =
                favorites.length;
            }

            if (
              item.key ===
              "reviews"
            ) {
              count =
                reviews.length;
            }

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
                  active
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

                {count >
                  0 && (

                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                    {
                      count
                    }
                  </span>

                )}

              </button>
            );
          }
        )}

      </div>


      <div className="mt-8">


        {/* ====================================================
            BOOKINGS
        ==================================================== */}

        {tab ===
          "bookings" && (

          loadingBookings ||
          loadingTours ? (

            <CenterLoader />

          ) : bookingsError ? (

            <EmptyState
              icon={
                Calendar
              }
              title="Bookinglarni yuklab bo'lmadi"
              description={
                bookingsError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : toursError ? (

            <EmptyState
              icon={
                MapPin
              }
              title="Tourlarni yuklab bo'lmadi"
              description={
                toursError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : bookings.length ===
            0 ? (

            <EmptyState
              icon={
                Calendar
              }
              title="No bookings yet"
              description="When you book a tour, it'll show up here."
              actionLabel="Explore tours"
              actionTo="/tours"
            />

          ) : (

            <div className="space-y-4">

              {bookings.map(
                (booking) => {
                  const tour =
                    tourById(
                      booking.tour_id
                    );

                  const meta =
                    STATUS_META[
                      booking.status
                    ] ||
                    STATUS_META.pending;

                  const StatusIcon =
                    meta.icon;

                  return (
                    <div
                      key={
                        booking.id
                      }
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row"
                    >

                      <Link
                        to={`/tours/${booking.tour_id}`}
                        className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40"
                      >

                        {tour?.images?.[0] ? (

                          <img
                            src={
                              tour.images[0]
                            }
                            alt={
                              tour.title ||
                              ""
                            }
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <div className="grid h-full place-items-center text-muted-foreground">
                            <MapPin />
                          </div>

                        )}

                      </Link>


                      <div className="flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <Link
                              to={`/tours/${booking.tour_id}`}
                              className="font-semibold hover:text-emerald-600"
                            >
                              {tour?.title ||
                                "Tour"}
                            </Link>

                            {tour && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDate(
                                  tour.start_date
                                )}
                              </p>
                            )}

                          </div>


                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}
                          >

                            <StatusIcon
                              size={12}
                            />

                            {
                              meta.label
                            }

                          </span>

                        </div>


                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">

                          <span>
                            {booking.seats} traveler(s)
                          </span>

                          <span>
                            Total:{" "}
                            <b className="text-foreground">
                              {formatPrice(
                                booking.total_price
                              )}
                            </b>
                          </span>

                          {booking.phone && (
                            <span>
                              📞 {booking.phone}
                            </span>
                          )}

                        </div>


                        {booking.note && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Note: {booking.note}
                          </p>
                        )}


                        {(booking.status ===
                          "pending" ||
                          booking.status ===
                            "approved") && (

                          <button
                            type="button"
                            onClick={() =>
                              cancelBooking(
                                booking.id
                              )
                            }
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-rose-50"
                          >

                            <X
                              size={13}
                            />

                            Cancel booking

                          </button>

                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )

        )}


        {/* ====================================================
            FAVORITES
        ==================================================== */}

        {tab ===
          "favorites" && (

          loadingFavorites ||
          loadingTours ? (

            <CenterLoader />

          ) : favoritesError ? (

            <EmptyState
              icon={
                Heart
              }
              title="Favoritesni yuklab bo'lmadi"
              description={
                favoritesError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : favoriteTours.length ===
            0 ? (

            <EmptyState
              icon={
                Heart
              }
              title="No favorites yet"
              description="Yoqtirgan tourlaringizni yurakcha tugmasi orqali saqlang."
              actionLabel="Explore tours"
              actionTo="/tours"
            />

          ) : (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {favoriteTours.map(
                ({ tour }) => (

                  <div
                    key={
                      tour.id
                    }
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    <div className="relative">

                      <Link
                        to={`/tours/${tour.id}`}
                        className="block aspect-[16/10] overflow-hidden bg-muted"
                      >

                        {tour.images?.[0] ? (

                          <img
                            src={
                              tour.images[0]
                            }
                            alt={
                              tour.title
                            }
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />

                        ) : (

                          <div className="grid h-full place-items-center text-muted-foreground">
                            <MapPin
                              size={30}
                            />
                          </div>

                        )}

                      </Link>


                      <button
                        type="button"
                        onClick={() =>
                          removeFavorite(
                            tour.id
                          )
                        }
                        title="Remove from favorites"
                        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow transition hover:bg-rose-50"
                      >

                        <Heart
                          size={18}
                          fill="currentColor"
                        />

                      </button>

                    </div>


                    <div className="p-4">

                      <Link
                        to={`/tours/${tour.id}`}
                        className="font-semibold transition hover:text-emerald-600"
                      >
                        {tour.title}
                      </Link>


                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(
                          tour.start_date
                        )}
                      </p>


                      <div className="mt-4 flex items-end justify-between gap-3">

                        <div>

                          <p className="text-xs text-muted-foreground">
                            From
                          </p>

                          <p className="font-bold">
                            {formatPrice(
                              tour.price
                            )}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            tour.available_seats >
                            0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >

                          {tour.available_seats >
                          0
                            ? `${tour.available_seats} seats`
                            : "Sold out"}

                        </span>

                      </div>


                      <div className="mt-4 flex gap-2">

                        <Link
                          to={`/tours/${tour.id}`}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          View tour
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            removeFavorite(
                              tour.id
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-destructive transition hover:bg-rose-50"
                          title="Remove"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )

        )}


        {/* ====================================================
            REVIEWS
        ==================================================== */}

        {tab ===
          "reviews" && (

          loadingReviews ||
          loadingTours ? (

            <CenterLoader />

          ) : reviewsError ? (

            <EmptyState
              icon={
                Star
              }
              title="Reviewlarni yuklab bo'lmadi"
              description={
                reviewsError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : reviews.length ===
            0 ? (

            <EmptyState
              icon={
                Star
              }
              title="No reviews yet"
              description="Approved bookingdan keyin tour sahifasida review qoldirishingiz mumkin."
              actionLabel="Browse tours"
              actionTo="/tours"
            />

          ) : (

            <div className="space-y-4">

              {reviews.map(
                (review) => {
                  const tour =
                    tourById(
                      review.tour_id
                    );

                  return (
                    <div
                      key={
                        review.id
                      }
                      className="rounded-2xl border border-border bg-card p-5"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-3">

                            <StarRow
                              rating={
                                review.rating
                              }
                            />

                            <span className="text-sm font-semibold">
                              {review.rating}/5
                            </span>

                            {review.created_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  review.created_at
                                )}
                              </span>
                            )}

                          </div>


                          {tour && (

                            <Link
                              to={`/tours/${tour.id}`}
                              className="mt-3 inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
                            >
                              {tour.title}

                              <ExternalLink
                                size={13}
                              />
                            </Link>

                          )}


                          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                            {review.comment}
                          </p>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            deleteReview(
                              review.id
                            )
                          }
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >

                          <Trash2
                            size={14}
                          />

                          Delete

                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )

        )}


        {/* ====================================================
            SETTINGS
        ==================================================== */}

        {tab ===
          "settings" && (

          loadingProfile ? (

            <CenterLoader />

          ) : profileError ? (

            <EmptyState
              icon={
                UserIcon
              }
              title="Profilni yuklab bo'lmadi"
              description={
                profileError?.message ||
                "Server bilan bog'lanishda xatolik yuz berdi."
              }
            />

          ) : (

            <TravelerProfileEditor
              user={
                profileUser ||
                user
              }
              queryClient={
                qc
              }
            />

          )

        )}

      </div>

    </div>
  );
}


// ============================================================
// STAR ROW
// ============================================================

function StarRow({
  rating,
}) {
  return (
    <div className="flex">

      {[1, 2, 3, 4, 5].map(
        (value) => (

          <Star
            key={
              value
            }
            size={16}
            className={
              value <=
              Number(
                rating
              )
                ? "text-amber-500"
                : "text-slate-300"
            }
            fill={
              value <=
              Number(
                rating
              )
                ? "currentColor"
                : "none"
            }
          />

        )
      )}

    </div>
  );
}


// ============================================================
// PROFILE EDITOR
// ============================================================

function TravelerProfileEditor({
  user,
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
    phone: "",
    bio: "",
    avatar_url: "",
  });


  useEffect(() => {
    setForm({
      phone:
        user?.phone ||
        "",

      bio:
        user?.bio ||
        "",

      avatar_url:
        user?.avatar_url ||
        "",
    });
  }, [
    user,
  ]);


  const set = (
    key,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  };


  const cancelEdit = () => {
    setEditing(false);
    setError("");
    setSuccess("");

    setForm({
      phone:
        user?.phone ||
        "",

      bio:
        user?.bio ||
        "",

      avatar_url:
        user?.avatar_url ||
        "",
    });
  };


  const saveProfile =
    async (
      event
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");
      setSaving(true);

      try {
        await apiPatch(
          "/auth/me",
          {
            phone:
              form.phone.trim() ||
              null,

            bio:
              form.bio.trim() ||
              null,

            avatar_url:
              form.avatar_url ||
              null,
          }
        );


        await queryClient.invalidateQueries({
          queryKey: [
            "traveler-profile",
          ],
        });

        await queryClient.invalidateQueries({
          queryKey: [
            "admin-users",
          ],
        });


        setSuccess(
          "Profile muvaffaqiyatli yangilandi."
        );

        setEditing(false);

      } catch (err) {
        console.error(
          "TRAVELER PROFILE UPDATE ERROR:",
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


  if (!editing) {
    return (
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">

              {user?.avatar_url ? (

                <img
                  src={
                    user.avatar_url
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />

              ) : (

                <UserIcon
                  size={28}
                />

              )}

            </div>


            <div>

              <h2 className="text-xl font-semibold">
                Traveler Profile
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {user?.email}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setEditing(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >

            <Pencil
              size={15}
            />

            Edit profile

          </button>

        </div>


        <div className="mt-8 grid gap-6 sm:grid-cols-2">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Account role
            </p>

            <p className="mt-1 text-sm capitalize">
              {user?.role ||
                "traveler"}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Phone
            </p>

            <p className="mt-1 text-sm">
              {user?.phone ||
                "—"}
            </p>

          </div>

        </div>


        <div className="mt-6">

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Bio
          </p>

          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
            {user?.bio ||
              "—"}
          </p>

        </div>


        {success && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

      </div>
    );
  }


  return (
    <form
      onSubmit={
        saveProfile
      }
      className="max-w-3xl"
    >

      <div className="rounded-2xl border border-border bg-card p-6">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>

            <h2 className="text-xl font-semibold">
              Edit traveler profile
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Update your personal TripNet profile.
            </p>

          </div>


          <button
            type="button"
            onClick={
              cancelEdit
            }
            disabled={
              saving
            }
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            Cancel
          </button>

        </div>


        <div className="mt-6 space-y-6">

          <div>

            <label className="text-sm font-medium">
              Email
            </label>

            <input
              value={
                user?.email ||
                ""
              }
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            />

          </div>


          <div>

            <label className="text-sm font-medium">
              Phone
            </label>

            <input
              type="tel"
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
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
            />

          </div>


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
              placeholder="Tell organizers and other travelers a little about yourself..."
              className="mt-1 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
            />

            <p className="mt-1 text-right text-xs text-muted-foreground">
              {form.bio.length}/1200
            </p>

          </div>


          <div>

            <label className="text-sm font-medium">
              Profile photo
            </label>

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
                    images?.[0] ||
                      ""
                  )
                }
                max={1}
              />

            </div>

          </div>


          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}


          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
              disabled={
                saving
              }
              onClick={
                cancelEdit
              }
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-60"
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
