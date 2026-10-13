"use client";

import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { dateFnsLocale } from "@/lib/i18n-shared";
import { useLocale, useT } from "@/lib/use-locale";

const S = {
  es: { prev: "Semana anterior", next: "Semana siguiente", today: "Hoy" },
  en: { prev: "Previous week", next: "Next week", today: "Today" },
};

export function WeekNav({
  date,
  basePath = "/workouts",
}: {
  date: string;
  basePath?: string;
}) {
  const router = useRouter();
  const s = useT(S);
  const loc = dateFnsLocale(useLocale());
  const go = (d: string) => router.push(`${basePath}?date=${d}`);
  const today = format(new Date(), "yyyy-MM-dd");

  const current = new Date(`${date}T12:00:00`);
  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
  const label = `${format(weekStart, "d MMM", { locale: loc })} – ${format(weekEnd, "d MMM", { locale: loc })}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addWeeks(current, -1), "yyyy-MM-dd"))}
        aria-label={s.prev}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm capitalize">{label}</span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addWeeks(current, 1), "yyyy-MM-dd"))}
        aria-label={s.next}
      >
        <ChevronRight />
      </Button>
      {date !== today && (
        <Button variant="ghost" size="sm" onClick={() => go(today)}>
          {s.today}
        </Button>
      )}
    </div>
  );
}
