import { createRoot } from "react-dom/client";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.ts')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AnimatePresence mode="wait">
    <App />
    </AnimatePresence>
  </BrowserRouter>
);
