import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

// Tabla de shadcn/ui (con scroll horizontal en pantallas chicas)
export function Table({ className, ...props }: ComponentProps<"table">) {
  return <div className="tw:w-full tw:overflow-x-auto"><table className={cn("tabla-apilable tw:w-full tw:caption-bottom tw:border-collapse tw:text-sm", className)} {...props} /></div>;
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("tw:border-b tw:border-border tw:bg-muted/60", className)} {...props} />;
}
export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn(className)} {...props} />;
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("tw:border-b tw:border-border tw:transition-colors tw:hover:bg-muted/40", className)} {...props} />;
}
export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("tw:h-10 tw:whitespace-nowrap tw:px-3 tw:text-left tw:align-middle tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted-foreground", className)} {...props} />;
}
// `label` es el nombre de la columna: en pantallas chicas la tabla se apila y cada celda muestra su etiqueta
export function TableCell({ className, label = "", ...props }: ComponentProps<"td"> & { label?: string }) {
  return <td data-label={label} className={cn("tw:px-3 tw:py-3 tw:align-middle", className)} {...props} />;
}
