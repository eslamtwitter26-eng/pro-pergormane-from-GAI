/**
 * Shared motion language.
 *
 * Everything here is intentionally understated: short durations, a single
 * decelerating curve, and small distances. Motion should explain a change of
 * state, never announce itself.
 */
import type { Transition, Variants } from "framer-motion";

/** Apple-ish deceleration curve used across the whole app. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** Standard page transition — 250ms. */
export const PAGE_TRANSITION: Transition = { duration: 0.25, ease: EASE_OUT };

/** Springy-but-quiet transition for hover elevation. */
export const HOVER_TRANSITION: Transition = { duration: 0.24, ease: EASE_OUT };

/** Page-level fade + tiny rise. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: PAGE_TRANSITION },
  exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: EASE_IN_OUT } },
};

/** Parent that staggers its children by 80ms. */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

/** Child of `staggerContainer`. */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
};

/** Cards lift 4px on hover. */
export const cardHover = {
  whileHover: { y: -4, transition: HOVER_TRANSITION },
  whileTap: { y: -1, transition: { duration: 0.1 } },
};

/** Buttons gain a touch of elevation, never scale aggressively. */
export const buttonHover = {
  whileHover: { y: -1, transition: { duration: 0.18, ease: EASE_OUT } },
  whileTap: { y: 0, scale: 0.985, transition: { duration: 0.1 } },
};

/** Icons rotate a few degrees — a hint of life, nothing more. */
export const iconHover = {
  whileHover: { rotate: -6, scale: 1.06, transition: { duration: 0.26, ease: EASE_OUT } },
};
