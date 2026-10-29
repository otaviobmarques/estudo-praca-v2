import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/auth";
import { buscarMunicipios } from "@/lib/municipios";
import { problema } from "@/lib/http";
export async function GET(req: Request) {
  if (!(await usuarioAtual())) return problema(401, "Não autenticado");
  return NextResponse.json({ itens: buscarMunicipios(new URL(req.url).searchParams.get("q") ?? "") });
}
