/**
 * One chart language for the whole application.
 *
 * TradingView's reading: the data is the interface. Grids are almost invisible,
 * axes are unobtrusive, tooltips are solid panels rather than glass, and
 * series animate in progressively rather than popping.
 */

export const CHART = {
  /** Semantic series colours. */
  primary: "#3B82F6",
  accent: "#60A5FA",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  neutral: "#94A3B8",
} as const;

/** Ordered categorical palette — blue-led, low saturation drift. */
export const SERIES_PALETTE = [
  "#3B82F6", "#60A5FA", "#10B981", "#F59E0B", "#94A3B8", "#818CF8",
];

/** Horizontal-only hairline grid. */
export const gridProps = {
  stroke: "rgba(148,163,184,0.1)",
  strokeDasharray: "0",
  vertical: false,
} as const;

/** Quiet axis defaults. */
export const axisProps = {
  tick: { fontSize: 11, fill: "#94A3B8" },
  tickLine: false,
  axisLine: false,
} as const;

/** Solid tooltip surface — readable, never translucent mush. */
export const tooltipStyle: React.CSSProperties = {
  background: "#141A24",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 12,
  color: "#FFFFFF",
  boxShadow: "0 18px 44px -18px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.26)",
};

export const tooltipLabelStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 11,
  marginBottom: 4,
};

export const tooltipItemStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
};

/** Soft hover band behind bars. */
export const cursorFill = { fill: "rgba(148,163,184,0.06)" };

/** Progressive draw-in used by every series. */
export const ANIM = {
  isAnimationActive: true,
  animationBegin: 80,
  animationDuration: 900,
  animationEasing: "ease-out",
} as const;

/** Corner radii for bars — subtle, matching the card language. */
export const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
export const BAR_RADIUS_H: [number, number, number, number] = [0, 6, 6, 0];
