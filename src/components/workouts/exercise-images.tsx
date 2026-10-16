"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const IMG =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export function ExerciseImages({
  sourceId,
  name,
}: {
  sourceId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <div className="flex gap-2">
        {[0, 1].map((n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={`${IMG}/${sourceId}/${n}.jpg`}
            alt={name}
            loading="lazy"
            onClick={() => setOpen(true)}
            className="h-44 w-1/2 cursor-zoom-in rounded-lg border border-border bg-muted object-contain transition-opacity hover:opacity-80"
          />
        ))}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-6" />
          </button>
          <div
            className="flex max-h-full max-w-5xl gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {[0, 1].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={n}
                src={`${IMG}/${sourceId}/${n}.jpg`}
                alt={name}
                className="max-h-[85vh] w-1/2 rounded-xl border border-border bg-card object-contain"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
