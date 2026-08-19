// The app's design tokens, copied from app/globals.css. Copied rather than imported: this project
// has its own node_modules on purpose, so the Next build cannot break from a change made here the
// night before the deadline.
//
// The font stack is deliberately the same system stack the app renders in, so the graphics and the
// recorded footage look like one piece rather than a deck with a screencast dropped into it.
export const C = {
  bg: "#fdf6e3",
  panel: "#ffffff",
  ink: "#111111",
  yellow: "#ffd93d",
  pink: "#ff8fce",
  blue: "#4d9dff",
  green: "#4ade80",
  purple: "#b799ff",
  orange: "#ff9f43",
  red: "#ff6b6b",
  lime: "#d3f26a",
} as const;

export const FONT = 'system-ui, "Segoe UI", Inter, Arial, sans-serif';

// Neobrutalism: a hard offset shadow rather than a blurred one, and a border that is always ink.
export const neo = (offset = 8) => ({
  border: `4px solid ${C.ink}`,
  boxShadow: `${offset}px ${offset}px 0 ${C.ink}`,
});
