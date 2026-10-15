import type { FlowNode } from "./model";

export function layoutFlow(
  sources: FlowNode[],
  targets: FlowNode[],
  total: number,
  height: number,
  gap: number,
  top = 22,
  bottom = 22,
) {
  const count = Math.max(sources.length, targets.length, 1),
    scale = total > 0 ? (height - top - bottom - gap * (count - 1)) / total : 0;
  const position = (nodes: FlowNode[]) => {
    const span = total * scale + gap * Math.max(nodes.length - 1, 0);
    let y = top + (height - top - bottom - span) / 2;
    return nodes.map((n) => {
      const node = { ...n, y, h: n.value * scale };
      y += node.h + gap;
      return node;
    });
  };
  const src = position(sources), dst = position(targets);
  const sourceOffsets = src.map((n) => n.y),
    targetOffsets = dst.map((n) => n.y);
  // Proportional ribbons visualize aggregate totals, not traced purchases.
  const links = src.flatMap((source, i) => dst.map((target, j) => {
    const value = total > 0 ? (source.value / total) * target.value : 0,
      h = value * scale,
      sy = sourceOffsets[i], ty = targetOffsets[j];
    sourceOffsets[i] += h;
    targetOffsets[j] += h;
    return { source, target, value, h, sy, ty };
  }));
  return { sources: src, targets: dst, links, scale };
}

export function ribbonPath(
  link: { sy: number; ty: number; h: number },
  left: number,
  right: number,
) {
  const control = (right - left) * 0.45;
  return `M ${left} ${link.sy} C ${left + control} ${link.sy}, ${right - control} ${link.ty}, ${right} ${link.ty} L ${right} ${link.ty + link.h} C ${right - control} ${link.ty + link.h}, ${left + control} ${link.sy + link.h}, ${left} ${link.sy + link.h} Z`;
}
