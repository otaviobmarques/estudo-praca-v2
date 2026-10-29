import { prepararHtml } from "../route";
export const runtime = "nodejs";
/** Prévia ao vivo: o mesmo HTML do PDF, sem gerar arquivo (exibido num iframe sem scripts). */
export async function POST(req: Request) {
  const r = await prepararHtml(req, true); if (r.erro) return r.erro;
  return new Response(r.html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
