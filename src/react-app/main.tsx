import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { default as Starter } from "./App.tsx";
import Landing from "./pages/Landing.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const appToRender: string = import.meta.env.VITE_MAIN_PAGE || "STARTER";

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

function Pager() {
  switch (appToRender) {
    case "LANDING":
      return <Router />;
    default:
      return <Starter />;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Pager />
  </StrictMode>
);
