import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: (value: any) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, label, error, required, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        // Check if the function expects an event by looking at the function string
        const funcStr = onChange.toString();
        if (funcStr.includes('.target.value') || funcStr.includes('e.target')) {
          // Standard signature - pass event
          onChange(e as any);
        } else {
          // Custom signature - pass value directly
          onChange(e.target.value as any);
        }
      }
    };

    const inputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
      className,
    );

    if (label) {
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            onChange={handleChange}
            required={required}
            {...props}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        onChange={handleChange}
        required={required}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };