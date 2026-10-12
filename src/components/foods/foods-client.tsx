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

export function FoodsClient({ foods }: { foods: Food[] }) {
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
    if (!window.confirm(`¿Eliminar "${food.name}"?`)) return;
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
          placeholder="Buscar alimento…"
          className="max-w-xs"
        />
        <Button onClick={openCreate} className="ml-auto">
          <Plus />
          Nuevo alimento
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">kcal</TableHead>
              <TableHead className="text-right">Prot. (g)</TableHead>
              <TableHead className="text-right">Carbs (g)</TableHead>
              <TableHead className="text-right">Grasa (g)</TableHead>
              <TableHead className="text-right">Por</TableHead>
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
                      aria-label={`Editar ${food.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(food)}
                      aria-label={`Eliminar ${food.name}`}
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
                  {query
                    ? "Sin resultados para esa búsqueda."
                    : "Todavía no hay alimentos."}
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
