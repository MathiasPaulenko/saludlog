"use client";

import {
  Apple,
  CalendarRange,
  Dumbbell,
  House,
  Lightbulb,
  ListChecks,
  Scale,
  Target,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/", label: "Hoy", icon: House },
  { href: "/meals", label: "Comidas", icon: UtensilsCrossed },
  { href: "/workouts", label: "Entrenos", icon: Dumbbell },
  { href: "/habits", label: "Hábitos", icon: ListChecks },
  { href: "/metrics", label: "Peso", icon: Scale },
  { href: "/weekly", label: "Semana", icon: CalendarRange },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/foods", label: "Alimentos", icon: Apple },
  { href: "/settings", label: "Metas", icon: Target },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-primary/10 font-medium text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
