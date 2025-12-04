/**
 * MAX_SAME_ERROR_DEFAULT: the number of repeated same errors from a single client before suppression.
 * Repeated errors are detected using error fingerprinting.
 * @type {number}
 */
const MAX_SAME_ERROR_DEFAULT = 3

/**
 * MAX_BURST_WINDOW_MS: the time window in order to detect burst errors
 * @type {number}
 */
const MAX_BURST_WINDOW_MS = 10_000

/**
 * MAX_BURST_ERRORS The maximum number of errors allowed inside of the MAX_BURST_MS time window before logs are supressed
 * @type {number}
 */
const MAX_BURST_ERRORS = 10

/**
 * @typedef {Object} ErrorEvent
 * @property {string} type - Error type (js_error, console_error, unhandled_promise)
 * @property {string} message - Error message
 * @property {string} [source] - Source file
 * @property {number} [line] - Line number
 * @property {number} [col] - Column number
 * @property {string} [stack] - Stack trace
 * @property {string} [errorType] - Error constructor name
 */

/**
 *   Browser error logger
 *   Sends error events to /api/browser-logs via beacon
 *   Includes deduplication and burst protection
 */
export class ErrorTracking {
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/browser-logs',
      maxSameError: config.maxSameError || MAX_SAME_ERROR_DEFAULT,
      burstWindow: config.burstWindow || MAX_BURST_WINDOW_MS,
      maxBurst: config.maxBurst || MAX_BURST_ERRORS,
      // Allow dependency injection for testing
      navigator: config.navigator || globalThis.navigator,
      location: config.location || globalThis.location,
      console: config.console || globalThis.console,
      Date: config.Date || Date,
      Blob: config.Blob || Blob
    }

    this.errorCounts = new Map()
    this.recentLogs = []
    this.burstActive = false
    this.origConsoleError = this.config.console.error
  }

  /**
   * Initialize error tracking by attaching global handlers
   */
  init() {
    // Attach error handlers
    globalThis.onerror = this.handleError.bind(this)
    globalThis.addEventListener(
      'unhandledrejection',
      this.handleRejection.bind(this)
    )

    // Wrap console.error
    this.config.console.error = (...args) => {
      this.handleConsoleError(args)
      this.origConsoleError.apply(this.config.console, args)
    }
  }

  /**
   * Handle uncaught JavaScript errors
   * @param {string} message - Error message
   * @param {string} source - Source file URL
   * @param {number} line - Line number
   * @param {number} col - Column number
   * @param {Error} error - Error object
   */
  handleError(message, source, line, col, error) {
    this.sendLog({
      type: 'js_error',
      message,
      source,
      line,
      col,
      stack: error?.stack || null,
      errorType: error?.name || 'Error'
    })
  }

  /**
   * Serialize a value to string, with JSON for objects
   */
  serializeValue(value) {
    if (typeof value === 'string') {
      return value
    }
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  /**
   * Handle unhandled promise rejections
   */
  handleRejection(event) {
    const message = event.reason?.message || this.serializeValue(event.reason)

    this.sendLog({
      type: 'unhandled_promise',
      message,
      stack: event.reason?.stack || null,
      errorType: event.reason?.name || 'Error'
    })
  }

  /**
   * Handle console.error calls
   */
  handleConsoleError(args) {
    this.sendLog({
      type: 'console_error',
      message: args.map((arg) => this.serializeValue(arg)).join(' ')
    })
  }

  /**
   * Create unique fingerprint for error deduplication
   * @param {ErrorEvent} event - The error event to fingerprint
   * @returns {string} Unique fingerprint for the error
   */
  getErrorFingerprint(event) {
    const type = event.type || 'unknown'
    const message = event.message || ''
    const source = event.source || event.filename || ''
    const line = event.line || event.lineno || ''
    return `${type}:${message}:${source}:${line}`
  }

  /**
   * Check if error should be logged (deduplication + burst protection)
   * @param {ErrorEvent} event - The error event to check
   * @returns {boolean} true if should log, false if should suppress
   */
  shouldSendLog(event) {
    const fingerprint = this.getErrorFingerprint(event)
    const count = this.errorCounts.get(fingerprint) || 0

    // Deduplication: same error more than maxSameError times
    if (count >= this.config.maxSameError) {
      return false
    }

    // Burst protection: too many errors too quickly
    const now = this.config.Date.now()
    this.recentLogs.push(now)

    // Clean old entries
    while (
      this.recentLogs.length &&
      this.recentLogs[0] < now - this.config.burstWindow
    ) {
      this.recentLogs.shift()
    }

    if (this.recentLogs.length > this.config.maxBurst) {
      // Stop all logging - something is badly broken
      if (!this.burstActive) {
        this.config.console.warn(
          'Browser error logging paused: too many errors detected'
        )
        this.burstActive = true
      }
      return false
    }

    // Update count
    this.errorCounts.set(fingerprint, count + 1)
    this.burstActive = false
    return true
  }

  /**
   * Send error log to backend
   * @param {ErrorEvent} event - The error event to send
   */
  sendLog(event) {
    if (!this.shouldSendLog(event)) {
      return
    }

    try {
      const payload = JSON.stringify({
        ...event,
        url: this.config.location.pathname,
        userAgent: this.config.navigator.userAgent,
        timestamp: this.config.Date.now(),
        occurrenceCount: this.errorCounts.get(this.getErrorFingerprint(event))
      })

      this.config.navigator.sendBeacon(
        this.config.endpoint,
        new this.config.Blob([payload], { type: 'application/json' })
      )
    } catch {
      // Fail silently to avoid infinite loops
    }
  }

  /**
   * Reset error tracking state (useful for testing)
   */
  reset() {
    this.errorCounts.clear()
    this.recentLogs = []
    this.burstActive = false
  }
}
