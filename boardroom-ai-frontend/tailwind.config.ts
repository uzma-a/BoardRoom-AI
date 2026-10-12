import type { Config } from "tailwindcss";

/**
 * Design tokens for Boardroom AI.
 *
 * Colors map 1:1 to the specified palette. Each semantic color also gets
 * a CSS-variable-backed value so components can reference `bg-primary`,
 * `text-success`, `border-danger/40`, etc. instead of raw hex codes —
 * this is what keeps the "premium SaaS" look consistent (Linear/Vercel/
 * Stripe all rely on translucent tints of a small token set, e.g.
 * `primary/10` for subtle backgrounds, rather than flat saturated blocks).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1020",
        surface: "#111827",
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#F9FAFB",
          // A lighter tint used specifically for primary-colored TEXT on
          // the dark background (links, active nav labels, badges) —
          // the base primary (#6366F1) is only 4.24:1 against #0B1020,
          // just under WCAG AA's 4.5:1 for normal text. This shade hits
          // 6.35:1 while still reading clearly as the same brand hue.
          // Solid fills (buttons, icon chips) keep using the base color,
          // since those are evaluated as UI components (3:1 threshold),
          // not text.
          text: "#818CF8",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "#374151",
        foreground: "#F9FAFB",
        muted: "#9CA3AF",
      },
      fontFamily: {
        // Geist Sans: Vercel's own typeface — deliberate choice given the
        // brief explicitly cites Vercel Dashboard as visual inspiration.
        // Used for both display and body copy, with weight/tracking doing
        // the hierarchy work rather than mixing unrelated families.
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        // Geist Mono: reserved for data-forward UI — confidence scores,
        // timestamps, vote tallies, board metrics. This is what gives the
        // "executive control room" feel: numbers read as instrumentation,
        // not prose.
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        "card": "0 1px 2px 0 rgb(0 0 0 / 0.20), 0 1px 3px 0 rgb(0 0 0 / 0.10)",
        "card-hover": "0 8px 24px -6px rgb(0 0 0 / 0.35)",
        "glow-primary": "0 0 0 1px rgb(99 102 241 / 0.4), 0 0 24px -4px rgb(99 102 241 / 0.35)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
