import React from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";

import {
  Home,
  ShieldCheck,
} from "lucide-react";


export default function PageNotFound() {
  const location = useLocation();

  const {
    user,
    isAuthenticated,
  } = useAuth();

  const pageName =
    location.pathname.substring(1) ||
    "unknown";

  const isAdmin =
    isAuthenticated &&
    String(
      user?.role || ""
    ).toLowerCase() === "admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">

      <div className="w-full max-w-md">

        <div className="space-y-6 text-center">

          <div className="space-y-2">

            <h1 className="text-7xl font-light text-slate-300">
              404
            </h1>

            <div className="mx-auto h-0.5 w-16 bg-slate-200" />

          </div>

          <div className="space-y-3">

            <h2 className="text-2xl font-medium text-slate-800">
              Page Not Found
            </h2>

            <p className="leading-relaxed text-slate-600">

              The page{" "}

              <span className="font-medium text-slate-700">
                "{pageName}"
              </span>{" "}

              could not be found.

            </p>

          </div>

          {isAdmin && (

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />

                <div>

                  <p className="text-sm font-medium text-indigo-900">
                    Admin information
                  </p>

                  <p className="mt-1 text-sm text-indigo-700">
                    This route does not exist in the current TripNet frontend.
                  </p>

                </div>

              </div>

            </div>

          )}

          <div className="pt-4">

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >

              <Home size={16} />

              Go Home

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}