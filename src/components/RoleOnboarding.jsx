import React from "react";
import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";

import {
  Compass,
  Briefcase,
} from "lucide-react";


export default function RoleOnboarding() {
  const { user } = useAuth();

  const navigate =
    useNavigate();

  const role =
    String(
      user?.role || ""
    ).toLowerCase();

  const goTraveler = () => {
    navigate("/dashboard");
  };

  const goOrganizer = () => {
    if (
      role === "organizer"
    ) {
      navigate(
        "/organizer/onboarding"
      );

      return;
    }

    navigate("/register");
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 p-4 backdrop-blur">

      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl">

        <h2 className="text-2xl font-bold tracking-tight">
          Welcome to TripNet 👋
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Choose where you want to continue.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={goTraveler}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50"
          >

            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600">

              <Compass size={22} />

            </span>

            <span className="font-semibold">
              Traveler
            </span>

            <span className="text-xs text-muted-foreground">
              Search and book mini tours.
            </span>

          </button>

          <button
            type="button"
            onClick={goOrganizer}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50/50"
          >

            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-100 text-indigo-600">

              <Briefcase size={22} />

            </span>

            <span className="font-semibold">
              Organizer
            </span>

            <span className="text-xs text-muted-foreground">
              Create and manage tours.
            </span>

          </button>

        </div>

      </div>

    </div>
  );
}