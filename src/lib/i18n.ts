import { cookies } from "next/headers";

export type { Locale } from "@/lib/i18n-shared";
export { dateFnsLocale, LOCALES, t } from "@/lib/i18n-shared";
import type { Locale } from "@/lib/i18n-shared";
import { ACTION_ERRORS, t } from "@/lib/i18n-shared";

export async function getLocale(): Promise<Locale> {
  return (await cookies()).get("lang")?.value === "en" ? "en" : "es";
}

export async function actionStrings() {
  return t(ACTION_ERRORS, await getLocale());
}
