import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

// Botón de shadcn/ui (variantes con class-variance-authority)
export const botonVariantes = cva(
  "tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-md tw:text-sm tw:font-medium tw:transition-colors tw:cursor-pointer tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-offset-1 tw:disabled:pointer-events-none tw:disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "tw:bg-primary tw:text-primary-foreground tw:border tw:border-primary tw:hover:bg-primary/90",
        outline: "tw:border tw:border-input tw:bg-background tw:text-foreground tw:hover:bg-accent tw:hover:text-accent-foreground",
        secondary: "tw:border tw:border-transparent tw:bg-secondary tw:text-secondary-foreground tw:hover:bg-secondary/80",
        destructive: "tw:border tw:border-destructive tw:bg-background tw:text-destructive tw:hover:bg-destructive tw:hover:text-destructive-foreground",
        ghost: "tw:border tw:border-transparent tw:bg-transparent tw:text-foreground tw:hover:bg-accent tw:hover:text-accent-foreground"
      },
      size: { default: "tw:h-9 tw:px-4", sm: "tw:h-8 tw:px-3 tw:text-xs", icon: "tw:h-9 tw:w-9" }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export function Button({ className, variant, size, type = "button", ...props }: ComponentProps<"button"> & VariantProps<typeof botonVariantes>) {
  return <button type={type} className={cn(botonVariantes({ variant, size }), className)} {...props} />;
}
