"use client";

import { useSyncExternalStore } from "react";
import { t, type Locale } from "@/lib/i18n-shared";

const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  return () => o.disconnect();
};

export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.lang === "en" ? "en" : "es"),
    () => "es",
  );
}

export function useT<S>(dict: { es: S; en: S }): S {
  return t(dict, useLocale());
}
