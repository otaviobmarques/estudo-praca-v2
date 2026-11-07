import puppeteer, { type Browser } from "puppeteer-core";
/** Na Vercel (sem Chrome instalado) usa o Chromium do @sparticuz/chromium; fora dela, CHROME_PATH ou o Chrome do sistema. */
async function abrir(): Promise<Browser> {
  if (process.env.VERCEL && !process.env.CHROME_PATH) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, "--disable-gpu"], headless: true });
  }
  return puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu"], headless: true });
}
async function comPagina<T>(html: string, f: (p: import("puppeteer-core").Page) => Promise<T>) {
  const b = await abrir();
  try {
    const p = await b.newPage();
    await p.setJavaScriptEnabled(false); // HTML só de leitura
    await p.setContent(html, { waitUntil: "load" });
    await p.evaluateHandle("document.fonts.ready").catch(() => null);
    return await f(p);
  } finally { await b.close(); }
}
export const htmlParaPdf = (html: string) => comPagina(html, (p) => p.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true }));
/** PNG = imagem da primeira página (escopo M7, proposta). */
export const htmlParaPng = (html: string) => comPagina(html, async (p) => {
  await p.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const el = await p.$("section.pag"); return (await el!.screenshot({ type: "png" })) as Uint8Array;
});
