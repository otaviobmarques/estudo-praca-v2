import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import Estudo from "@/components/Estudo";
import "@/modelos/tela/tokens.css";
import "@/modelos/tela/tela.css";
// HTML estático e confiável do repositório (modelos/tela/painel.html), sem dado de usuário.
const PAINEL = fs.readFileSync(path.join(process.cwd(), "modelos", "tela", "painel.html"), "utf8");
export default async function Inicio() {
  const u = await usuarioAtual(); if (!u) redirect("/entrar");
  return <Estudo html={PAINEL} admin={u.papel === "administrador"} />;
}
