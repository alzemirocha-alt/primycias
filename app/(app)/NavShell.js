"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavShell({ items }) {
  const pathname = usePathname();
  return (
    <nav className="flex md:flex-col gap-1 flex-wrap">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 text-sm rounded-sm"
            style={{
              background: active ? "rgba(255,255,255,0.1)" : "transparent",
              color: active ? "#9FE0B4" : "#DCE6DF",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
