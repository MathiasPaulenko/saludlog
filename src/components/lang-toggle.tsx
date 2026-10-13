"use client";

import { Languages } from "lucide-react";
import { useT } from "@/lib/use-locale";
import { Button } from "@/components/ui/button";

const S = {
  es: { label: "English", aria: "Switch to English" },
  en: { label: "Español", aria: "Cambiar a español" },
};

export function LangToggle() {
  const s = useT(S);

  function toggle() {
    const next = document.documentElement.lang === "en" ? "es" : "en";
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    location.reload();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="w-full justify-start gap-2.5 px-3 text-muted-foreground"
      aria-label={s.aria}
    >
      <Languages className="size-4" />
      {s.label}
    </Button>
  );
}
