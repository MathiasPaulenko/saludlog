import { pathToFileURL } from "node:url";
import { count } from "drizzle-orm";
import { db } from "./index";
import { foods, habits, type NewFood } from "./schema";

const DEFAULT_HABITS = [
  { name: "Sueño", unit: "hours", targetDaily: 8, sortOrder: 1 },
  { name: "Agua", unit: "ml", targetDaily: 2000, sortOrder: 2 },
  { name: "Meditación", unit: "check", targetDaily: null, sortOrder: 3 },
  { name: "Pasos", unit: "count", targetDaily: 8000, sortOrder: 4 },
] as const;

// Macros por 100 g (o 100 ml) — valores aproximados de USDA
const DEFAULT_FOODS: NewFood[] = [
  { name: "Arroz blanco (cocido)", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Pechuga de pollo", kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Huevo", kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Avena", kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { name: "Banana", kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: "Pan", kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: "Leche entera", kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, baseUnit: "ml" },
  { name: "Yogur natural", kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Aceite de oliva", kcal: 884, protein: 0, carbs: 0, fat: 100, baseUnit: "ml" },
  { name: "Pasta (cocida)", kcal: 158, protein: 5.8, carbs: 30.9, fat: 0.9 },
  { name: "Atún en lata", kcal: 116, protein: 25.5, carbs: 0, fat: 1 },
  { name: "Lentejas (cocidas)", kcal: 116, protein: 9, carbs: 20.1, fat: 0.4 },
  { name: "Manzana", kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
  { name: "Queso", kcal: 300, protein: 25, carbs: 1.3, fat: 21 },
  { name: "Carne vacuna", kcal: 217, protein: 26, carbs: 0, fat: 12 },
];

export function seedIfEmpty(): void {
  const habitCount = db.select({ value: count() }).from(habits).all()[0]?.value ?? 0;
  if (habitCount === 0) {
    db.insert(habits).values([...DEFAULT_HABITS]).run();
  }

  const foodCount = db.select({ value: count() }).from(foods).all()[0]?.value ?? 0;
  if (foodCount === 0) {
    db.insert(foods).values(DEFAULT_FOODS).run();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedIfEmpty();
  console.log("Seed applied.");
}
