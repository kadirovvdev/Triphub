import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
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
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";


export default function ResetPassword() {
  const [
    searchParams,
  ] = useSearchParams();

  const navigate =
    useNavigate();

  const resetToken =
    searchParams.get(
      "token"
    );

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (
      newPassword.length < 8
    ) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      await apiPost(
        "/auth/reset-password",
        {
          token:
            resetToken,

          new_password:
            newPassword,
        }
      );

      setSuccess(true);

      window.setTimeout(
        () => {
          navigate(
            "/login",
            {
              replace: true,
            }
          );
        },
        1500
      );

    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to reset password"
      );

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // INVALID LINK
  // ============================================================

  if (!resetToken) {
    return (
      <AuthLayout
        icon={
          AlertTriangle
        }
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid"
        footer={

          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >

            Request a new link

          </Link>

        }
      >

        <p className="text-center text-sm text-foreground">

          The link appears to be
          incomplete. Please request
          a new password reset.

        </p>

      </AuthLayout>
    );
  }


  // ============================================================
  // SUCCESS
  // ============================================================

  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Password changed"
        subtitle="Your password has been updated successfully"
      >

        <div className="text-center">

          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />

          <p className="mt-4 text-sm text-muted-foreground">

            Redirecting to login...

          </p>

        </div>

      </AuthLayout>
    );
  }


  // ============================================================
  // FORM
  // ============================================================

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
    >

      {error && (

        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">

          {error}

        </div>

      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >

        <div className="space-y-2">

          <Label htmlFor="password">

            New Password

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
              autoFocus
              placeholder="••••••••"
              value={
                newPassword
              }
              onChange={(
                event
              ) =>
                setNewPassword(
                  event.target.value
                )
              }
              className="h-12 pl-10"
              minLength={8}
              required
            />

          </div>

        </div>

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
              value={
                confirmPassword
              }
              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              className="h-12 pl-10"
              minLength={8}
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

              Resetting...

            </>
          ) : (

            "Reset password"

          )}

        </Button>

      </form>

    </AuthLayout>
  );
}