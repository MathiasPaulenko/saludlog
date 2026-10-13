"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { logHabitValue } from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Habit } from "@/db/schema";
import { HABIT_UNIT_SUFFIX } from "@/lib/labels";
import { useT } from "@/lib/use-locale";
import { cn } from "cn";

const S = {
  es: { done: "hecho", pendingLabel: "pendiente", goal: "Meta" },
  en: { done: "done", pendingLabel: "pending", goal: "Goal" },
};

interface HabitRowProps {
  habit: Habit;
  date: string;
  initialValue: number;
}

export function HabitRow({ habit, date, initialValue }: HabitRowProps) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(
    initialValue > 0 ? String(initialValue) : "",
  );
  const [pending, startTransition] = useTransition();
  const s = useT(S);

  const done =
    habit.unit === "check"
      ? value >= 1
      : habit.targetDaily != null
        ? value >= habit.targetDaily
        : value > 0;

  function commit(next: number) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await logHabitValue({
        habitId: habit.id,
        date,
        value: next,
      });
      if (!res.ok) setValue(prev);
    });
  }

  function commitDraft() {
    const next = Number(draft);
    if (draft !== "" && next >= 0 && next !== value) commit(next);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border p-3",
        done && "border-primary/40 bg-primary/5",
      )}
    >
      {habit.unit === "check" ? (
        <Button
          variant={done ? "default" : "outline"}
          size="icon-sm"
          onClick={() => commit(done ? 0 : 1)}
          disabled={pending}
          aria-label={`${habit.name}: ${done ? s.done : s.pendingLabel}`}
        >
          <Check />
        </Button>
      ) : (
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            min="0"
            step="any"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === "Enter" && commitDraft()}
            disabled={pending}
            className={HABIT_UNIT_SUFFIX[habit.unit] ? "pr-8" : undefined}
          />
          {HABIT_UNIT_SUFFIX[habit.unit] && (
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
              {HABIT_UNIT_SUFFIX[habit.unit]}
            </span>
          )}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{habit.name}</p>
        {habit.targetDaily != null && (
          <p className="text-xs text-muted-foreground">
            {s.goal}: {habit.targetDaily}
            {HABIT_UNIT_SUFFIX[habit.unit] &&
              ` ${HABIT_UNIT_SUFFIX[habit.unit]}`}
          </p>
        )}
      </div>
    </div>
  );
}
