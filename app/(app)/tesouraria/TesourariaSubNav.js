"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/tesouraria/lancamentos", label: "Lançamentos" },
  { href: "/tesouraria/fluxo", label: "Fluxo de Caixa" },
  { href: "/tesouraria/relatorios", label: "Relatórios" },
  { href: "/tesouraria/gestao", label: "Relatórios de Gestão" },
];

export default function TesourariaSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-xs rounded-sm border"
            style={{
              background: active ? "#1E5631" : "#fff",
              color: active ? "#fff" : "#1E5631",
              borderColor: "#1E5631",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
