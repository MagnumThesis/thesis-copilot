import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { default as Starter } from "./App.tsx";
import Landing from "./pages/Landing.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";


function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:ideaId" element={<Landing />} />
      </Routes> 
    </BrowserRouter> 
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />;
  </StrictMode>
);
