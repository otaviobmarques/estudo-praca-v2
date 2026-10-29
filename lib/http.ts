import { NextResponse } from "next/server";
import { headers } from "next/headers";
/** Formato único de erro (Problem Details, RFC 9457). */
export const problema = (status: number, title: string, detail?: string) =>
  NextResponse.json({ type: "about:blank", title, status, detail }, { status, headers: { "content-type": "application/problem+json" } });
export async function ipCliente() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}
