import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {default as Starter} from "./App.tsx";
import Landing from "./Landing.tsx";

const appToRender : string = import.meta.env.VITE_MAIN_PAGE || "STARTER";


export default function Pager() {
  switch (appToRender) {
    case "LANDING":
      return <Landing />;
    default:
      return <Starter />;
  }
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Pager />
  </StrictMode>,
);
