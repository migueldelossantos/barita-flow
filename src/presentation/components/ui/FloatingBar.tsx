import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface FloatingBarProps {
  left?: React.ReactNode;
  amount: string;
  actionLabel: string;
  onAction: () => void;
  variant?: "green" | "blue";
  className?: string;
}

export function FloatingBar({
  left,
  amount,
  actionLabel,
  onAction,
  variant = "green",
  className,
}: FloatingBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {left}
        <Button
          variant={variant}
          fullWidth
          onClick={onAction}
          className="flex-1 font-semibold uppercase tracking-wide"
        >
          {amount} | {actionLabel}
        </Button>
      </div>
    </div>
  );
}
