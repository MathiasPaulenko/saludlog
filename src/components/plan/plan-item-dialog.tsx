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
import { BASE_UNIT_LABELS, MEAL_TYPE_LABELS, type MealType } from "@/lib/labels";
import type { Food } from "@/db/schema";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

  const selected = foods.find(
    (f) => f.name.toLowerCase() === foodName.trim().toLowerCase(),
  );

  function handleSubmit() {
    if (!selected || Number(amount) <= 0) {
      setError("Elegí un alimento del catálogo e indicá la cantidad.");
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
        aria-label={`Agregar en ${MEAL_TYPE_LABELS[mealType]}`}
      >
        <Plus />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {DAYS[dayOfWeek]} — {MEAL_TYPE_LABELS[mealType]}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-food">Alimento</Label>
              <Input
                id="plan-food"
                list="plan-food-catalog"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Ej: Pechuga de pollo"
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
                Cantidad{selected ? ` (${BASE_UNIT_LABELS[selected.baseUnit]})` : ""}
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
              {pending ? "Guardando…" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
