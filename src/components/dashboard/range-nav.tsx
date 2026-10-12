"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const RANGES = [7, 14, 30] as const;

export function RangeNav({ range }: { range: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(r: number) {
    const next = new URLSearchParams(params.toString());
    next.set("range", String(r));
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <Button
          key={r}
          variant={range === r ? "default" : "outline"}
          size="sm"
          onClick={() => go(r)}
          className={cn(range === r && "pointer-events-none")}
        >
          {r}d
        </Button>
      ))}
    </div>
  );
}
