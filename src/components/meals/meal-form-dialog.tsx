"use client";

import { Plus, X } from "lucide-react";
import {
  useId,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { logMeal, updateMeal } from "@/actions/meals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Food } from "@/db/schema";
import {
  BASE_UNIT_LABELS,
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  type MealType,
} from "@/lib/labels";
import {
  computeItemMacros,
  computeMealMacros,
  roundMacros,
} from "@/lib/macros";
import type { MealWithItems } from "@/lib/queries/meals";

interface ItemRow {
  key: number;
  foodName: string;
  amount: string;
}

interface MealFormDialogProps {
  foods: Food[];
  defaultDate: string;
  meal?: MealWithItems;
  label: ReactNode;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
}

function guessMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 20) return "snack";
  return "dinner";
}

export function MealFormDialog({
  foods,
  defaultDate,
  meal,
  label,
  icon,
  variant = "default",
  size = "default",
  buttonClassName,
}: MealFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={buttonClassName}
        onClick={() => setOpen(true)}
      >
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {meal ? "Editar comida" : "Registrar comida"}
            </DialogTitle>
          </DialogHeader>
          {open && (
            <MealForm
              key={meal?.id ?? "new"}
              foods={foods}
              defaultDate={defaultDate}
              meal={meal}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MealForm({
  foods,
  defaultDate,
  meal,
  onDone,
}: Pick<MealFormDialogProps, "foods" | "defaultDate" | "meal"> & {
  onDone: () => void;
}) {
  const listId = useId();
  const [date, setDate] = useState(meal?.date ?? defaultDate);
  const [type, setType] = useState<MealType>(meal?.type ?? guessMealType());
  const [notes, setNotes] = useState(meal?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(() =>
    meal && meal.items.length > 0
      ? meal.items.map((i) => ({
          key: i.item.id,
          foodName: i.food.name,
          amount: String(i.item.amount),
        }))
      : [{ key: 0, foodName: "", amount: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const foodByName = new Map(foods.map((f) => [f.name.toLowerCase(), f]));

  const resolved = items
    .map((row) => {
      const food = foodByName.get(row.foodName.trim().toLowerCase());
      const amount = Number(row.amount);
      return food && amount > 0 ? { food, amount } : null;
    })
    .filter((i) => i !== null);

  const totals = roundMacros(computeMealMacros(resolved));
  const canSubmit = resolved.length > 0 && !pending;

  function updateItem(key: number, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        key: Math.max(0, ...prev.map((r) => r.key)) + 1,
        foodName: "",
        amount: "",
      },
    ]);
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((r) => r.key !== key));
  }

  function handleSubmit() {
    if (resolved.length === 0) {
      setError("Agregá al menos un alimento con cantidad.");
      return;
    }
    const payload = {
      date,
      type,
      notes: notes || undefined,
      items: resolved.map((i) => ({ foodId: i.food.id, amount: i.amount })),
    };
    startTransition(async () => {
      const res = meal
        ? await updateMeal(meal.id, payload)
        : await logMeal(payload);
      if (res.ok) {
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-date">Fecha</Label>
          <Input
            id="meal-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-type">Tipo</Label>
          <select
            id="meal-type"
            value={type}
            onChange={(e) => setType(e.target.value as MealType)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <Label htmlFor="meal-notes">Notas</Label>
          <Input
            id="meal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_6rem_9rem_2rem] items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Alimento</span>
          <span>Cantidad</span>
          <span className="text-right">Macros</span>
          <span />
        </div>
        {items.map((row) => {
          const food = foodByName.get(row.foodName.trim().toLowerCase());
          const amount = Number(row.amount);
          const macros =
            food && amount > 0
              ? roundMacros(computeItemMacros(food, amount))
              : null;
          return (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_6rem_9rem_2rem] items-center gap-2"
            >
              <Input
                list={listId}
                value={row.foodName}
                onChange={(e) =>
                  updateItem(row.key, { foodName: e.target.value })
                }
                placeholder="Buscar alimento…"
              />
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={row.amount}
                  onChange={(e) =>
                    updateItem(row.key, { amount: e.target.value })
                  }
                  className="pr-7"
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                  {food ? BASE_UNIT_LABELS[food.baseUnit] : "–"}
                </span>
              </div>
              <span className="text-right text-xs text-muted-foreground">
                {macros
                  ? `${macros.kcal} kcal · P${macros.protein} C${macros.carbs} G${macros.fat}`
                  : "—"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(row.key)}
                disabled={items.length === 1}
                aria-label="Quitar alimento"
              >
                <X />
              </Button>
            </div>
          );
        })}
        <datalist id={listId}>
          {foods.map((f) => (
            <option key={f.id} value={f.name} />
          ))}
        </datalist>
        <Button variant="outline" size="sm" onClick={addItem} className="w-fit">
          <Plus />
          Agregar alimento
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="font-medium">Total</span>
        <span className="text-muted-foreground">
          {totals.kcal} kcal · P {totals.protein} g · C {totals.carbs} g · G{" "}
          {totals.fat} g
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {pending ? "Guardando…" : meal ? "Guardar cambios" : "Registrar"}
        </Button>
      </DialogFooter>
    </div>
  );
}
