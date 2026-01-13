import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

type NumberFieldProps = {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export const NumberField = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  inputClassName,
  disabled = false,
}: NumberFieldProps) => {
  const [localVal, setLocalVal] = React.useState(value.toString());

  React.useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const clampValue = (next: number) => {
    let result = next;
    if (min !== undefined && result < min) result = min;
    if (max !== undefined && result > max) result = max;
    return result;
  };

  const commitValue = (next: number) => {
    const clamped = clampValue(next);
    onChange(clamped);
    setLocalVal(clamped.toString());
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setLocalVal(nextValue);
    const parsed = parseFloat(nextValue);
    if (!Number.isNaN(parsed)) {
      commitValue(parsed);
    }
  };

  const handleBlur = () => {
    setLocalVal(value.toString());
  };

  const handleStep = (direction: 1 | -1) => {
    const parsed = parseFloat(localVal);
    const base = Number.isFinite(parsed) ? parsed : value;
    commitValue(base + step * direction);
  };

  return (
    <div className={clsx("relative", className)}>
      <input
        type="number"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={clsx(
          "w-full bg-background border border-border rounded px-2 py-1 text-xs pr-7",
          disabled && "opacity-60 cursor-not-allowed",
          inputClassName
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={disabled}
          className="h-2.5 w-3 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronUp size={9} />
        </button>
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={disabled}
          className="h-2.5 w-3 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronDown size={9} />
        </button>
      </div>
    </div>
  );
};
