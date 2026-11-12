import { ArrowUpRight, Check } from "lucide-react";

import type { AppModule } from "@/lib/constants/roles";

const MODULES: Array<{ key: AppModule; label: string; href: string }> = [
  { key: "pos", label: "POS", href: "/dashboard" },
  { key: "rooms", label: "Rooms", href: "/hotel" },
  { key: "banquet", label: "Banquet", href: "/banquet" }
];

/**
 * Cross-module switcher shown on the POS dashboard. Rooms and Banquet open in a
 * new tab (they are separate workspaces with their own dashboards).
 */
export function ModuleLauncher({ modules }: { modules: AppModule[] }) {
  if (modules.length < 2) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {MODULES.filter((module) => modules.includes(module.key)).map((module) =>
        module.key === "pos" ? (
          <div key={module.key} className="surface-card flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-text-primary">{module.label}</span>
            <Check className="size-4 text-accent-primary" aria-hidden />
          </div>
        ) : (
          <a
            key={module.key}
            href={module.href}
            target="_blank"
            rel="noopener noreferrer"
            className="surface-card group flex items-center justify-between p-4 transition hover:border-border-strong hover:bg-white"
          >
            <span className="text-sm font-semibold text-text-primary">{module.label}</span>
            <ArrowUpRight
              className="size-4 text-text-muted transition group-hover:text-text-primary"
              aria-hidden
            />
          </a>
        )
      )}
    </section>
  );
}
