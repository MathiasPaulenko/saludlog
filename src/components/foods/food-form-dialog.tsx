"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createFood, updateFood } from "@/actions/foods";
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

interface FoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food?: Food;
}

export function FoodFormDialog({ open, onOpenChange, food }: FoodFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: fd.get("name"),
      kcal: fd.get("kcal"),
      protein: fd.get("protein"),
      carbs: fd.get("carbs"),
      fat: fd.get("fat"),
      baseAmount: fd.get("baseAmount"),
      baseUnit: fd.get("baseUnit"),
    };
    startTransition(async () => {
      const res = food
        ? await updateFood(food.id, input)
        : await createFood(input);
      if (res.ok) {
        setError(null);
        onOpenChange(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{food ? "Editar alimento" : "Nuevo alimento"}</DialogTitle>
        </DialogHeader>
        <form
          key={food?.id ?? "new"}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="food-name">Nombre</Label>
            <Input
              id="food-name"
              name="name"
              required
              defaultValue={food?.name}
              placeholder="Ej: Pechuga de pollo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-baseAmount">Cantidad base</Label>
              <Input
                id="food-baseAmount"
                name="baseAmount"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={food?.baseAmount ?? 100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-baseUnit">Unidad</Label>
              <select
                id="food-baseUnit"
                name="baseUnit"
                defaultValue={food?.baseUnit ?? "g"}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="g">gramos (g)</option>
                <option value="ml">mililitros (ml)</option>
                <option value="unit">unidad (u)</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Macros por la cantidad base indicada.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-kcal">Calorías (kcal)</Label>
              <Input
                id="food-kcal"
                name="kcal"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={food?.kcal}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-protein">Proteína (g)</Label>
              <Input
                id="food-protein"
                name="protein"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={food?.protein}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-carbs">Carbohidratos (g)</Label>
              <Input
                id="food-carbs"
                name="carbs"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={food?.carbs}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-fat">Grasa (g)</Label>
              <Input
                id="food-fat"
                name="fat"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={food?.fat}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
