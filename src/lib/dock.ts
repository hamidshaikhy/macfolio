export function magnification(distance: number) {
  return 1 + 0.6 * Math.exp(-Math.pow(distance / 76, 2));
}
