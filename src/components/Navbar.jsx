import React, { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

import {
  Plane,
  Menu,
  X,
  LayoutDashboard,
  Heart,
  LogOut,
  ShieldCheck,
} from "lucide-react";


export default function Navbar() {
  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const [open, setOpen] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const navigate = useNavigate();

  const role =
    String(
      user?.role || "traveler"
    ).toLowerCase();

  // ============================================================
  // SCROLL
  // ============================================================

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(
        window.scrollY > 24
      );
    };

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();

    setOpen(false);

    navigate("/");
  };

  // ============================================================
  // DASHBOARD
  // ============================================================

  const dashHref =
    role === "admin"
      ? "/admin"
      : role === "organizer"
      ? "/organizer"
      : "/dashboard";

  // ============================================================
  // LINKS
  // ============================================================

  const links = [
    {
      to: "/tours",
      label: "Explore Tours",
    },
    {
      to: "/organizers",
      label: "Organizers",
    },
    {
      to: "/about",
      label: "About",
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/40 bg-white/80 shadow-sm backdrop-blur-xl"
          : "bg-white/70 backdrop-blur-md"
      }`}
    >

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center gap-2"
        >

          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow">

            <Plane size={18} />

          </span>

          <span className="text-lg font-bold tracking-tight text-foreground">

            Trip
            <span className="text-emerald-600">
              Net
            </span>

          </span>

          <span className="hidden text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">

            Uzbekistan

          </span>

        </Link>

        {/* DESKTOP NAV */}

        <div className="hidden items-center gap-7 md:flex">

          {links.map((link) => (

            <NavLink
              key={link.to}
              to={link.to}
              className={({
                isActive,
              }) =>
                `text-sm font-medium transition hover:text-emerald-600 ${
                  isActive
                    ? "text-emerald-600"
                    : "text-foreground/80"
                }`
              }
            >
              {link.label}
            </NavLink>

          ))}

        </div>

        {/* DESKTOP ACTIONS */}

        <div className="hidden items-center gap-2 md:flex">

          {isAuthenticated ? (
            <>

              {role === "traveler" && (

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >

                  <Link to="/dashboard?tab=favorites">

                    <Heart size={16} />

                  </Link>

                </Button>

              )}

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5"
              >

                <Link to={dashHref}>

                  <LayoutDashboard
                    size={16}
                  />

                  Dashboard

                </Link>

              </Button>

              {role === "admin" && (

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                >

                  <Link to="/admin">

                    <ShieldCheck
                      size={16}
                    />

                    Admin

                  </Link>

                </Button>

              )}

              <Button
                onClick={
                  handleLogout
                }
                variant="outline"
                size="sm"
                className="gap-1.5"
              >

                <LogOut
                  size={16}
                />

                Logout

              </Button>

            </>
          ) : (
            <>

              <Button
                asChild
                variant="ghost"
                size="sm"
              >

                <Link to="/login">
                  Log in
                </Link>

              </Button>

              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >

                <Link to="/register">
                  Get started
                </Link>

              </Button>

            </>
          )}

        </div>

        {/* MOBILE BUTTON */}

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card/70 md:hidden"
          onClick={() =>
            setOpen(
              (value) =>
                !value
            )
          }
          aria-label="Menu"
        >

          {open ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}

        </button>

      </nav>

      {/* MOBILE MENU */}

      {open && (

        <div className="border-t border-border bg-card/95 backdrop-blur-xl md:hidden">

          <div className="flex flex-col gap-1 px-4 py-3">

            {links.map((link) => (

              <Link
                key={link.to}
                to={link.to}
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent"
              >

                {link.label}

              </Link>

            ))}

            <div className="my-2 h-px bg-border" />

            {isAuthenticated ? (
              <>

                <Link
                  to={dashHref}
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                >

                  Dashboard

                </Link>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent"
                >

                  Logout

                </button>

              </>
            ) : (
              <>

                <Link
                  to="/login"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                >

                  Log in

                </Link>

                <Link
                  to="/register"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-accent"
                >

                  Get started

                </Link>

              </>
            )}

          </div>

        </div>

      )}

    </header>
  );
}