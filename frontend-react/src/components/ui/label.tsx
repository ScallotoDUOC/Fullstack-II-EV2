import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("tw:mb-1 tw:block tw:text-xs tw:font-medium tw:text-muted-foreground", className)} {...props} />;
}
