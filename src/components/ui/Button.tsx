import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",          {
            "bg-brand text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-brand-hover": variant === "default",
            "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:shadow-sm": variant === "secondary",
            "border border-zinc-200 bg-transparent hover:bg-zinc-50 hover:border-zinc-300 text-zinc-900": variant === "outline",
            "hover:bg-zinc-100 hover:text-zinc-900": variant === "ghost",
            "h-12 px-6 py-2": size === "default",
            "h-9 rounded-full px-4": size === "sm",
            "h-14 rounded-full px-8 text-base": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
