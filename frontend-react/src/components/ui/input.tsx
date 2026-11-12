import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "tw:h-9 tw:w-full tw:min-w-0 tw:rounded-md tw:border tw:border-input tw:bg-background tw:px-3 tw:py-1 tw:text-sm tw:text-foreground tw:shadow-xs tw:placeholder:text-muted-foreground tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
