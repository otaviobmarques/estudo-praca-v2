// Gera public/og/banner.png (1200 × 630, menos de 100 KB) a partir de scripts/banner/banner.html.
// Requer Playwright com Chromium e Python com Pillow (para reduzir as cores e o tamanho do PNG).
// Uso: node scripts/gerar_banner.mjs
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright"); // aceita Playwright global (NODE_PATH)
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
fs.mkdirSync(path.join(raiz, "public/og"), { recursive: true });
const bruto = path.join(raiz, "public/og/banner-bruto.png"), saida = path.join(raiz, "public/og/banner.png");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + path.join(raiz, "scripts/banner/banner.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
await p.screenshot({ path: bruto }); await b.close();
// paleta de 128 cores: o banner é chapado (grafite, branco e os logos), então não perde qualidade visível
execFileSync(process.env.PYTHON ?? "python3", ["-c", `from PIL import Image
im=Image.open(${JSON.stringify(bruto)}).convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
im.save(${JSON.stringify(saida)}, optimize=True)`]);
fs.rmSync(bruto);
const kb = fs.statSync(saida).size / 1024; console.log(`public/og/banner.png: ${kb.toFixed(1)} KB`);
if (kb >= 100) { console.error("O banner passou de 100 KB"); process.exit(1); }
