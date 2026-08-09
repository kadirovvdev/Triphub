import {
  Toaster,
} from "@/components/ui/toaster";

import {
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import {
  queryClientInstance,
} from "@/lib/query-client";

import {
  AuthProvider,
  useAuth,
} from "@/lib/AuthContext";


import PageNotFound from "./lib/PageNotFound";

import UserNotRegisteredError from "@/components/UserNotRegisteredError";

import ScrollToTop from "./components/ScrollToTop";

import ProtectedRoute from "@/components/ProtectedRoute";

import Layout from "@/components/Layout";


import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";

import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Landing from "@/pages/Landing";
import Tours from "@/pages/Tours";
import TourDetail from "@/pages/TourDetail";

import Organizers from "@/pages/Organizers";
import OrganizerProfilePage from "@/pages/OrganizerProfilePage";

import About from "@/pages/About";

import TravelerDashboard from "@/pages/TravelerDashboard";

import OrganizerDashboard from "@/pages/OrganizerDashboard";
import OrganizerOnboarding from "@/pages/OrganizerOnboarding";

import TourForm from "@/pages/TourForm";

import AdminDashboard from "@/pages/AdminDashboard";


const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();


  // ============================================================
  // LOADING
  // ============================================================

  if (
    isLoadingPublicSettings ||
    isLoadingAuth
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }


  // ============================================================
  // AUTH ERRORS
  // ============================================================

  if (authError) {
    if (
      authError.type ===
      "user_not_registered"
    ) {
      return (
        <UserNotRegisteredError />
      );
    }


    if (
      authError.type ===
      "auth_required"
    ) {
      navigateToLogin();

      return null;
    }
  }


  // ============================================================
  // ROUTES
  // ============================================================

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ======================================================
            AUTH PAGES
        ====================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />

        <Route
          path="/verify-email"
          element={
            <VerifyEmail />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />


        {/* ======================================================
            PUBLIC APP
        ====================================================== */}

        <Route
          element={
            <Layout />
          }
        >
          <Route
            path="/"
            element={
              <Landing />
            }
          />

          <Route
            path="/tours"
            element={
              <Tours />
            }
          />

          <Route
            path="/tours/:id"
            element={
              <TourDetail />
            }
          />

          <Route
            path="/organizers"
            element={
              <Organizers />
            }
          />

          <Route
            path="/organizers/:id"
            element={
              <OrganizerProfilePage />
            }
          />

          <Route
            path="/about"
            element={
              <About />
            }
          />


          {/* ====================================================
              AUTHENTICATED ROUTES
          ==================================================== */}

          <Route
            element={
              <ProtectedRoute
                unauthenticatedElement={
                  <Navigate
                    to="/login"
                    replace
                  />
                }
              />
            }
          >
            <Route
              path="/organizer/onboarding"
              element={
                <OrganizerOnboarding />
              }
            />

            <Route
              path="/dashboard"
              element={
                <TravelerDashboard />
              }
            />

            <Route
              path="/organizer"
              element={
                <OrganizerDashboard />
              }
            />

            <Route
              path="/organizer/tours/new"
              element={
                <TourForm />
              }
            />

            <Route
              path="/organizer/tours/:id/edit"
              element={
                <TourForm />
              }
            />

            <Route
              path="/admin"
              element={
                <AdminDashboard />
              }
            />
          </Route>
        </Route>


        {/* ======================================================
            404
        ====================================================== */}

        <Route
          path="*"
          element={
            <PageNotFound />
          }
        />
      </Routes>
    </>
  );
};


function App() {
  return (
    <QueryClientProvider
      client={
        queryClientInstance
      }
    >
      <Router>
        <AuthProvider>
          <AuthenticatedApp />

          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}


export default App;