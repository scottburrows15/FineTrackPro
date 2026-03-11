import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg",
        "border border-slate-200 dark:border-border",
        "bg-white dark:bg-input",
        "px-3 py-2.5 text-base md:text-sm",
        "text-slate-900 dark:text-foreground",
        "ring-offset-background",
        "placeholder:text-slate-400 dark:placeholder:text-muted-foreground",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
        "hover:border-slate-300 dark:hover:border-border",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-muted",
        "resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
