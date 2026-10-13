"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteFood } from "@/actions/foods";
import { FoodFormDialog } from "@/components/foods/food-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Food } from "@/db/schema";
import { BASE_UNIT_LABELS } from "@/lib/labels";
import { useT } from "@/lib/use-locale";

const S = {
  es: {
    confirmDelete: (n: string) => `¿Eliminar "${n}"?`,
    search: "Buscar alimento…",
    newFood: "Nuevo alimento",
    name: "Nombre",
    proteinCol: "Prot. (g)",
    carbsCol: "Carbs (g)",
    fatCol: "Grasa (g)",
    perCol: "Por",
    editLabel: (n: string) => `Editar ${n}`,
    deleteLabel: (n: string) => `Eliminar ${n}`,
    noResults: "Sin resultados para esa búsqueda.",
    empty: "Todavía no hay alimentos.",
  },
  en: {
    confirmDelete: (n: string) => `Delete "${n}"?`,
    search: "Search food…",
    newFood: "New food",
    name: "Name",
    proteinCol: "Prot. (g)",
    carbsCol: "Carbs (g)",
    fatCol: "Fat (g)",
    perCol: "Per",
    editLabel: (n: string) => `Edit ${n}`,
    deleteLabel: (n: string) => `Delete ${n}`,
    noResults: "No results for that search.",
    empty: "No foods yet.",
  },
};

export function FoodsClient({ foods }: { foods: Food[] }) {
  const s = useT(S);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Food | undefined>();
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      foods.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [foods, query],
  );

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(food: Food) {
    setEditing(food);
    setDialogOpen(true);
  }

  function handleDelete(food: Food) {
    if (!window.confirm(s.confirmDelete(food.name))) return;
    startTransition(async () => {
      const res = await deleteFood(food.id);
      if (!res.ok) window.alert(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.search}
          className="max-w-xs"
        />
        <Button onClick={openCreate} className="ml-auto">
          <Plus />
          {s.newFood}
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{s.name}</TableHead>
              <TableHead className="text-right">kcal</TableHead>
              <TableHead className="text-right">{s.proteinCol}</TableHead>
              <TableHead className="text-right">{s.carbsCol}</TableHead>
              <TableHead className="text-right">{s.fatCol}</TableHead>
              <TableHead className="text-right">{s.perCol}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((food) => (
              <TableRow key={food.id}>
                <TableCell className="font-medium">{food.name}</TableCell>
                <TableCell className="text-right">{food.kcal}</TableCell>
                <TableCell className="text-right">{food.protein}</TableCell>
                <TableCell className="text-right">{food.carbs}</TableCell>
                <TableCell className="text-right">{food.fat}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {food.baseAmount} {BASE_UNIT_LABELS[food.baseUnit]}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(food)}
                      aria-label={s.editLabel(food.name)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(food)}
                      aria-label={s.deleteLabel(food.name)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {query ? s.noResults : s.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FoodFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        food={editing}
      />
    </div>
  );
}
