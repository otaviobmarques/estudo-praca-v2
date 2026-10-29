import manifesto from "@/lib/manifesto";
export const dynamic = "force-static";
export function GET() {
  return new Response(JSON.stringify(manifesto()), { headers: { "content-type": "application/manifest+json; charset=utf-8" } });
}
