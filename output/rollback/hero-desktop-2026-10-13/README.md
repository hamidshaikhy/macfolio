# Desktop hero baseline — 2026-10-13

Saved immediately before the requested desktop-only framing adjustment.

- `experience.before.css`: complete stylesheet before this change.
- `geometry.json`: measured desktop, About window, phone and tablet layouts before this change.
- PNG files: matching electronic portrait screenshots before this change.

Previous desktop framing: hero height `1.12 × --port-height`, minimum 600px;
portrait width 53%, left 22%, top `0.13 × --port-height`;
caption inside the portrait at `0.76 × --port-height`;
bottom fade starts at `0.87 × --port-height`.

To undo only this change without removing later work, remove the isolated
“Desktop framing follows the visible port” block in `src/portfolio/experience.css`.
It consists of the eight `.pf-experience:not(.pf-compact)` rules immediately before
the “Compact scenes keep scroll-driven movement” comment. The original rules
remain intact elsewhere in the stylesheet. Also remove the browser test named
“desktop hero fills its viewport and keeps the approved arm chips below the header”.
The portrait files, phone rules and tablet rules were not changed.

Do not restore the complete saved stylesheet over later unrelated changes;
use it to compare or recover the exact previous rules instead.
