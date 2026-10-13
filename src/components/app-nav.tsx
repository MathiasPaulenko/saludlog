"use client";

import {
  Apple,
  CalendarDays,
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
import { useT } from "@/lib/use-locale";

const S = {
  es: {
    today: "Hoy",
    meals: "Comidas",
    diet: "Dieta",
    workouts: "Entrenos",
    habits: "Hábitos",
    weight: "Peso",
    week: "Semana",
    insights: "Insights",
    foods: "Alimentos",
    goals: "Metas",
  },
  en: {
    today: "Today",
    meals: "Meals",
    diet: "Diet",
    workouts: "Workouts",
    habits: "Habits",
    weight: "Weight",
    week: "Week",
    insights: "Insights",
    foods: "Foods",
    goals: "Goals",
  },
};

export function AppNav() {
  const pathname = usePathname();
  const s = useT(S);

  const sections = [
    { href: "/", label: s.today, icon: House },
    { href: "/meals", label: s.meals, icon: UtensilsCrossed },
    { href: "/plan", label: s.diet, icon: CalendarDays },
    { href: "/workouts", label: s.workouts, icon: Dumbbell },
    { href: "/habits", label: s.habits, icon: ListChecks },
    { href: "/metrics", label: s.weight, icon: Scale },
    { href: "/weekly", label: s.week, icon: CalendarRange },
    { href: "/insights", label: s.insights, icon: Lightbulb },
    { href: "/foods", label: s.foods, icon: Apple },
    { href: "/settings", label: s.goals, icon: Target },
  ];

  return (
    <nav className="flex flex-col gap-1 px-3">
      {sections.map(({ href, label, icon: Icon }) => {
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
