import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

const badgeVariantes = cva("tw:inline-flex tw:items-center tw:rounded-full tw:border tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-semibold tw:whitespace-nowrap", {
  variants: {
    variant: {
      default: "tw:border-transparent tw:bg-primary tw:text-primary-foreground",
      secondary: "tw:border-transparent tw:bg-secondary tw:text-secondary-foreground",
      outline: "tw:border-border tw:text-foreground",
      success: "tw:border-transparent tw:bg-emerald-100 tw:text-emerald-800",
      warning: "tw:border-transparent tw:bg-amber-100 tw:text-amber-900",
      danger: "tw:border-transparent tw:bg-red-100 tw:text-red-800",
      info: "tw:border-transparent tw:bg-sky-100 tw:text-sky-800",
      neutral: "tw:border-transparent tw:bg-slate-200 tw:text-slate-700"
    }
  },
  defaultVariants: { variant: "default" }
});

export type VarianteBadge = NonNullable<VariantProps<typeof badgeVariantes>["variant"]>;
export function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariantes>) {
  return <span className={cn(badgeVariantes({ variant }), className)} {...props} />;
}
