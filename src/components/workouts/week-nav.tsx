"use client";

import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WeekNav({
  date,
  basePath = "/workouts",
}: {
  date: string;
  basePath?: string;
}) {
  const router = useRouter();
  const go = (d: string) => router.push(`${basePath}?date=${d}`);
  const today = format(new Date(), "yyyy-MM-dd");

  const current = new Date(`${date}T12:00:00`);
  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
  const label = `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM", { locale: es })}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addWeeks(current, -1), "yyyy-MM-dd"))}
        aria-label="Semana anterior"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm capitalize">{label}</span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addWeeks(current, 1), "yyyy-MM-dd"))}
        aria-label="Semana siguiente"
      >
        <ChevronRight />
      </Button>
      {date !== today && (
        <Button variant="ghost" size="sm" onClick={() => go(today)}>
          Hoy
        </Button>
      )}
    </div>
  );
}
