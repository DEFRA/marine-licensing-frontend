/**
 * Retry strategy implementations
 */

export class BaseRetryStrategy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.baseDelay = options.baseDelay || 1000
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDelay(attempt) {
    throw new Error('getDelay must be implemented by subclass')
  }
}

export class ExponentialBackoffStrategy extends BaseRetryStrategy {
  constructor(options = {}) {
    super(options)
    this.multiplier = options.multiplier || 2
    this.maxDelay = options.maxDelay || 30000
    this.jitter = options.jitter !== false // Default to true
  }

  getDelay(attempt) {
    let delay = this.baseDelay * Math.pow(this.multiplier, attempt - 1)

    // Apply maximum delay limit
    delay = Math.min(delay, this.maxDelay)

    // Add jitter to prevent thundering herd
    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.floor(delay)
  }
}

export class LinearBackoffStrategy extends BaseRetryStrategy {
  constructor(options = {}) {
    super(options)
    this.increment = options.increment || 1000
  }

  getDelay(attempt) {
    return this.baseDelay + this.increment * (attempt - 1)
  }
}

export class FixedDelayStrategy extends BaseRetryStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDelay(attempt) {
    return this.baseDelay
  }
}

export class CustomStrategy extends BaseRetryStrategy {
  constructor(options = {}) {
    super(options)
    if (typeof options.delayFunction !== 'function') {
      throw new Error('CustomStrategy requires a delayFunction')
    }
    this.delayFunction = options.delayFunction
  }

  getDelay(attempt) {
    return this.delayFunction(attempt, this.baseDelay, this.maxRetries)
  }
}

export class RetryStrategy {
  static create(strategyType, options = {}) {
    switch (strategyType) {
      case 'exponential':
        return new ExponentialBackoffStrategy(options)
      case 'linear':
        return new LinearBackoffStrategy(options)
      case 'fixed':
        return new FixedDelayStrategy(options)
      case 'custom':
        return new CustomStrategy(options)
      default:
        throw new Error(`Unknown retry strategy: ${strategyType}`)
    }
  }
}
