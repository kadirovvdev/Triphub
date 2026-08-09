import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  apiPost,
} from "@/api/apiClient";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";


export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [role, setRole] =
    useState("traveler");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ============================================================
  // REGISTER
  // ============================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      setError(
        "Email is required."
      );

      return;
    }


    if (!password) {
      setError(
        "Password is required."
      );

      return;
    }


    if (
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }


    if (
      ![
        "traveler",
        "organizer",
      ].includes(role)
    ) {
      setError(
        "Invalid account type."
      );

      return;
    }


    setLoading(true);


    try {
      const result =
        await apiPost(
          "/auth/register",
          {
            email:
              cleanEmail,

            password,

            role,

            phone:
              null,

            bio:
              null,

            avatar_url:
              null,
          }
        );


      const returnTo =
        safeReturnTo();


      const searchParams =
        new URLSearchParams();

      searchParams.set(
        "email",
        cleanEmail
      );

      searchParams.set(
        "role",
        role
      );


      if (
        returnTo &&
        returnTo !== "/"
      ) {
        searchParams.set(
          "returnTo",
          returnTo
        );
      }


      navigate(
        `/verify-email?${searchParams.toString()}`,
        {
          replace: true,

          state: {
            devCode:
              result?.dev_verification_code ||
              "",
          },
        }
      );

    } catch (err) {
      console.error(
        "REGISTER ERROR:",
        err
      );


      setError(
        err?.message ||
        "Registration failed."
      );

    } finally {
      setLoading(false);
    }
  };


  const returnTo =
    safeReturnTo();


  const loginUrl =
    returnTo !== "/"
      ? `/login?returnTo=${encodeURIComponent(
          returnTo
        )}`
      : "/login";


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}

          <Link
            to={loginUrl}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}


      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* EMAIL */}

        <div className="space-y-2">
          <Label htmlFor="email">
            Email
          </Label>

          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>


        {/* ROLE */}

        <div className="space-y-2">
          <Label htmlFor="role">
            Account type
          </Label>

          <select
            id="role"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value
              )
            }
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="traveler">
              Traveler
            </option>

            <option value="organizer">
              Organizer
            </option>
          </select>
        </div>


        {/* PASSWORD */}

        <div className="space-y-2">
          <Label htmlFor="password">
            Password
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>


        {/* CONFIRM PASSWORD */}

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirm Password
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>


        <Button
          type="submit"
          className="h-12 w-full font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}