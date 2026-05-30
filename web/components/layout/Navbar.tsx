import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/council", label: "Consejo" },
  { href: "/demo", label: "Demo" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/methodology", label: "Metodología" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-maya-gold/20 bg-maya-obsidian/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl font-bold text-maya-gold">
          ☸ Ppolom
        </Link>
        <ul className="flex gap-6 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-maya-parchment/80 transition hover:text-maya-gold">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
