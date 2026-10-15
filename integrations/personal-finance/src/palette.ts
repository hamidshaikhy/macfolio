// Brass, sea glass, brick, and slate against deep petroleum surfaces.
export const palette = [
  "#c9b079",
  "#7fbaaa",
  "#c49a70",
  "#d28e7e",
  "#81aebb",
  "#b2a28b",
];

// Update the appearance of saved default colors without rewriting user records.
const previousPalette = [
  "#a89bef", "#82b5a1", "#d0aa76", "#cd8f99", "#82a8ca", "#ae9ebc",
];
export function displayColor(color: string) {
  const index = previousPalette.indexOf(color.toLowerCase());
  return index === -1 ? color : palette[index];
}
