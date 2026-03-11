import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90",
        secondary:
          "border-transparent bg-slate-100 dark:bg-muted text-slate-700 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-accent",
        destructive:
          "border-transparent bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40",
        success:
          "border-transparent bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40",
        warning:
          "border-transparent bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40",
        outline: "border-slate-200 dark:border-border text-slate-700 dark:text-muted-foreground bg-transparent hover:bg-slate-50 dark:hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
