import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import PublicLanding from "./pages/PublicLanding.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import BillingSuccess from "./pages/BillingSuccess.tsx";
import BillingPlan from "./pages/BillingPlan.tsx";
import BillingTopUp from "./pages/BillingTopUp.tsx";
import BillingMethods from "./pages/BillingMethods.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><PublicLanding /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/app/:ideaId?" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />
        <Route path="/billing/plan" element={<ProtectedRoute><BillingPlan /></ProtectedRoute>} />
        <Route path="/billing/topup" element={<ProtectedRoute><BillingTopUp /></ProtectedRoute>} />
        <Route path="/billing/methods" element={<ProtectedRoute><BillingMethods /></ProtectedRoute>} />
      </Routes> 
    </BrowserRouter> 
  </StrictMode>
);
