/**
 * Custom error classes for HTTP service
 */

export class HttpError extends Error {
  constructor(message, statusCode, responseData = null) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.responseData = responseData
    this.retryable = false

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      responseData: this.responseData,
      retryable: this.retryable
    }
  }
}

export class RetryableError extends Error {
  constructor(message, code = null) {
    super(message)
    this.name = 'RetryableError'
    this.code = code
    this.retryable = true

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryableError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable
    }
  }
}

export class TimeoutError extends RetryableError {
  constructor(message, timeout) {
    super(message)
    this.name = 'TimeoutError'
    this.timeout = timeout
  }
}
