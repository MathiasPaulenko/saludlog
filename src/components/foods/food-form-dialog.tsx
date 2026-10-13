"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createFood, updateFood } from "@/actions/foods";
import type { OffCandidate } from "@/app/api/foods/search/route";
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
import { useT } from "@/lib/use-locale";

const S = {
  es: {
    editFood: "Editar alimento",
    newFood: "Nuevo alimento",
    offImport: "Importar de OpenFoodFacts",
    offSearch: "Buscar (ej: arroz)…",
    searching: "Buscando…",
    search: "Buscar",
    offNoResponse: "OpenFoodFacts no respondió",
    offNoConnection: "Sin conexión con OpenFoodFacts",
    noResults: "Sin resultados.",
    source: "Fuente",
    name: "Nombre",
    namePlaceholder: "Ej: Pechuga de pollo",
    baseAmount: "Cantidad base",
    unit: "Unidad",
    grams: "gramos (g)",
    milliliters: "mililitros (ml)",
    unitLabel: "unidad (u)",
    macrosNote: "Macros por la cantidad base indicada.",
    kcal: "Calorías (kcal)",
    protein: "Proteína (g)",
    carbs: "Carbohidratos (g)",
    fat: "Grasa (g)",
    saving: "Guardando…",
    save: "Guardar",
  },
  en: {
    editFood: "Edit food",
    newFood: "New food",
    offImport: "Import from OpenFoodFacts",
    offSearch: "Search (e.g.: rice)…",
    searching: "Searching…",
    search: "Search",
    offNoResponse: "OpenFoodFacts didn't respond",
    offNoConnection: "No connection to OpenFoodFacts",
    noResults: "No results.",
    source: "Source",
    name: "Name",
    namePlaceholder: "E.g.: Chicken breast",
    baseAmount: "Base amount",
    unit: "Unit",
    grams: "grams (g)",
    milliliters: "milliliters (ml)",
    unitLabel: "unit (u)",
    macrosNote: "Macros for the base amount indicated.",
    kcal: "Calories (kcal)",
    protein: "Protein (g)",
    carbs: "Carbohydrates (g)",
    fat: "Fat (g)",
    saving: "Saving…",
    save: "Save",
  },
};

interface FoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food?: Food;
}

interface Prefill {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function FoodFormDialog({ open, onOpenChange, food }: FoodFormDialogProps) {
  const s = useT(S);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [offQuery, setOffQuery] = useState("");
  const [offResults, setOffResults] = useState<OffCandidate[] | null>(null);
  const [offLoading, setOffLoading] = useState(false);
  const [offError, setOffError] = useState<string | null>(null);
  const [offSourceId, setOffSourceId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  async function searchOff() {
    const q = offQuery.trim();
    if (q.length < 2) return;
    setOffLoading(true);
    setOffError(null);
    try {
      const res = await fetch(
        `/api/foods/search?q=${encodeURIComponent(q)}&lang=${document.documentElement.lang || "es"}`,
      );
      const data = (await res.json()) as {
        results?: OffCandidate[];
        error?: string;
      };
      if (!res.ok) {
        setOffError(data.error ?? s.offNoResponse);
        setOffResults([]);
      } else {
        setOffResults(data.results ?? []);
      }
    } catch {
      setOffError(s.offNoConnection);
      setOffResults([]);
    } finally {
      setOffLoading(false);
    }
  }

  function pickCandidate(c: OffCandidate) {
    setPrefill({
      name: c.brand ? `${c.name} (${c.brand})` : c.name,
      kcal: c.kcal,
      protein: c.protein,
      carbs: c.carbs,
      fat: c.fat,
    });
    setOffSourceId(c.id);
    setOffResults(null);
  }

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
      source: offSourceId ? "openfoodfacts" : "manual",
      sourceId: offSourceId ?? undefined,
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
          <DialogTitle>{food ? s.editFood : s.newFood}</DialogTitle>
        </DialogHeader>

        {!food && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {s.offImport}
            </p>
            <div className="flex gap-2">
              <Input
                value={offQuery}
                onChange={(e) => setOffQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchOff();
                  }
                }}
                placeholder={s.offSearch}
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchOff}
                disabled={offLoading}
              >
                {offLoading ? s.searching : s.search}
              </Button>
            </div>
            {offError && (
              <p className="text-xs text-destructive">{offError}</p>
            )}
            {offResults && offResults.length === 0 && !offError && (
              <p className="text-xs text-muted-foreground">{s.noResults}</p>
            )}
            {offResults && offResults.length > 0 && (
              <ul className="max-h-40 overflow-auto">
                {offResults.map((c) => (
                  <li key={c.id || c.name}>
                    <button
                      type="button"
                      onClick={() => pickCandidate(c)}
                      className="w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                    >
                      {c.name}
                      {c.brand && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {c.brand}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.kcal} kcal/100g
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {offSourceId && (
              <p className="text-xs text-muted-foreground">
                {s.source}: OpenFoodFacts ({offSourceId})
              </p>
            )}
          </div>
        )}

        <form
          key={`${food?.id ?? "new"}-${offSourceId ?? "manual"}`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="food-name">{s.name}</Label>
            <Input
              id="food-name"
              name="name"
              required
              defaultValue={prefill?.name ?? food?.name}
              placeholder={s.namePlaceholder}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-baseAmount">{s.baseAmount}</Label>
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
              <Label htmlFor="food-baseUnit">{s.unit}</Label>
              <select
                id="food-baseUnit"
                name="baseUnit"
                defaultValue={food?.baseUnit ?? "g"}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="g">{s.grams}</option>
                <option value="ml">{s.milliliters}</option>
                <option value="unit">{s.unitLabel}</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{s.macrosNote}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-kcal">{s.kcal}</Label>
              <Input
                id="food-kcal"
                name="kcal"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={prefill?.kcal ?? food?.kcal}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-protein">{s.protein}</Label>
              <Input
                id="food-protein"
                name="protein"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={prefill?.protein ?? food?.protein}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-carbs">{s.carbs}</Label>
              <Input
                id="food-carbs"
                name="carbs"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={prefill?.carbs ?? food?.carbs}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="food-fat">{s.fat}</Label>
              <Input
                id="food-fat"
                name="fat"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={prefill?.fat ?? food?.fat}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? s.saving : s.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
