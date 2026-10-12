"use client";

import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DateNav({
  date,
  basePath = "/meals",
}: {
  date: string;
  basePath?: string;
}) {
  const router = useRouter();
  const go = (d: string) => router.push(`${basePath}?date=${d}`);
  const today = format(new Date(), "yyyy-MM-dd");
  const current = new Date(`${date}T12:00:00`);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addDays(current, -1), "yyyy-MM-dd"))}
        aria-label="Día anterior"
      >
        <ChevronLeft />
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="w-36"
      />
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => go(format(addDays(current, 1), "yyyy-MM-dd"))}
        aria-label="Día siguiente"
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
