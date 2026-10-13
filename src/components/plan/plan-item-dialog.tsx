"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { addPlanItem } from "@/actions/plan";
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
import {
  BASE_UNIT_LABELS,
  MEAL_TYPE_LABELS,
  WEEKDAY_LABELS,
  type MealType,
} from "@/lib/labels";
import type { Food } from "@/db/schema";
import { useLocale, useT } from "@/lib/use-locale";

const S = {
  es: {
    addIn: (meal: string) => `Agregar en ${meal}`,
    food: "Alimento",
    foodPlaceholder: "Ej: Pechuga de pollo",
    amount: "Cantidad",
    saving: "Guardando…",
    add: "Agregar",
    errorSelect: "Elegí un alimento del catálogo e indicá la cantidad.",
  },
  en: {
    addIn: (meal: string) => `Add to ${meal}`,
    food: "Food",
    foodPlaceholder: "E.g.: Chicken breast",
    amount: "Amount",
    saving: "Saving…",
    add: "Add",
    errorSelect: "Pick a food from the catalog and enter the amount.",
  },
};

export function PlanItemDialog({
  dayOfWeek,
  mealType,
  foods,
}: {
  dayOfWeek: number;
  mealType: MealType;
  foods: Food[];
}) {
  const [open, setOpen] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const s = useT(S);
  const locale = useLocale();

  const selected = foods.find(
    (f) => f.name.toLowerCase() === foodName.trim().toLowerCase(),
  );

  function handleSubmit() {
    if (!selected || Number(amount) <= 0) {
      setError(s.errorSelect);
      return;
    }
    startTransition(async () => {
      const res = await addPlanItem({
        dayOfWeek,
        mealType,
        foodId: selected.id,
        amount: Number(amount),
      });
      if (res.ok) {
        setOpen(false);
        setFoodName("");
        setAmount("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={s.addIn(MEAL_TYPE_LABELS[locale][mealType])}
      >
        <Plus />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {WEEKDAY_LABELS[locale][dayOfWeek]} — {MEAL_TYPE_LABELS[locale][mealType]}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-food">{s.food}</Label>
              <Input
                id="plan-food"
                list="plan-food-catalog"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder={s.foodPlaceholder}
              />
              <datalist id="plan-food-catalog">
                {foods.map((f) => (
                  <option
                    key={f.id}
                    value={f.name}
                    label={`${f.kcal} kcal/${f.baseAmount}${BASE_UNIT_LABELS[f.baseUnit]}`}
                  />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-amount">
                {s.amount}
                {selected ? ` (${BASE_UNIT_LABELS[selected.baseUnit]})` : ""}
              </Label>
              <Input
                id="plan-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selected ? String(selected.baseAmount) : ""}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? s.saving : s.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
