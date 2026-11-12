import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("tw:rounded-xl tw:border tw:border-border tw:bg-card tw:text-card-foreground tw:shadow-sm", className)} {...props} />;
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("tw:flex tw:flex-col tw:gap-1 tw:px-5 tw:pt-5", className)} {...props} />;
}
export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("tw:m-0 tw:text-base tw:font-semibold tw:leading-none", className)} {...props} />;
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("tw:m-0 tw:text-sm tw:text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("tw:px-5 tw:py-5", className)} {...props} />;
}
