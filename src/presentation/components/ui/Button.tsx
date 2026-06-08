import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "green" | "blue" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  variant = "green",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        fullWidth && "w-full",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "green" &&
          "bg-brand-green text-white hover:bg-brand-green-dark",
        variant === "blue" &&
          "bg-brand-blue text-white hover:bg-brand-blue-dark",
        variant === "outline" &&
          "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
