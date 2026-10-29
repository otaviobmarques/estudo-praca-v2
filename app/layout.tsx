import "./fontes.css";
import type { Metadata, Viewport } from "next";
import RegistrarSW from "@/components/RegistrarSW";
export const metadata: Metadata = {
  title: "Gerador de Estudo de Praça",
  applicationName: "Estudo de Praça",
  appleWebApp: { capable: true, title: "Estudo de Praça", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icones/favicon-32.png", sizes: "32x32" }, { url: "/icones/icone-192.png", sizes: "192x192" }], apple: "/icones/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#2B2F36", width: "device-width", initialScale: 1 };
export default function Raiz({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-marca="auto-visao" data-modelo="full" suppressHydrationWarning><head><link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" /></head><body>{children}<RegistrarSW /></body></html>;
}
