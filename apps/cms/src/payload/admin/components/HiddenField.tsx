'use client';

/**
 * Invisible field component. Returns null so nothing is rendered in the form
 * UI, but unlike `admin.hidden: true`, the field's value IS registered in the
 * Payload form state. This lets `useRowLabel` / `useFormFields` hooks read the
 * value in sibling components (e.g. `TocRowLabel`), which they cannot do when
 * the field is completely absent from the form state.
 *
 * Use this on array sub-fields that must stay invisible in the expanded row
 * but whose values are needed by the row-label component.
 */
const HiddenField = (): null => null;

export { HiddenField };
