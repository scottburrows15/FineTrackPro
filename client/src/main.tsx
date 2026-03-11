import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

localStorage.removeItem("teamfines-theme");
document.documentElement.classList.remove("dark");

// Detect PWA standalone mode and add class to body
const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
  || (window.navigator as any).standalone 
  || document.referrer.includes('android-app://');

if (isStandalone) {
  document.body.classList.add('pwa-standalone');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);
