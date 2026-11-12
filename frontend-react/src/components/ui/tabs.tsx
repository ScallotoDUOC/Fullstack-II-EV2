import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

// Pestañas de shadcn/ui sobre Radix: la activa se ve con fondo violeta y texto blanco (buen contraste)
export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn("tw:flex tw:flex-col tw:gap-4", className)} {...props} />;
}
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("tw:inline-flex tw:w-fit tw:max-w-full tw:flex-wrap tw:items-center tw:gap-1 tw:rounded-xl tw:bg-muted tw:p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:whitespace-nowrap tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-3.5 tw:py-1.5 tw:text-sm tw:font-medium tw:text-muted-foreground tw:transition-colors tw:hover:text-foreground tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:data-[state=active]:bg-primary tw:data-[state=active]:text-primary-foreground tw:data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("tw:outline-none", className)} {...props} />;
}
