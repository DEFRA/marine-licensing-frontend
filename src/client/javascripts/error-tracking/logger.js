/**
 * Centralized error logging utility
 * All console.error calls go through this module to ensure they are captured by ErrorTracking
 * and to centralize lint suppressions
 */
export const logger = {
  /**
   * Log an error message with optional context
   * @param {string} message - The error message
   * @param {*} context - Optional context (object, error, or any value)
   */
  error(message, context = null) {
    if (context === null) {
      // eslint-disable-next-line no-console
      console.error(message) // NOSONAR - Logged via ErrorTracking
    } else {
      // eslint-disable-next-line no-console
      console.error(message, context) // NOSONAR - Logged via ErrorTracking
    }
  }
}
