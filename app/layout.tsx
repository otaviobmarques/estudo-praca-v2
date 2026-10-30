import "./fontes.css";
import type { Metadata, Viewport } from "next";
import RegistrarSW from "@/components/RegistrarSW";
const DESCRICAO = "Potencial de vistorias por cidade para a expansão das redes Auto Visão e Royal Vistorias.";
export const metadata: Metadata = {
  title: "Gerador de Estudo de Praça",
  applicationName: "Estudo de Praça",
  appleWebApp: { capable: true, title: "Estudo de Praça", statusBarStyle: "default" },
  description: DESCRICAO,
  // endereço público do sistema (APP_URL no .env): as redes sociais exigem o endereço completo da imagem
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" }, { url: "/icones/icone.svg", type: "image/svg+xml" }, { url: "/icones/icone-192.png", sizes: "192x192" }],
    apple: "/icones/apple-touch-icon.png",
  },
  // banner de compartilhamento (WhatsApp, LinkedIn, Facebook, X); gerado por scripts/gerar_banner.mjs
  openGraph: { type: "website", locale: "pt_BR", siteName: "Gerador de Estudo de Praça", title: "Gerador de Estudo de Praça", description: DESCRICAO,
    images: [{ url: "/og/banner.png", width: 1200, height: 630, alt: "Gerador de Estudo de Praça — Auto Visão e Royal Vistorias" }] },
  twitter: { card: "summary_large_image", title: "Gerador de Estudo de Praça", description: DESCRICAO, images: ["/og/banner.png"] },
};
export const viewport: Viewport = { themeColor: "#2B2F36", width: "device-width", initialScale: 1 };
export default function Raiz({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-marca="auto-visao" data-modelo="full" suppressHydrationWarning><head><link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" /></head><body>{children}<RegistrarSW /></body></html>;
}
