import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RoleOnboarding from "@/components/RoleOnboarding";

// App shell: glass navbar + page content + footer. Shows role onboarding
// overlay for logged-in users who haven't picked a role yet.
export default function Layout() {
  const { user } = useAuth();
  const needsOnboarding = user && !user.role;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {needsOnboarding && <RoleOnboarding />}
    </div>
  );
}