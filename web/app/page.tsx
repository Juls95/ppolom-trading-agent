import { Hero, Features, StackSection } from "@/components/sections/Hero";
import { AgentGrid } from "@/components/agents/AgentCard";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold text-maya-gold">El Consejo Maya</h2>
          <Link href="/council" className="text-sm text-maya-turquoise hover:underline">
            Ver foro →
          </Link>
        </div>
        <AgentGrid />
      </section>
      <Features />
      <StackSection />
    </>
  );
}
