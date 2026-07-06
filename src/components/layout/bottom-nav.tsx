"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hauptnavigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background md:hidden">
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  isActive ? "text-accent-rust" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
