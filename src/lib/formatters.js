/**
 * formatters.js — Shared formatting utilities for WalletStory
 */

/**
 * Format p-value for display.
 * Handles underflow cases (p < 1e-300) and extreme significance.
 *
 * @param {number} p - Raw p-value (0 to 1)
 * @param {string|null} pScientific - Pre-formatted scientific notation string (e.g., "1.23e-45" or "< 1e-300")
 * @returns {string} Human-readable p-value string
 */
export function formatPValue(p, pScientific = null) {
  // If backend provided a pre-formatted string and it's not the underflow sentinel, use it
  if (pScientific && pScientific !== "0.00e+00" && pScientific !== "< 1e-300") {
    return pScientific;
  }

  // Handle underflow (float64 precision limit)
  if (p === 0 || p < 1e-300) {
    return "< 10⁻³⁰⁰";
  }

  // For extreme significance, use superscript notation
  if (p < 1e-10) {
    const exp = Math.abs(Math.floor(Math.log10(p)));
    return `< 10⁻${exp}`;
  }

  // Otherwise, use scientific notation
  return p.toExponential(2);
}
