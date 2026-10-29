"use client";
import { useEffect } from "react";
import { iniciarPainel } from "./tela/painel";
/** Tela aprovada (HTML e CSS da Julia, modelos/tela) com o comportamento em components/tela/painel.ts. */
export default function Estudo({ html, admin }: { html: string; admin: boolean }) {
  useEffect(() => { iniciarPainel({ admin }); }, [admin]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
