/** "Kestrel Systems" becomes "KS": the first letter of the first two words, upper case. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
