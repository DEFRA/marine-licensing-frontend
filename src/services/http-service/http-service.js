import Wreck from '@hapi/wreck'
import { RetryStrategy } from './retry-strategies.js'
import { HttpError, RetryableError } from './errors.js'

/**
 * Configurable HTTP service with retry capabilities
 * Designed for AWS environments with extensible retry strategies
 */
export class HttpService {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      retryStrategy: config.retryStrategy || 'exponential',
      headers: config.headers || {},
      agent: config.agent || null,
      ...config
    }

    this.retryStrategy = RetryStrategy.create(this.config.retryStrategy, {
      maxRetries: this.config.retries,
      baseDelay: this.config.retryDelay
    })

    // Configure Wreck client
    this.client = Wreck.defaults({
      timeout: this.config.timeout,
      headers: this.config.headers,
      agent: this.config.agent
    })
  }

  /**
   * Perform HTTP GET request with retry logic
   */
  async get(url, options = {}) {
    return this._executeWithRetry('GET', url, null, options)
  }

  /**
   * Perform HTTP POST request with retry logic
   */
  async post(url, payload = null, options = {}) {
    return this._executeWithRetry('POST', url, payload, options)
  }

  /**
   * Perform HTTP PUT request with retry logic
   */
  async put(url, payload = null, options = {}) {
    return this._executeWithRetry('PUT', url, payload, options)
  }

  /**
   * Perform HTTP DELETE request with retry logic
   */
  async delete(url, options = {}) {
    return this._executeWithRetry('DELETE', url, null, options)
  }

  /**
   * Perform HTTP PATCH request with retry logic
   */
  async patch(url, payload = null, options = {}) {
    return this._executeWithRetry('PATCH', url, payload, options)
  }

  /**
   * Execute HTTP request with retry logic
   * @private
   */
  async _executeWithRetry(method, url, payload, options) {
    let lastError
    let attempt = 0

    while (attempt <= this.config.retries) {
      try {
        const result = await this._makeRequest(method, url, payload, options)
        return result
      } catch (error) {
        lastError = error
        attempt++

        // Don't retry on non-retryable errors
        if (!this._isRetryableError(error) || attempt > this.config.retries) {
          throw error
        }

        // Calculate delay and wait
        const delay = this.retryStrategy.getDelay(attempt)
        await this._delay(delay)
      }
    }

    throw lastError
  }

  /**
   * Make the actual HTTP request
   * @private
   */
  async _makeRequest(method, url, payload, options) {
    const requestOptions = {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers
      }
    }

    try {
      const { res, payload: responsePayload } = await this.client.request(
        method,
        url,
        {
          payload,
          ...requestOptions
        }
      )

      // Handle HTTP error status codes
      if (res.statusCode >= 400) {
        const error = new HttpError(
          `HTTP ${res.statusCode}: ${res.statusMessage}`,
          res.statusCode,
          responsePayload
        )

        // Mark 5xx errors as retryable
        if (res.statusCode >= 500) {
          error.retryable = true
        }

        throw error
      }

      return {
        statusCode: res.statusCode,
        headers: res.headers,
        data: responsePayload
      }
    } catch (error) {
      // Handle network/timeout errors
      if (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message.includes('timeout')
      ) {
        throw new RetryableError(error.message, error.code)
      }

      throw error
    }
  }

  /**
   * Determine if an error is retryable
   * @private
   */
  _isRetryableError(error) {
    // Explicit retryable errors
    if (error.retryable === true) {
      return true
    }

    // Network errors
    if (error instanceof RetryableError) {
      return true
    }

    // HTTP 5xx errors
    if (error instanceof HttpError && error.statusCode >= 500) {
      return true
    }

    // Specific error codes
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED'
    ]
    if (retryableCodes.includes(error.code)) {
      return true
    }

    return false
  }

  /**
   * Delay execution
   * @private
   */
  async _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }

    // Recreate retry strategy if changed
    if (newConfig.retryStrategy) {
      this.retryStrategy = RetryStrategy.create(newConfig.retryStrategy, {
        maxRetries: this.config.retries,
        baseDelay: this.config.retryDelay
      })
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config }
  }
}
