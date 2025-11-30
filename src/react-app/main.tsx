import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Skeleton from "@/components/ui/shadcn/skeleton";
import {
  MainSkeleton,
  AuthSkeleton,
  LandingPageSkeleton,
  LoginPageSkeleton,
  ProfilePageSkeleton,
  GridSkeleton,
  FormSkeleton,
} from "@/components/ui/shadcn/skeletons";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute.tsx";

const Landing = lazy(() => import("./pages/Landing"));
const PublicLanding = lazy(() => import("./pages/PublicLanding"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const BillingSuccess = lazy(() => import("./pages/BillingSuccess"));
const BillingPlan = lazy(() => import("./pages/BillingPlan"));
const BillingTopUp = lazy(() => import("./pages/BillingTopUp"));
const BillingMethods = lazy(() => import("./pages/BillingMethods"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LandingPageSkeleton />}>
              <PublicRoute skeleton={<LandingPageSkeleton />}>
                <PublicLanding />
              </PublicRoute>
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoginPageSkeleton />}>
              <PublicRoute skeleton={<LoginPageSkeleton />}>
                <Login />
              </PublicRoute>
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<LoginPageSkeleton />}>
              <PublicRoute skeleton={<LoginPageSkeleton />}>
                <Register />
              </PublicRoute>
            </Suspense>
          }
        />
        <Route
          path="/app/:ideaId?"
          element={
            <Suspense fallback={<MainSkeleton />}>
              <ProtectedRoute skeleton={<MainSkeleton />}>
                <Landing />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<ProfilePageSkeleton />}>
              <ProtectedRoute skeleton={<ProfilePageSkeleton />}>
                <Profile />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<FormSkeleton />}>
              <ProtectedRoute skeleton={<FormSkeleton />}>
                <Settings />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/billing/success"
          element={
            <Suspense fallback={<FormSkeleton />}>
              <ProtectedRoute skeleton={<FormSkeleton />}>
                <BillingSuccess />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/billing/plan"
          element={
            <Suspense fallback={<GridSkeleton />}>
              <ProtectedRoute skeleton={<GridSkeleton />}>
                <BillingPlan />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/billing/topup"
          element={
            <Suspense fallback={<FormSkeleton />}>
              <ProtectedRoute skeleton={<FormSkeleton />}>
                <BillingTopUp />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/billing/methods"
          element={
            <Suspense fallback={<FormSkeleton />}>
              <ProtectedRoute skeleton={<FormSkeleton />}>
                <BillingMethods />
              </ProtectedRoute>
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
