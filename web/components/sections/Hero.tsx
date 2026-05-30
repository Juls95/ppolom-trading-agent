import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-maya-gold/80">El Ágora Maya</p>
      <h1 className="font-display mb-6 text-5xl font-bold leading-tight md:text-6xl">
        Seis dioses debaten cada{" "}
        <span className="gradient-text">operación de arbitraje</span> antes de ejecutar
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-lg text-maya-parchment/70">
        Ppolom conecta order books reales de Binance, OKX y Kraken vía CCXT. Cada agente vota.
        Solo cuando los seis dan luz verde se simula la operación. Las negativas quedan registradas.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/demo"
          className="rounded-lg bg-maya-gold px-8 py-3 font-semibold text-maya-obsidian transition hover:bg-maya-gold/90"
        >
          Ver demo
        </Link>
        <Link
          href="/dashboard"
          className="glass rounded-lg px-8 py-3 font-semibold text-maya-gold transition hover:border-maya-gold/50"
        >
          Dashboard en vivo
        </Link>
      </div>
    </section>
  );
}

export function Features() {
  const items = [
    {
      title: "Datos reales, cero mocks en live",
      body: "Order books vía CCXT desde 3 exchanges. Errores de conexión visibles con diagnóstico.",
    },
    {
      title: "Consejo de 6 agentes",
      body: "Hunab Ku → Itzamná → Chaac → Ixchel → Kukulkán → Kinich Ahau. Voto unánime requerido.",
    },
    {
      title: "Demo separado en Supabase",
      body: "Escenarios simulados en demo_sessions, claramente etiquetados. Nunca mezclados con live_*.",
    },
    {
      title: "Restraint-first",
      body: "La mayoría de divergencias se rechazan por fees. Eso es correcto — no forzamos EXECUTE.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="font-display mb-10 text-center text-3xl font-bold text-maya-gold">Distintivo</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((f) => (
          <div key={f.title} className="glass rounded-xl p-6">
            <h3 className="mb-2 font-display text-lg font-bold text-maya-turquoise">{f.title}</h3>
            <p className="text-sm text-maya-parchment/70">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StackSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h2 className="font-display mb-6 text-2xl font-bold">Stack</h2>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        {["Python 3.12", "FastAPI", "CCXT", "Next.js 14", "Supabase", "Fly.io", "Tailwind"].map(
          (t) => (
            <span key={t} className="glass rounded-full px-4 py-1 text-maya-parchment/80">
              {t}
            </span>
          )
        )}
      </div>
    </section>
  );
}
