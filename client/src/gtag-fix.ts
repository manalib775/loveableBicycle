// src/gtag-fix.ts or wherever appropriate
interface GtagWindow extends Window {
  gtag: (...args: any[]) => void;
  dataLayer: any[];
}

// Add this to a file that runs early in your application bootstrap
export function setupGtagFallback() {
  if (typeof window !== "undefined") {
    const w = window as GtagWindow;
    if (!w.gtag) {
      w.dataLayer = w.dataLayer || [];
      w.gtag = function (...args) {
        w.dataLayer.push(arguments);
        console.log("Analytics call (mock):", args);
      };
    }
  }
}
