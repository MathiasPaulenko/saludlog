import { Suspense } from "react";
import { saveGoalsForm } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocale, t } from "@/lib/i18n";
import { GOAL_LABELS } from "@/lib/labels";
import { getGoals } from "@/lib/queries/goals";

const GOAL_KEYS = ["daily_kcal", "daily_protein", "weekly_workouts"] as const;

const S = {
  es: {
    title: "Metas",
    exportTitle: "Exportar datos",
    fullJson: "JSON completo (saludlog-export.json)",
    csvByDomain: "CSV por dominio:",
    noGoal: "Sin meta",
    disableHint: "Dejá un campo vacío para desactivar esa meta.",
    save: "Guardar metas",
    domains: {
      foods: "Alimentos",
      meals: "Comidas",
      workouts: "Entrenos",
      habits: "Hábitos",
      metrics: "Peso",
    } as Record<string, string>,
  },
  en: {
    title: "Goals",
    exportTitle: "Export data",
    fullJson: "Full JSON (saludlog-export.json)",
    csvByDomain: "CSV by domain:",
    noGoal: "No goal",
    disableHint: "Leave a field empty to disable that goal.",
    save: "Save goals",
    domains: {
      foods: "Foods",
      meals: "Meals",
      workouts: "Workouts",
      habits: "Habits",
      metrics: "Weight",
    } as Record<string, string>,
  },
};

const CSV_DOMAINS = ["foods", "meals", "workouts", "habits", "metrics"] as const;

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const locale = await getLocale();
  const s = t(S, locale);
  const goals = await getGoals();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <form
        action={saveGoalsForm}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-border p-4"
      >
        {GOAL_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`goal-${key}`}>{GOAL_LABELS[locale][key]}</Label>
            <Input
              id={`goal-${key}`}
              name={key}
              type="number"
              min="0"
              step="any"
              defaultValue={goals[key]}
              placeholder={s.noGoal}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{s.disableHint}</p>
        <Button type="submit" className="w-fit">
          {s.save}
        </Button>
      </form>
      <div className="flex max-w-md flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{s.exportTitle}</h2>
        <a
          href="/api/export"
          className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {s.fullJson}
        </a>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{s.csvByDomain}</p>
          {CSV_DOMAINS.map((domain) => (
            <a
              key={domain}
              href={`/api/export/csv?domain=${domain}`}
              className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {s.domains[domain]} (saludlog-{domain}.csv)
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
