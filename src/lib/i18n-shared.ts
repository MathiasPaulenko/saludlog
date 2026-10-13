import { es, enUS, type Locale as DateFnsLocale } from "date-fns/locale";

export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];

export function t<S>(dict: { es: S; en: S }, locale: Locale): S {
  return dict[locale];
}

export function dateFnsLocale(locale: Locale): DateFnsLocale {
  return locale === "en" ? enUS : es;
}

export const ACTION_ERRORS = {
  es: {
    invalidData: "Datos inválidos",
    invalidId: "ID inválido",
    invalidDate: "Fecha inválida",
    foodNotFound: "Algún alimento no existe",
    minOneFood: "Agregá al menos un alimento",
    foodInUse: (n: number) =>
      `No se puede eliminar: está en ${n} comida${n === 1 ? "" : "s"} registrada${n === 1 ? "" : "s"}`,
    foodNameTaken: "Ya existe un alimento con ese nombre",
    routineNameTaken: "Ya existe una rutina con ese nombre",
    routineNotFound: "Rutina no encontrada",
  },
  en: {
    invalidData: "Invalid data",
    invalidId: "Invalid ID",
    invalidDate: "Invalid date",
    foodNotFound: "Some food doesn't exist",
    minOneFood: "Add at least one food",
    foodInUse: (n: number) =>
      `Can't delete: it's in ${n} logged ${n === 1 ? "meal" : "meals"}`,
    foodNameTaken: "A food with that name already exists",
    routineNameTaken: "A routine with that name already exists",
    routineNotFound: "Routine not found",
  },
};
