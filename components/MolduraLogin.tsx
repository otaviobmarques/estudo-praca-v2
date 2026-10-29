import "@/app/login.css";
export default function MolduraLogin({ children }: { children: React.ReactNode }) {
  return <main className="tela" data-proposta="neutra"><section className="lado"><div className="logos">
    <img src="/auto-visao_logo-oficial_branco-integral.svg" alt="Auto Visão" /><span className="div" /><img src="/royal-logo-horizontal-fundo-escuro.svg" alt="Royal Vistorias" /></div>
    <h1>Gerador de<b>Estudo de Praça</b></h1><p>Potencial de vistorias por cidade para a expansão das redes Auto Visão e Royal Vistorias.</p>
    <div className="rodape">Acesso restrito às equipes de expansão.</div></section>
    <section className="form-lado">{children}</section></main>;
}
