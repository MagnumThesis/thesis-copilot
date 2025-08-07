import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";


function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:ideaId?" element={<Landing />} />
      </Routes> 
    </BrowserRouter> 
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />;
  </StrictMode>
);
