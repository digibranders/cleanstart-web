interface SegProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name when no visible label points at the group. */
  ariaLabel?: string;
  labelledBy?: string;
  compact?: boolean;
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  labelledBy,
  compact,
}: SegProps<T>): React.JSX.Element {
  return (
    <span className="seg" role="group" aria-label={ariaLabel} aria-labelledby={labelledBy}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`seg-b${option === value ? " seg-on" : ""}`}
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          style={compact ? { height: 24, padding: "0 10px" } : undefined}
        >
          {option}
        </button>
      ))}
    </span>
  );
}
