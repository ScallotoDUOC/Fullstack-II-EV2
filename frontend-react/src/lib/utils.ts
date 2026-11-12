import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge debe saber que nuestras clases llevan el prefijo "tw:"
const twMerge = extendTailwindMerge({ prefix: "tw" });

/** Une clases de Tailwind resolviendo conflictos (la última gana), como el `cn` de shadcn/ui. */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}
