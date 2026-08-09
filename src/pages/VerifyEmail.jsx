import React, {
  useState,
} from "react";

import {
  Link,
  useLocation,
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
  MailCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";


const TOKEN_KEY =
  "triphub_access_token";


function safeDestination(
  value
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value;
}


export default function VerifyEmail() {
  const [
    searchParams,
  ] = useSearchParams();

  const location =
    useLocation();


  const email =
    searchParams.get(
      "email"
    ) || "";


  const role =
    searchParams.get(
      "role"
    ) || "traveler";


  const requestedReturnTo =
    safeDestination(
      searchParams.get(
        "returnTo"
      )
    );


  const [
    code,
    setCode,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    resending,
    setResending,
  ] = useState(false);


  const [
    devCode,
    setDevCode,
  ] = useState(
    location.state?.devCode ||
    ""
  );


  // ============================================================
  // VERIFY
  // ============================================================

  const handleVerify = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");


    if (!email) {
      setError(
        "Email address is missing. Please register again."
      );

      return;
    }


    if (
      !/^\d{6}$/.test(
        code
      )
    ) {
      setError(
        "Enter the 6-digit verification code."
      );

      return;
    }


    setLoading(true);


    try {
      const result =
        await apiPost(
          "/auth/verify-email",
          {
            email,
            code,
          }
        );


      const token =
        result?.access_token;


      if (!token) {
        throw new Error(
          "Verification succeeded, but login token was not returned."
        );
      }


      localStorage.setItem(
        TOKEN_KEY,
        token
      );


      const userRole =
        result?.user?.role ||
        role;


      let destination;


      if (
        requestedReturnTo
      ) {
        destination =
          requestedReturnTo;

      } else if (
        userRole ===
        "organizer"
      ) {
        destination =
          "/organizer/onboarding";

      } else if (
        userRole ===
        "admin"
      ) {
        destination =
          "/admin";

      } else {
        destination =
          "/dashboard";
      }


      window.location.replace(
        destination
      );

    } catch (err) {
      console.error(
        "VERIFY EMAIL ERROR:",
        err
      );


      setError(
        err?.message ||
        "Verification failed."
      );

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // RESEND
  // ============================================================

  const handleResend =
    async () => {
      if (!email) {
        setError(
          "Email address is missing."
        );

        return;
      }


      setError("");
      setSuccess("");
      setResending(true);


      try {
        const result =
          await apiPost(
            "/auth/resend-verification",
            {
              email,
            }
          );


        if (
          result?.dev_verification_code
        ) {
          setDevCode(
            result.dev_verification_code
          );
        }


        setSuccess(
          "A new verification code has been sent."
        );

      } catch (err) {
        console.error(
          "RESEND CODE ERROR:",
          err
        );


        setError(
          err?.message ||
          "Could not resend verification code."
        );

      } finally {
        setResending(false);
      }
    };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AuthLayout
      icon={MailCheck}
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your email"
      footer={
        <>
          Wrong email?{" "}

          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Register again
          </Link>
        </>
      }
    >
      {/* EMAIL */}

      <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Verification code sent to
        </p>

        <p className="mt-1 break-all font-semibold">
          {email || "Unknown email"}
        </p>
      </div>


      {/* LOCAL DEVELOPMENT CODE */}

      {devCode && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Local development
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Verification code:
          </p>

          <p className="mt-1 text-2xl font-bold tracking-[0.35em] text-amber-900">
            {devCode}
          </p>

          <p className="mt-2 text-xs text-amber-700">
            Productionda bu kod bu yerda ko‘rinmaydi.
            User emailiga yuboriladi.
          </p>
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}


      {/* SUCCESS */}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}


      <form
        onSubmit={handleVerify}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="verification-code">
            Verification code
          </Label>

          <Input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    6
                  );

              setCode(
                value
              );
            }}
            className="h-14 text-center text-2xl font-bold tracking-[0.4em]"
          />
        </div>


        <Button
          type="submit"
          className="h-12 w-full"
          disabled={
            loading ||
            code.length !== 6
          }
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>


        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />

              Resend code
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}