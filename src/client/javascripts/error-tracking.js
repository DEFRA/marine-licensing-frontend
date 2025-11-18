/*
  Browser error logger
  Sends error events to /api/browser-logs via beacon
  Includes deduplication and burst protection
*/

/**
 * ErrorTracking component for capturing and reporting browser errors
 * Follows GOV.UK Frontend component pattern for consistency and testability
 */
export class ErrorTracking {
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/browser-logs',
      maxSameError: config.maxSameError || 3,
      burstWindow: config.burstWindow || 10000,
      maxBurst: config.maxBurst || 10,
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
   */
  handleError(message, source, line, col, error) {
    this.sendLog({
      type: 'js_error',
      message,
      source,
      line,
      col,
      stack: error?.stack || null
    })
  }

  /**
   * Handle unhandled promise rejections
   */
  handleRejection(event) {
    this.sendLog({
      type: 'unhandled_promise',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || null
    })
  }

  /**
   * Handle console.error calls
   */
  handleConsoleError(args) {
    this.sendLog({
      type: 'console_error',
      message: args.map(String).join(' ')
    })
  }

  /**
   * Create unique fingerprint for error deduplication
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
