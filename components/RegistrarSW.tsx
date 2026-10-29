"use client";
import { useEffect } from "react";
/** Registra o service worker do PWA (public/sw.js). Só em produção, para não atrapalhar o npm run dev. */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
