import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

// <select> nativo con el aspecto de los campos de shadcn/ui (funciona bien en móvil y con teclado)
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "tw:h-9 tw:w-full tw:min-w-0 tw:cursor-pointer tw:rounded-md tw:border tw:border-input tw:bg-background tw:px-3 tw:py-1 tw:text-sm tw:text-foreground tw:shadow-xs tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
