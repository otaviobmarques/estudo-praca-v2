import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import Admin from "@/components/Admin";
export default async function Pagina() {
  const u = await usuarioAtual(); if (!u) redirect("/entrar"); if (u.papel !== "administrador") redirect("/");
  return <Admin />;
}
