"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => o.disconnect();
};

export function ThemeToggle() {
  const light = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("light"),
    () => false,
  );

  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("light");
    el.classList.toggle("light", next);
    el.classList.toggle("dark", !next);
    localStorage.setItem("theme", next ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="w-full justify-start gap-2.5 px-3 text-muted-foreground"
      aria-label={light ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
      {light ? "Modo oscuro" : "Modo claro"}
    </Button>
  );
}
