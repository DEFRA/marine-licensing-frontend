/**
 * Configuration factory for different environments
 */
export class HttpServiceConfig {
  /**
   * Create configuration for development environment
   */
  static forDevelopment(options = {}) {
    return {
      timeout: options.timeout || 10000,
      retries: options.retries || 2,
      retryDelay: options.retryDelay || 500,
      retryStrategy: options.retryStrategy || 'fixed',
      headers: {
        'User-Agent': 'marine-licensing-frontend-dev',
        ...options.headers
      },
      ...options
    }
  }

  /**
   * Create configuration for testing environment
   */
  static forTesting(options = {}) {
    return {
      timeout: options.timeout || 5000,
      retries: options.retries || 1,
      retryDelay: options.retryDelay || 100,
      retryStrategy: options.retryStrategy || 'fixed',
      headers: {
        'User-Agent': 'marine-licensing-frontend-test',
        ...options.headers
      },
      ...options
    }
  }

  /**
   * Create configuration for production environment
   */
  static forProduction(options = {}) {
    return {
      timeout: options.timeout || 45000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 2000,
      retryStrategy: options.retryStrategy || 'exponential',
      headers: {
        'User-Agent': `marine-licensing-frontend/${process.env.npm_package_version ?? '1.0.0'}`,
        ...options.headers
      },
      ...options
    }
  }

  /**
   * Create configuration based on NODE_ENV
   */
  static forEnvironment(env = process.env.NODE_ENV, options = {}) {
    switch (env) {
      case 'production':
        return this.forProduction(options)
      case 'development':
        return this.forDevelopment(options)
      case 'test':
        return this.forTesting(options)
      default:
        return this.forProduction(options)
    }
  }
}
