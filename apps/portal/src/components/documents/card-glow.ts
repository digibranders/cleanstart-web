/**
 * Moves the soft highlight on a document card to the pointer. It writes two CSS variables straight onto the card, so
 * nothing re-renders; one handler on the grid covers every card (and the spotlight) inside it.
 */
export function trackGlow(event: React.PointerEvent<HTMLElement>): void {
  if (event.pointerType !== 'mouse') return;
  const card = (event.target as HTMLElement).closest<HTMLElement>('.dcard, .dspot, .dlink');
  if (!card) return;
  const box = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - box.left}px`);
  card.style.setProperty('--my', `${event.clientY - box.top}px`);
}
