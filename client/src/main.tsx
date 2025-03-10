declare global {
  interface Window {
    dataLayer: any[];
  }
}

if (typeof window !== "undefined" && !window.gtag) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
