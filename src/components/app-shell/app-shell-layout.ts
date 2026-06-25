/**
 * Dashboard + landing header logo nudge (rem).
 * Edit these values, save, then refresh the page.
 *
 * X: more negative = further left, more positive = further right
 * Y: negative = up, positive = down
 */
export const APP_SHELL_LOGO_OFFSET_X_REM = -1.5
export const APP_SHELL_LOGO_OFFSET_Y_REM = 0.5

/** Header row padding — shifts logo + nav + settings together (not just the logo). */
export const APP_SHELL_HEADER_PADDING = {
  leftRem: 0,
  rightRem: 1.5,
} as const

/** Header row height. Tailwind h-28 = 7rem. Smaller = shorter bar, logo sits higher on page. */
export const APP_SHELL_HEADER_HEIGHT_CLASS = "h-28" as const

/** Inline style for the logo wrapper — applied in layout, not on Link. */
export const appShellLogoOffsetStyle = {
  marginLeft: `${APP_SHELL_LOGO_OFFSET_X_REM}rem`,
  marginTop: `${APP_SHELL_LOGO_OFFSET_Y_REM}rem`,
} as const
