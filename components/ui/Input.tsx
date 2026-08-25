import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium mb-1 text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full border border-border rounded-md px-3 py-2 bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
