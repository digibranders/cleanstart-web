import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { StateView } from "./StateView";
import type { StateVariant } from "./state-presets";

export interface EmptyStateProps {
  /** A light-tone variant: `empty`, `no-results`, `load-failed`, etc. */
  variant: StateVariant;
  title?: string;
  description?: string | null;
  actions?: ReactNode;
  className?: string;
}

/**
 * Inline empty / no-results / load-failed block for listing grids, modals, and
 * forms. Thin wrapper over `StateView` that reserves vertical space so the
 * surrounding layout doesn't collapse when a list is empty.
 */
export function EmptyState({
  variant,
  title,
  description,
  actions,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex w-full flex-1 items-center justify-center px-4 py-12",
        className,
      )}
      style={{ minHeight: "400px" }}
    >
      <StateView
        variant={variant}
        {...(title !== undefined ? { title } : {})}
        {...(description !== undefined ? { description } : {})}
        {...(actions !== undefined ? { actions } : {})}
      />
    </div>
  );
}
