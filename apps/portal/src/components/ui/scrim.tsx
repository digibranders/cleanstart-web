/**
 * The dimmed layer behind a drawer, dialog, popover or dropdown. Clicking it closes the overlay for mouse users.
 * It is hidden from assistive technology and has no key handler on purpose: keyboard users close every overlay
 * with Escape (handled by the overlay itself), so a second, focusable "close" target would only be noise.
 */
export function Scrim({
  onClose,
  className = "cs-scrim",
  style,
}: {
  onClose: () => void;
  className?: "cs-scrim" | "dd-scrim";
  style?: React.CSSProperties;
}): React.JSX.Element {
  // biome-ignore lint/a11y/useKeyWithClickEvents: aria-hidden click-away layer, Escape closes the overlay
  return <div className={className} onClick={onClose} aria-hidden="true" style={style} />;
}
