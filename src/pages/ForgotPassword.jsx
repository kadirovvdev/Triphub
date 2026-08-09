import React, {
  useState,
} from "react";

import {
  Link,
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
  Mail,
  ArrowLeft,
  Loader2,
  KeyRound,
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";


export default function ForgotPassword() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    sent,
    setSent,
  ] = useState(false);

  const [
    resetToken,
    setResetToken,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result =
        await apiPost(
          "/auth/forgot-password",
          {
            email:
              email.trim(),
          }
        );

      setResetToken(
        result?.reset_token ||
          null
      );

      setSent(true);

    } catch (err) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong"
      );

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="Recover access to your TripNet account"
      footer={

        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >

          <ArrowLeft className="mr-1 inline h-3 w-3" />

          Back to log in

        </Link>

      }
    >

      {error && (

        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">

          {error}

        </div>

      )}

      {sent ? (

        <div className="space-y-5">

          <p className="text-center text-sm text-foreground">

            If an account exists
            with that email,
            password reset
            instructions are ready.

          </p>

          {resetToken && (

            <div className="space-y-3">

              <p className="text-center text-xs text-muted-foreground">

                Local development mode:
                continue directly to
                password reset.

              </p>

              <Button
                asChild
                className="h-12 w-full font-medium"
              >

                <Link
                  to={`/reset-password?token=${encodeURIComponent(
                    resetToken
                  )}`}
                >

                  <KeyRound className="mr-2 h-4 w-4" />

                  Reset password

                </Link>

              </Button>

            </div>

          )}

        </div>

      ) : (

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          <div className="space-y-2">

            <Label htmlFor="email">

              Email address

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
                onChange={(
                  event
                ) =>
                  setEmail(
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

                Preparing...

              </>
            ) : (

              "Continue"

            )}

          </Button>

        </form>

      )}

    </AuthLayout>
  );
}