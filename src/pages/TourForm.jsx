import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  apiGet,
  apiPost,
  apiPatch,
} from "@/api/apiClient";

import { useAuth } from "@/lib/AuthContext";

import ImageUploader from "@/components/ImageUploader";

import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";

import { slugify } from "@/lib/triphub";


const TRANSPORTS = [
  "None",
  "Bus",
  "Minivan",
  "Car",
  "Train",
  "Flight",
];


const empty = {
  title: "",
  description: "",
  category_id: "",
  region_id: "",
  district: "",
  meeting_point: "",
  price: "",
  duration: "",
  start_date: "",
  end_date: "",
  maximum_people: 10,
  transport: "Bus",
  accommodation: "",
  included: "",
  excluded: "",
  requirements: "",
  images: [],
};


// ============================================================
// DATETIME -> datetime-local
// ============================================================

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}


export default function TourForm() {
  const { id } = useParams();

  const isEdit = Boolean(id);

  const navigate =
    useNavigate();

  const qc =
    useQueryClient();

  const { user } =
    useAuth();


  // ============================================================
  // FORM STATE
  // ============================================================

  const [form, setForm] =
    useState(empty);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    formInitialized,
    setFormInitialized,
  ] = useState(false);


  // ============================================================
  // CATEGORIES
  // ============================================================

  const {
    data: categories = [],
    isLoading:
      loadingCategories,
  } = useQuery({
    queryKey: ["categories"],

    queryFn: () =>
      apiGet("/categories"),
  });


  // ============================================================
  // REGIONS
  // ============================================================

  const {
    data: regions = [],
    isLoading:
      loadingRegions,
  } = useQuery({
    queryKey: ["regions"],

    queryFn: () =>
      apiGet("/regions"),
  });


  // ============================================================
  // CURRENT ORGANIZER PROFILE
  // ============================================================

  const {
    data: profile,
    isLoading:
      loadingOrganizer,
    error: organizerError,
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
  // TOUR FOR EDIT MODE
  // ============================================================

  const {
    data: existingTour,
    isLoading:
      loadingTour,
    error: tourError,
  } = useQuery({
    queryKey: [
      "tour",
      String(id),
    ],

    queryFn: () =>
      apiGet(
        `/tours/${id}`
      ),

    enabled: isEdit,
    retry: false,
  });


  // ============================================================
  // FILL FORM IN EDIT MODE
  // ============================================================

  useEffect(() => {
    if (
      !isEdit ||
      !existingTour ||
      formInitialized
    ) {
      return;
    }

    setForm({
      title:
        existingTour.title ||
        "",

      description:
        existingTour.description ||
        "",

      category_id:
        existingTour.category_id ??
        "",

      region_id:
        existingTour.region_id ??
        "",

      district:
        existingTour.district ||
        "",

      meeting_point:
        existingTour.meeting_point ||
        "",

      price:
        existingTour.price ??
        "",

      duration:
        existingTour.duration ||
        "",

      start_date:
        toDateTimeLocal(
          existingTour.start_date
        ),

      end_date:
        toDateTimeLocal(
          existingTour.end_date
        ),

      maximum_people:
        existingTour.maximum_people ??
        10,

      transport:
        existingTour.transport ||
        "Bus",

      accommodation:
        existingTour.accommodation ||
        "",

      included:
        existingTour.included ||
        "",

      excluded:
        existingTour.excluded ||
        "",

      requirements:
        existingTour.requirements ||
        "",

      images:
        Array.isArray(
          existingTour.images
        )
          ? existingTour.images
          : [],
    });

    setFormInitialized(true);
  }, [
    isEdit,
    existingTour,
    formInitialized,
  ]);


  // ============================================================
  // SET FIELD
  // ============================================================

  const set = (
    key,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };


  // ============================================================
  // LOADING
  // ============================================================

  const loading =
    loadingCategories ||
    loadingRegions ||
    loadingOrganizer ||
    (
      isEdit &&
      loadingTour
    );

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center">

        <Loader2 className="animate-spin text-muted-foreground" />

      </div>
    );
  }


  // ============================================================
  // ORGANIZER ACCESS
  // ============================================================

  if (
    String(
      user?.role || ""
    ).toLowerCase() !==
    "organizer"
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

          <div className="flex gap-3">

            <AlertTriangle
              className="mt-0.5 shrink-0 text-amber-600"
              size={20}
            />

            <div>

              <h2 className="font-semibold text-amber-800">
                Organizer access required
              </h2>

              <p className="mt-1 text-sm text-amber-700">
                Only organizer accounts can create or edit tours.
              </p>

              <Link
                to="/"
                className="mt-4 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Go home
              </Link>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ============================================================
  // ORGANIZER PROFILE ERROR
  // ============================================================

  if (
    organizerError ||
    !profile
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">

        <p className="text-sm text-muted-foreground">
          You need an organizer profile before managing tours.
        </p>

        <Link
          to="/organizer/onboarding"
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Create organizer profile
        </Link>

      </div>
    );
  }


  // ============================================================
  // TOUR NOT FOUND
  // ============================================================

  if (
    isEdit &&
    (
      tourError ||
      !existingTour
    )
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">

          <div className="flex gap-3">

            <AlertTriangle
              className="mt-0.5 shrink-0 text-rose-600"
              size={20}
            />

            <div>

              <h2 className="font-semibold text-rose-800">
                Tour not found
              </h2>

              <p className="mt-1 text-sm text-rose-700">
                {tourError?.message ||
                  "This tour could not be loaded."}
              </p>

              <Link
                to="/organizer?tab=tours"
                className="mt-4 inline-flex rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Back to tours
              </Link>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ============================================================
  // OWNERSHIP CHECK
  // ============================================================

  if (
    isEdit &&
    existingTour &&
    Number(
      existingTour.organizer_profile_id
    ) !==
      Number(
        profile.id
      )
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">

          <div className="flex gap-3">

            <AlertTriangle
              className="mt-0.5 shrink-0 text-rose-600"
              size={20}
            />

            <div>

              <h2 className="font-semibold text-rose-800">
                Access denied
              </h2>

              <p className="mt-1 text-sm text-rose-700">
                You can only edit your own tours.
              </p>

              <Link
                to="/organizer?tab=tours"
                className="mt-4 inline-flex rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Back to tours
              </Link>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = async (
    event
  ) => {
    event.preventDefault();

    setError("");


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    if (
      !form.title.trim()
    ) {
      setError(
        "Title is required."
      );

      return;
    }

    if (
      form.title.trim()
        .length < 4
    ) {
      setError(
        "Title must be at least 4 characters."
      );

      return;
    }


    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    if (
      !form.description.trim()
    ) {
      setError(
        "Description is required."
      );

      return;
    }

    if (
      form.description
        .trim()
        .length < 20
    ) {
      setError(
        "Description must be at least 20 characters."
      );

      return;
    }


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
      !form.category_id
    ) {
      setError(
        "Please select a category."
      );

      return;
    }


    // --------------------------------------------------------
    // REGION
    // --------------------------------------------------------

    if (
      !form.region_id
    ) {
      setError(
        "Please select a region."
      );

      return;
    }


    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    if (
      form.price === "" ||
      Number(
        form.price
      ) < 0
    ) {
      setError(
        "Please enter a valid price."
      );

      return;
    }


    // --------------------------------------------------------
    // DURATION
    // --------------------------------------------------------

    if (
      !String(
        form.duration
      ).trim()
    ) {
      setError(
        "Duration is required."
      );

      return;
    }


    // --------------------------------------------------------
    // START DATE
    // --------------------------------------------------------

    if (
      !form.start_date
    ) {
      setError(
        "Start date is required."
      );

      return;
    }


    // --------------------------------------------------------
    // PEOPLE
    // --------------------------------------------------------

    if (
      Number(
        form.maximum_people
      ) < 1
    ) {
      setError(
        "Maximum people must be at least 1."
      );

      return;
    }


    // --------------------------------------------------------
    // END DATE
    // --------------------------------------------------------

    if (
      form.end_date &&
      new Date(
        form.end_date
      ) <
        new Date(
          form.start_date
        )
    ) {
      setError(
        "End date cannot be before start date."
      );

      return;
    }


    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {
      title:
        form.title.trim(),

      slug:
        slugify(
          form.title.trim()
        ),

      description:
        form.description.trim(),

      category_id:
        Number(
          form.category_id
        ),

      region_id:
        Number(
          form.region_id
        ),

      district:
        form.district.trim() ||
        null,

      meeting_point:
        form.meeting_point.trim() ||
        null,

      latitude: null,
      longitude: null,

      price:
        Number(
          form.price
        ),

      duration:
        String(
          form.duration
        ).trim(),

      start_date:
        new Date(
          form.start_date
        ).toISOString(),

      end_date:
        form.end_date
          ? new Date(
              form.end_date
            ).toISOString()
          : null,

      maximum_people:
        Number(
          form.maximum_people
        ),

      transport:
        form.transport,

      accommodation:
        form.accommodation.trim() ||
        null,

      included:
        form.included.trim() ||
        null,

      excluded:
        form.excluded.trim() ||
        null,

      requirements:
        form.requirements.trim() ||
        null,

      images:
        Array.isArray(
          form.images
        )
          ? form.images
          : [],
    };


    // ========================================================
    // REQUEST
    // ========================================================

    setSaving(true);

    try {
      if (isEdit) {
        const updated =
          await apiPatch(
            `/tours/${id}`,
            payload
          );

        console.log(
          "TOUR UPDATED:",
          updated
        );

      } else {
        const created =
          await apiPost(
            "/tours",
            payload
          );

        console.log(
          "TOUR CREATED:",
          created
        );
      }


      // ======================================================
      // INVALIDATE CACHE
      // ======================================================

      await qc.invalidateQueries({
        queryKey: ["tours"],
      });

      await qc.invalidateQueries({
        queryKey: [
          "admin-tours",
        ],
      });

      await qc.invalidateQueries({
        queryKey: [
          "organizer-tours",
        ],
      });

      if (id) {
        await qc.invalidateQueries({
          queryKey: [
            "tour",
            String(id),
          ],
        });
      }


      // ======================================================
      // BACK TO DASHBOARD
      // ======================================================

      navigate(
        "/organizer?tab=tours"
      );

    } catch (err) {
      console.error(
        isEdit
          ? "TOUR UPDATE ERROR:"
          : "TOUR CREATE ERROR:",
        err
      );

      setError(
        err?.message ||
          (
            isEdit
              ? "Failed to update tour"
              : "Failed to create tour"
          )
      );

    } finally {
      setSaving(false);
    }
  };


  // ============================================================
  // INPUT CLASS
  // ============================================================

  const input =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-400";


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

      {/* BACK */}

      <Link
        to="/organizer?tab=tours"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >

        <ArrowLeft size={16} />

        Back to tours

      </Link>


      {/* TITLE */}

      <h1 className="mt-3 text-3xl font-bold tracking-tight">

        {isEdit
          ? "Edit tour"
          : "Create a new tour"}

      </h1>

      <p className="mt-1 text-sm text-muted-foreground">

        {isEdit
          ? "Changes will be submitted for admin approval again."
          : "New tours are submitted for admin approval before going live."}

      </p>


      {/* EDIT WARNING */}

      {isEdit && (

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <div className="flex gap-2">

            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <p className="text-sm text-amber-700">

              Editing this tour will change its status to{" "}

              <strong>
                pending
              </strong>

              . An admin must approve it again before it becomes live.

            </p>

          </div>

        </div>

      )}


      {/* FORM */}

      <form
        onSubmit={submit}
        className="mt-8 space-y-8"
      >

        {/* ====================================================
            BASICS
        ==================================================== */}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">

          <h2 className="font-semibold">
            Basics
          </h2>


          {/* TITLE */}

          <div>

            <label className="text-sm font-medium">
              Title
            </label>

            <input
              value={
                form.title
              }
              onChange={(e) =>
                set(
                  "title",
                  e.target.value
                )
              }
              className={`mt-1 ${input}`}
              placeholder="e.g. Samarkand Heritage Walk"
            />

          </div>


          {/* DESCRIPTION */}

          <div>

            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                set(
                  "description",
                  e.target.value
                )
              }
              rows={5}
              className={`mt-1 ${input}`}
              placeholder="Describe the experience, itinerary and highlights..."
            />

          </div>


          {/* CATEGORY / REGION */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="text-sm font-medium">
                Category
              </label>

              <select
                value={
                  form.category_id
                }
                onChange={(e) =>
                  set(
                    "category_id",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              >

                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            <div>

              <label className="text-sm font-medium">
                Region
              </label>

              <select
                value={
                  form.region_id
                }
                onChange={(e) =>
                  set(
                    "region_id",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              >

                <option value="">
                  Select region
                </option>

                {regions.map(
                  (region) => (

                    <option
                      key={
                        region.id
                      }
                      value={
                        region.id
                      }
                    >
                      {
                        region.name
                      }
                    </option>

                  )
                )}

              </select>

            </div>

          </div>


          {/* DISTRICT / MEETING */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="text-sm font-medium">
                District
              </label>

              <input
                value={
                  form.district
                }
                onChange={(e) =>
                  set(
                    "district",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>


            <div>

              <label className="text-sm font-medium">
                Meeting point
              </label>

              <input
                value={
                  form.meeting_point
                }
                onChange={(e) =>
                  set(
                    "meeting_point",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            SCHEDULE & PRICING
        ==================================================== */}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">

          <h2 className="font-semibold">
            Schedule & pricing
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


            {/* START */}

            <div>

              <label className="text-sm font-medium">
                Start date & time
              </label>

              <input
                type="datetime-local"
                value={
                  form.start_date
                }
                onChange={(e) =>
                  set(
                    "start_date",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>


            {/* END */}

            <div>

              <label className="text-sm font-medium">
                End date & time
              </label>

              <input
                type="datetime-local"
                value={
                  form.end_date
                }
                onChange={(e) =>
                  set(
                    "end_date",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>


            {/* DURATION */}

            <div>

              <label className="text-sm font-medium">
                Duration
              </label>

              <input
                value={
                  form.duration
                }
                onChange={(e) =>
                  set(
                    "duration",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
                placeholder="e.g. 2 days"
              />

            </div>


            {/* PRICE */}

            <div>

              <label className="text-sm font-medium">
                Price per person (so'm)
              </label>

              <input
                type="number"
                min={0}
                value={
                  form.price
                }
                onChange={(e) =>
                  set(
                    "price",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>


            {/* MAX PEOPLE */}

            <div>

              <label className="text-sm font-medium">
                Max people
              </label>

              <input
                type="number"
                min={1}
                value={
                  form.maximum_people
                }
                onChange={(e) =>
                  set(
                    "maximum_people",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              />

            </div>


            {/* TRANSPORT */}

            <div>

              <label className="text-sm font-medium">
                Transport
              </label>

              <select
                value={
                  form.transport
                }
                onChange={(e) =>
                  set(
                    "transport",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
              >

                {TRANSPORTS.map(
                  (transport) => (

                    <option
                      key={
                        transport
                      }
                      value={
                        transport
                      }
                    >
                      {
                        transport
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            {/* ACCOMMODATION */}

            <div className="sm:col-span-2 lg:col-span-3">

              <label className="text-sm font-medium">
                Accommodation
              </label>

              <input
                value={
                  form.accommodation
                }
                onChange={(e) =>
                  set(
                    "accommodation",
                    e.target.value
                  )
                }
                className={`mt-1 ${input}`}
                placeholder="e.g. Boutique guesthouse, Yurt camp, None"
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            DETAILS
        ==================================================== */}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">

          <h2 className="font-semibold">
            Details
          </h2>


          {/* INCLUDED */}

          <div>

            <label className="text-sm font-medium">
              Included
            </label>

            <textarea
              value={
                form.included
              }
              onChange={(e) =>
                set(
                  "included",
                  e.target.value
                )
              }
              rows={4}
              className={`mt-1 ${input}`}
              placeholder={"Guide\nMeals\nTransfers"}
            />

          </div>


          {/* EXCLUDED */}

          <div>

            <label className="text-sm font-medium">
              Excluded
            </label>

            <textarea
              value={
                form.excluded
              }
              onChange={(e) =>
                set(
                  "excluded",
                  e.target.value
                )
              }
              rows={4}
              className={`mt-1 ${input}`}
              placeholder={"Flights\nInsurance"}
            />

          </div>


          {/* REQUIREMENTS */}

          <div>

            <label className="text-sm font-medium">
              Requirements
            </label>

            <textarea
              value={
                form.requirements
              }
              onChange={(e) =>
                set(
                  "requirements",
                  e.target.value
                )
              }
              rows={3}
              className={`mt-1 ${input}`}
              placeholder={"Comfortable shoes\nPassport copy"}
            />

          </div>


          {/* IMAGES */}

          <div>

            <label className="text-sm font-medium">
              Images
            </label>

            <div className="mt-2">

              <ImageUploader
                value={
                  form.images
                }
                onChange={(value) =>
                  set(
                    "images",
                    value
                  )
                }
                max={8}
              />

            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>

        )}


        {/* SAVE */}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >

          {saving ? (

            <Loader2
              size={16}
              className="animate-spin"
            />

          ) : (

            <Save size={16} />

          )}

          {saving
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
            ? "Save changes"
            : "Create tour"}

        </button>

      </form>

    </div>
  );
}