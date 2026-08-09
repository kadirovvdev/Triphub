import React from "react";

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

import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

import {
  ShieldCheck,
  Users,
  Compass,
  Calendar,
  Star,
  Check,
  X,
  Trash2,
  Loader2,
  FileBarChart,
  Pencil,
  Clock3,
} from "lucide-react";

import {
  formatPrice,
  formatDate,
} from "@/lib/triphub";


const TABS = [
  {
    key: "overview",
    label: "Overview",
    icon: FileBarChart,
  },
  {
    key: "organizers",
    label: "Organizers",
    icon: ShieldCheck,
  },
  {
    key: "tours",
    label: "Tours",
    icon: Compass,
  },
  {
    key: "edit-requests",
    label: "Edit Requests",
    icon: Pencil,
  },
  {
    key: "users",
    label: "Users",
    icon: Users,
  },
];


export default function AdminDashboard() {
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

  const isAdmin =
    String(
      user?.role || ""
    ).toLowerCase() ===
    "admin";


  // ============================================================
  // USERS
  // ============================================================

  const {
    data: users = [],
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: [
      "admin-users",
    ],

    queryFn: () =>
      apiGet(
        "/admin/users"
      ),

    enabled:
      isAdmin,
  });


  // ============================================================
  // ORGANIZERS
  // ============================================================

  const {
    data: organizers = [],
    isLoading:
      loadingOrganizers,
    error:
      organizersError,
  } = useQuery({
    queryKey: [
      "admin-organizers",
    ],

    queryFn: () =>
      apiGet(
        "/organizers"
      ),

    enabled:
      isAdmin,
  });


  // ============================================================
  // TOURS
  // ============================================================

  const {
    data: tours = [],
    isLoading:
      loadingTours,
    error:
      toursError,
  } = useQuery({
    queryKey: [
      "admin-tours",
    ],

    queryFn: () =>
      apiGet(
        "/tours"
      ),

    enabled:
      isAdmin,
  });


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
      "admin-bookings",
    ],

    queryFn: () =>
      apiGet(
        "/admin/bookings"
      ),

    enabled:
      isAdmin,
  });


  // ============================================================
  // TOUR EDIT REQUESTS
  // ============================================================

  const {
    data: editRequests = [],
    isLoading:
      loadingEditRequests,
    error:
      editRequestsError,
  } = useQuery({
    queryKey: [
      "admin-tour-edit-requests",
    ],

    queryFn: () =>
      apiGet(
        "/admin/tour-edit-requests"
      ),

    enabled:
      isAdmin,

    retry: false,
  });


  // ============================================================
  // ADMIN CHECK
  // ============================================================

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">

        <EmptyState
          icon={
            ShieldCheck
          }
          title="Admins only"
          description="You don't have access to the admin dashboard."
          actionLabel="Go home"
          actionTo="/"
        />

      </div>
    );
  }


  // ============================================================
  // CALCULATIONS
  // ============================================================

  const pendingOrganizers =
    organizers.filter(
      (organizer) =>
        organizer.verification_status ===
        "pending"
    );

  const pendingTours =
    tours.filter(
      (tour) =>
        tour.status ===
        "pending"
    );

  const approvedTours =
    tours.filter(
      (tour) =>
        tour.status ===
        "approved"
    );

  const rejectedTours =
    tours.filter(
      (tour) =>
        tour.status ===
        "rejected"
    );

  const draftTours =
    tours.filter(
      (tour) =>
        tour.status ===
        "draft"
    );

  const pendingEditRequests =
    editRequests.filter(
      (request) =>
        request.status ===
        "pending"
    );

  const travelers =
    users.filter(
      (item) =>
        item.role ===
        "traveler"
    );

  const organizerUsers =
    users.filter(
      (item) =>
        item.role ===
        "organizer"
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
  // CHART
  // ============================================================

  const chartData = [
    {
      name: "Approved",
      value:
        approvedTours.length,
      fill: "#10b981",
    },
    {
      name: "Pending",
      value:
        pendingTours.length,
      fill: "#f59e0b",
    },
    {
      name: "Rejected",
      value:
        rejectedTours.length,
      fill: "#f43f5e",
    },
    {
      name: "Draft",
      value:
        draftTours.length,
      fill: "#94a3b8",
    },
  ];


  // ============================================================
  // ORGANIZER STATUS
  // ============================================================

  const setOrganizerStatus =
    async (
      organizerId,
      newStatus
    ) => {
      try {
        await apiPatch(
          `/organizers/${organizerId}/status`,
          {
            status:
              newStatus,
          }
        );

        await qc.invalidateQueries({
          queryKey: [
            "admin-organizers",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "organizers",
          ],
        });

      } catch (error) {
        console.error(
          "ORGANIZER STATUS ERROR:",
          error
        );

        alert(
          error?.message ||
            "Organizer statusini o'zgartirishda xatolik."
        );
      }
    };


  // ============================================================
  // TOUR STATUS
  // ============================================================

  const setTourStatus =
    async (
      tourId,
      newStatus
    ) => {
      try {
        await apiPatch(
          `/tours/${tourId}/status`,
          {
            status:
              newStatus,
          }
        );

        await qc.invalidateQueries({
          queryKey: [
            "admin-tours",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tour",
            String(
              tourId
            ),
          ],
        });

      } catch (error) {
        console.error(
          "TOUR STATUS ERROR:",
          error
        );

        alert(
          error?.message ||
            "Tour statusini o'zgartirishda xatolik."
        );
      }
    };


  // ============================================================
  // EDIT REQUEST STATUS
  // ============================================================

  const setEditRequestStatus =
    async (
      requestId,
      newStatus
    ) => {
      try {
        await apiPatch(
          `/admin/tour-edit-requests/${requestId}/status`,
          {
            status:
              newStatus,
          }
        );

        await qc.invalidateQueries({
          queryKey: [
            "admin-tour-edit-requests",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tour-edit-requests",
            "mine",
          ],
        });

      } catch (error) {
        console.error(
          "EDIT REQUEST STATUS ERROR:",
          error
        );

        alert(
          error?.message ||
            "Edit request statusini o'zgartirishda xatolik."
        );
      }
    };


  // ============================================================
  // DELETE TOUR
  // ============================================================

  const deleteTour =
    async (
      tourId
    ) => {
      const confirmed =
        window.confirm(
          "Delete this tour permanently?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await apiDelete(
          `/tours/${tourId}`
        );

        await qc.invalidateQueries({
          queryKey: [
            "admin-tours",
          ],
        });

        await qc.invalidateQueries({
          queryKey: [
            "tours",
          ],
        });

      } catch (error) {
        console.error(
          "DELETE TOUR ERROR:",
          error
        );

        alert(
          error?.message ||
            "Tourni o'chirishda xatolik."
        );
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  const loading =
    loadingUsers ||
    loadingOrganizers ||
    loadingTours ||
    loadingBookings ||
    loadingEditRequests;


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      {/* HEADER */}

      <div className="flex items-center gap-2">

        <ShieldCheck className="text-emerald-600" />

        <h1 className="text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>

      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Verify organizers, moderate tours and manage edit requests.
      </p>


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
                  "organizers" &&
                  pendingOrganizers.length >
                    0 && (

                    <Badge
                      n={
                        pendingOrganizers.length
                      }
                    />

                  )}


                {item.key ===
                  "tours" &&
                  pendingTours.length >
                    0 && (

                    <Badge
                      n={
                        pendingTours.length
                      }
                    />

                  )}


                {item.key ===
                  "edit-requests" &&
                  pendingEditRequests.length >
                    0 && (

                    <Badge
                      n={
                        pendingEditRequests.length
                      }
                    />

                  )}

              </button>
            );
          }
        )}

      </div>


      {/* CONTENT */}

      <div className="mt-8">


        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {tab ===
          "overview" && (

          loading ? (

            <CenterLoader />

          ) : (

            <div className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <StatCard
                  icon={Users}
                  label="Total users"
                  value={
                    users.length
                  }
                  hint={`${travelers.length} travelers · ${organizerUsers.length} organizers`}
                  tone="emerald"
                />

                <StatCard
                  icon={Compass}
                  label="Total tours"
                  value={
                    tours.length
                  }
                  hint={`${approvedTours.length} live`}
                  tone="indigo"
                />

                <StatCard
                  icon={Calendar}
                  label="Bookings"
                  value={
                    bookings.length
                  }
                  hint={`${approvedBookings.length} approved`}
                  tone="amber"
                />

                <StatCard
                  icon={Pencil}
                  label="Edit requests"
                  value={
                    pendingEditRequests.length
                  }
                  hint="pending review"
                  tone="sky"
                />

              </div>


              <div className="grid gap-6 lg:grid-cols-2">


                {/* CHART */}

                <div className="rounded-2xl border border-border bg-card p-6">

                  <h3 className="font-semibold">
                    Tours by status
                  </h3>

                  <div className="mt-4 h-64">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={
                          chartData
                        }
                        margin={{
                          top: 10,
                          right: 10,
                          left: -20,
                          bottom: 0,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={
                            false
                          }
                        />

                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 12,
                          }}
                          stroke="#94a3b8"
                        />

                        <YAxis
                          allowDecimals={
                            false
                          }
                          tick={{
                            fontSize: 12,
                          }}
                          stroke="#94a3b8"
                        />

                        <Tooltip />

                        <Bar
                          dataKey="value"
                          radius={[
                            6,
                            6,
                            0,
                            0,
                          ]}
                        >

                          {chartData.map(
                            (
                              item,
                              index
                            ) => (

                              <Cell
                                key={
                                  index
                                }
                                fill={
                                  item.fill
                                }
                              />

                            )
                          )}

                        </Bar>

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                </div>


                {/* PENDING */}

                <div className="rounded-2xl border border-border bg-card p-6">

                  <h3 className="font-semibold">
                    Pending approvals
                  </h3>

                  {pendingOrganizers.length ===
                    0 &&
                  pendingTours.length ===
                    0 &&
                  pendingEditRequests.length ===
                    0 ? (

                    <p className="mt-4 text-sm text-muted-foreground">
                      All caught up — nothing pending.
                    </p>

                  ) : (

                    <div className="mt-4 space-y-3">


                      {pendingOrganizers.map(
                        (
                          organizer
                        ) => (

                          <div
                            key={`org-${organizer.id}`}
                            className="flex items-center justify-between rounded-xl border border-border p-3"
                          >

                            <span className="text-sm font-medium">
                              {
                                organizer.full_name
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setParams({
                                  tab:
                                    "organizers",
                                })
                              }
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Review →
                            </button>

                          </div>

                        )
                      )}


                      {pendingTours.map(
                        (
                          tour
                        ) => (

                          <div
                            key={`tour-${tour.id}`}
                            className="flex items-center justify-between rounded-xl border border-border p-3"
                          >

                            <span className="text-sm font-medium">
                              {
                                tour.title
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setParams({
                                  tab:
                                    "tours",
                                })
                              }
                              className="text-xs font-medium text-emerald-600 hover:underline"
                            >
                              Review →
                            </button>

                          </div>

                        )
                      )}


                      {pendingEditRequests.map(
                        (
                          request
                        ) => {
                          const tour =
                            tours.find(
                              (
                                item
                              ) =>
                                Number(
                                  item.id
                                ) ===
                                Number(
                                  request.tour_id
                                )
                            );

                          return (
                            <div
                              key={`edit-${request.id}`}
                              className="flex items-center justify-between rounded-xl border border-border p-3"
                            >

                              <span className="text-sm font-medium">
                                Edit:{" "}
                                {
                                  tour?.title ||
                                  `Tour #${request.tour_id}`
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setParams({
                                    tab:
                                      "edit-requests",
                                  })
                                }
                                className="text-xs font-medium text-emerald-600 hover:underline"
                              >
                                Review →
                              </button>

                            </div>
                          );
                        }
                      )}

                    </div>

                  )}

                </div>

              </div>

            </div>

          )

        )}


        {/* ====================================================
            ORGANIZERS
        ==================================================== */}

        {tab ===
          "organizers" && (

          loadingOrganizers ? (

            <CenterLoader />

          ) : organizersError ? (

            <EmptyState
              icon={
                ShieldCheck
              }
              title="Organizersni yuklab bo'lmadi"
              description={
                organizersError?.message ||
                "Server error"
              }
            />

          ) : organizers.length ===
            0 ? (

            <EmptyState
              icon={
                ShieldCheck
              }
              title="No organizers"
            />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">

              <table className="w-full min-w-[850px] text-left text-sm">

                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">

                  <tr>

                    <th className="p-4">
                      Organizer
                    </th>

                    <th className="p-4">
                      Phone
                    </th>

                    <th className="p-4">
                      Status
                    </th>

                    <th className="p-4">
                      Tours
                    </th>

                    <th className="p-4">
                      Rating
                    </th>

                    <th className="p-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-border">

                  {organizers.map(
                    (
                      organizer
                    ) => {
                      const organizerTours =
                        tours.filter(
                          (
                            tour
                          ) =>
                            Number(
                              tour.organizer_profile_id
                            ) ===
                            Number(
                              organizer.id
                            )
                        );

                      return (
                        <tr
                          key={
                            organizer.id
                          }
                        >

                          <td className="p-4">

                            <Link
                              to={`/organizers/${organizer.id}`}
                              className="font-medium hover:text-emerald-600"
                            >
                              {
                                organizer.full_name
                              }
                            </Link>

                            <p className="text-xs text-muted-foreground">
                              User ID:{" "}
                              {
                                organizer.user_id
                              }
                            </p>

                          </td>


                          <td className="p-4 text-muted-foreground">
                            {
                              organizer.phone ||
                              "—"
                            }
                          </td>


                          <td className="p-4">

                            <StatusChip
                              status={
                                organizer.verification_status
                              }
                            />

                          </td>


                          <td className="p-4">
                            {
                              organizerTours.length
                            }
                          </td>


                          <td className="p-4">

                            {organizer.rating
                              ? Number(
                                  organizer.rating
                                ).toFixed(
                                  1
                                )
                              : "—"}

                          </td>


                          <td className="p-4">

                            <div className="flex justify-end gap-2">


                              {organizer.verification_status !==
                                "approved" && (

                                <ActBtn
                                  tone="emerald"
                                  icon={
                                    Check
                                  }
                                  label="Approve"
                                  onClick={() =>
                                    setOrganizerStatus(
                                      organizer.id,
                                      "approved"
                                    )
                                  }
                                />

                              )}


                              {organizer.verification_status !==
                                "rejected" && (

                                <ActBtn
                                  tone="amber"
                                  icon={X}
                                  label="Reject"
                                  onClick={() =>
                                    setOrganizerStatus(
                                      organizer.id,
                                      "rejected"
                                    )
                                  }
                                />

                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )

        )}


        {/* ====================================================
            TOURS
        ==================================================== */}

        {tab ===
          "tours" && (

          loadingTours ? (

            <CenterLoader />

          ) : toursError ? (

            <EmptyState
              icon={
                Compass
              }
              title="Tourlarni yuklab bo'lmadi"
              description={
                toursError?.message ||
                "Server error"
              }
            />

          ) : tours.length ===
            0 ? (

            <EmptyState
              icon={
                Compass
              }
              title="No tours"
            />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">

              <table className="w-full min-w-[900px] text-left text-sm">

                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">

                  <tr>

                    <th className="p-4">
                      Tour
                    </th>

                    <th className="p-4">
                      Starts
                    </th>

                    <th className="p-4">
                      Seats
                    </th>

                    <th className="p-4">
                      Status
                    </th>

                    <th className="p-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-border">

                  {tours.map(
                    (
                      tour
                    ) => (

                      <tr
                        key={
                          tour.id
                        }
                      >

                        <td className="p-4">

                          <Link
                            to={`/tours/${tour.id}`}
                            className="font-medium hover:text-emerald-600"
                          >
                            {
                              tour.title
                            }
                          </Link>

                          <p className="text-xs text-muted-foreground">
                            {formatPrice(
                              tour.price
                            )}
                          </p>

                        </td>


                        <td className="p-4 text-muted-foreground">

                          {formatDate(
                            tour.start_date
                          )}

                        </td>


                        <td className="p-4">

                          {
                            tour.available_seats
                          }

                          {" / "}

                          {
                            tour.maximum_people
                          }

                        </td>


                        <td className="p-4">

                          <TourStatusChip
                            status={
                              tour.status
                            }
                          />

                        </td>


                        <td className="p-4">

                          <div className="flex justify-end gap-2">


                            {tour.status !==
                              "approved" && (

                              <ActBtn
                                tone="emerald"
                                icon={Check}
                                label="Approve"
                                onClick={() =>
                                  setTourStatus(
                                    tour.id,
                                    "approved"
                                  )
                                }
                              />

                            )}


                            {tour.status !==
                              "rejected" && (

                              <ActBtn
                                tone="amber"
                                icon={X}
                                label="Reject"
                                onClick={() =>
                                  setTourStatus(
                                    tour.id,
                                    "rejected"
                                  )
                                }
                              />

                            )}


                            <ActBtn
                              tone="rose"
                              icon={
                                Trash2
                              }
                              label="Delete"
                              onClick={() =>
                                deleteTour(
                                  tour.id
                                )
                              }
                            />

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )

        )}


        {/* ====================================================
            EDIT REQUESTS
        ==================================================== */}

        {tab ===
          "edit-requests" && (

          loadingEditRequests ? (

            <CenterLoader />

          ) : editRequestsError ? (

            <EmptyState
              icon={Pencil}
              title="Edit requestlarni yuklab bo'lmadi"
              description={
                editRequestsError?.message ||
                "Server error"
              }
            />

          ) : editRequests.length ===
            0 ? (

            <EmptyState
              icon={Pencil}
              title="No edit requests"
              description="Organizer edit requests will appear here."
            />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">

              <table className="w-full min-w-[1000px] text-left text-sm">

                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">

                  <tr>

                    <th className="p-4">
                      Tour
                    </th>

                    <th className="p-4">
                      Organizer
                    </th>

                    <th className="p-4">
                      Reason
                    </th>

                    <th className="p-4">
                      Created
                    </th>

                    <th className="p-4">
                      Status
                    </th>

                    <th className="p-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-border">

                  {editRequests.map(
                    (
                      request
                    ) => {
                      const tour =
                        tours.find(
                          (
                            item
                          ) =>
                            Number(
                              item.id
                            ) ===
                            Number(
                              request.tour_id
                            )
                        );

                      const organizer =
                        organizers.find(
                          (
                            item
                          ) =>
                            Number(
                              item.id
                            ) ===
                            Number(
                              request.organizer_profile_id
                            )
                        );

                      return (
                        <tr
                          key={
                            request.id
                          }
                        >

                          <td className="p-4">

                            {tour ? (

                              <Link
                                to={`/tours/${tour.id}`}
                                className="font-medium hover:text-emerald-600"
                              >
                                {
                                  tour.title
                                }
                              </Link>

                            ) : (

                              <span className="font-medium">
                                Tour #{request.tour_id}
                              </span>

                            )}

                          </td>


                          <td className="p-4">

                            {
                              organizer?.full_name ||
                              `Organizer #${request.organizer_profile_id}`
                            }

                          </td>


                          <td className="max-w-md p-4">

                            <p className="whitespace-pre-line text-sm">
                              {
                                request.reason
                              }
                            </p>

                          </td>


                          <td className="p-4 text-muted-foreground">

                            {formatDate(
                              request.created_at
                            )}

                          </td>


                          <td className="p-4">

                            <EditRequestStatusChip
                              status={
                                request.status
                              }
                            />

                          </td>


                          <td className="p-4">

                            {request.status ===
                            "pending" ? (

                              <div className="flex justify-end gap-2">

                                <ActBtn
                                  tone="emerald"
                                  icon={
                                    Check
                                  }
                                  label="Approve"
                                  onClick={() =>
                                    setEditRequestStatus(
                                      request.id,
                                      "approved"
                                    )
                                  }
                                />

                                <ActBtn
                                  tone="amber"
                                  icon={X}
                                  label="Reject"
                                  onClick={() =>
                                    setEditRequestStatus(
                                      request.id,
                                      "rejected"
                                    )
                                  }
                                />

                              </div>

                            ) : (

                              <div className="flex justify-end">

                                <span className="text-xs text-muted-foreground">

                                  {request.status ===
                                  "used"
                                    ? "Permission used"
                                    : "Reviewed"}

                                </span>

                              </div>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )

        )}


        {/* ====================================================
            USERS
        ==================================================== */}

        {tab ===
          "users" && (

          loadingUsers ? (

            <CenterLoader />

          ) : usersError ? (

            <EmptyState
              icon={Users}
              title="Userlarni yuklab bo'lmadi"
              description={
                usersError?.message ||
                "Server error"
              }
            />

          ) : users.length ===
            0 ? (

            <EmptyState
              icon={Users}
              title="No users"
            />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">

              <table className="w-full min-w-[750px] text-left text-sm">

                <thead className="bg-accent/60 text-xs uppercase tracking-wide text-muted-foreground">

                  <tr>

                    <th className="p-4">
                      User
                    </th>

                    <th className="p-4">
                      Role
                    </th>

                    <th className="p-4">
                      Phone
                    </th>

                    <th className="p-4">
                      Joined
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-border">

                  {users.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td className="p-4">

                          <p className="font-medium">
                            {
                              item.email
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            ID:{" "}
                            {
                              item.id
                            }
                          </p>

                        </td>


                        <td className="p-4">

                          <RoleChip
                            role={
                              item.role
                            }
                          />

                        </td>


                        <td className="p-4 text-muted-foreground">

                          {
                            item.phone ||
                            "—"
                          }

                        </td>


                        <td className="p-4 text-muted-foreground">

                          {formatDate(
                            item.created_at
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )

        )}


        {/* ERRORS */}

        {bookingsError && (

          <p className="mt-6 text-sm text-destructive">
            Booking API error:{" "}
            {
              bookingsError.message
            }
          </p>

        )}

      </div>

    </div>
  );
}


// ============================================================
// BADGE
// ============================================================

function Badge({
  n,
}) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">

      {n}

    </span>
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


// ============================================================
// ORGANIZER STATUS
// ============================================================

function StatusChip({
  status,
}) {
  const map = {
    approved:
      "bg-emerald-50 text-emerald-700",

    pending:
      "bg-amber-50 text-amber-700",

    rejected:
      "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        map[
          status
        ] ||
        "bg-slate-100 text-slate-600"
      }`}
    >

      {
        status
      }

    </span>
  );
}


// ============================================================
// TOUR STATUS
// ============================================================

function TourStatusChip({
  status,
}) {
  const map = {
    approved:
      "bg-emerald-50 text-emerald-700",

    pending:
      "bg-amber-50 text-amber-700",

    rejected:
      "bg-rose-50 text-rose-700",

    draft:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        map[
          status
        ] ||
        "bg-slate-100 text-slate-600"
      }`}
    >

      {
        status
      }

    </span>
  );
}


// ============================================================
// EDIT REQUEST STATUS
// ============================================================

function EditRequestStatusChip({
  status,
}) {
  const map = {
    pending:
      "bg-amber-50 text-amber-700",

    approved:
      "bg-emerald-50 text-emerald-700",

    rejected:
      "bg-rose-50 text-rose-700",

    used:
      "bg-indigo-50 text-indigo-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        map[
          status
        ] ||
        "bg-slate-100 text-slate-600"
      }`}
    >

      {status ===
        "pending" && (
        <Clock3
          size={12}
        />
      )}

      {
        status
      }

    </span>
  );
}


// ============================================================
// ROLE
// ============================================================

function RoleChip({
  role,
}) {
  const map = {
    admin:
      "bg-indigo-50 text-indigo-700",

    organizer:
      "bg-amber-50 text-amber-700",

    traveler:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        map[
          role
        ] ||
        "bg-slate-100 text-slate-600"
      }`}
    >

      {
        role ||
        "guest"
      }

    </span>
  );
}


// ============================================================
// ACTION BUTTON
// ============================================================

function ActBtn({
  tone,
  icon: Icon,
  label,
  onClick,
}) {
  const tones = {
    emerald:
      "bg-emerald-600 text-white hover:bg-emerald-700",

    amber:
      "border border-border text-amber-600 hover:bg-amber-50",

    rose:
      "border border-border text-destructive hover:bg-rose-50",
  };

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tones[tone]}`}
    >

      <Icon
        size={13}
      />

      {
        label
      }

    </button>
  );
}