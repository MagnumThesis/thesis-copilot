import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import PublicLanding from "./pages/PublicLanding.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
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
      </Routes> 
    </BrowserRouter> 
  </StrictMode>
);
