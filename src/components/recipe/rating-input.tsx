"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingInputProps = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  size?: number;
  className?: string;
};

export function RatingInput({
  value,
  onChange,
  disabled,
  size = 28,
  className,
}: RatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, current + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, current - 1) || null);
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault();
      onChange(null);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Bewertung"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50",
        className,
      )}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = n <= active;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} Sterne`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "cursor-pointer rounded-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100",
            )}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isActive
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground",
              )}
            />
          </button>
        );
      })}
      {value != null && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-muted-foreground hover:text-foreground"
        >
          zurücksetzen
        </button>
      )}
    </div>
  );
}
