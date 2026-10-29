import type { MetadataRoute } from "next";
/** Manifesto do PWA (pedido do Otávio, 29/10/2026). Ícone e cores neutros: o aplicativo atende as duas marcas.
 *  Servido por app/manifest.webmanifest/route.ts; o link no layout leva crossorigin="use-credentials" para a
 *  instalação funcionar também em endereço privado (Codespaces), que exige o cookie de login do GitHub. */
export default function manifesto(): MetadataRoute.Manifest {
  return {
    name: "Gerador de Estudo de Praça", short_name: "Estudo de Praça",
    description: "Potencial de vistorias por cidade para a expansão das redes Auto Visão e Royal Vistorias.",
    start_url: "/", scope: "/", display: "standalone", orientation: "any", lang: "pt-BR",
    background_color: "#F4F4F2", theme_color: "#2B2F36",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
