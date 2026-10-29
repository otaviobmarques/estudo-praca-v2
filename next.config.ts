import type { NextConfig } from "next";
const seguranca = [
  { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src 'self' blob: data:; frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];
const config: NextConfig = { output: "standalone", serverExternalPackages: ["@node-rs/argon2", "puppeteer-core"], async headers() { return [{ source: "/:path*", headers: seguranca }, { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] }]; } };
export default config;
