/* Service worker do Gerador de Estudo de Praça (PWA).
   Guarda só arquivos fixos (fontes, ícones, logos, JS/CSS do build) e a página offline.
   Nunca guarda a API (/api/) nem as páginas: nenhum estudo, dado de usuário ou sessão fica no aparelho. */
const VERSAO = "estudo-praca-v1";
const FIXOS = ["/offline.html", "/fontes/Inter.woff2", "/fontes/Nunito.woff2", "/fontes/Raleway.woff2", "/icones/icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(FIXOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return; // API: sempre direto na rede
  if (req.mode === "navigate") { // páginas: sempre da rede; sem conexão, a página offline
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }
  if (/^\/(_next\/static|fontes|icones)\/|\.svg$/.test(url.pathname)) { // arquivos fixos: cache primeiro
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
      return res;
    })));
  }
});
