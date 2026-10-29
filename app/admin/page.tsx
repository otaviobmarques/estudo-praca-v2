import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import Admin from "@/components/Admin";
import "@/modelos/tela/tokens.css";
import "@/modelos/tela/tela.css";
export default async function Pagina() {
  const u = await usuarioAtual(); if (!u) redirect("/entrar"); if (u.papel !== "administrador") redirect("/");
  return <Admin />;
}
