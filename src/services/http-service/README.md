# HttpService Usage Guide

A comprehensive HTTP service wrapper with retry logic, error handling, and AWS environment support for the Marine Licensing Frontend application.

## Table of Contents

- [Basic Usage](#basic-usage)
- [AWS Environment Configuration](#aws-environment-configuration)
- [Custom Retry Strategies](#custom-retry-strategies)
- [Marine Licensing API Service](#marine-licensing-api-service)
- [Error Handling](#error-handling)
- [Dynamic Configuration](#dynamic-configuration)

## Basic Usage

The simplest way to use HttpService is with the default singleton instance:

```javascript
import { getHttpService } from '../src/services/http/index.js'

async function basicUsage() {
  const httpService = getHttpService()

  try {
    // Simple GET request
    const response = await httpService.get('https://api.example.com/data')
    console.log('Response:', response.data)

    // POST request with payload
    const createResponse = await httpService.post(
      'https://api.example.com/items',
      {
        name: 'New Item',
        description: 'Item description'
      }
    )
    console.log('Created:', createResponse.data)
  } catch (error) {
    console.error('Request failed:', error.message)
  }
}
```

## Custom Retry Strategies

Implement custom retry logic with fibonacci-like delay sequences:

```javascript
import { createHttpService } from '../src/services/http/index.js'

async function customRetryStrategy() {
  // Custom delay function: fibonacci-like sequence
  const fibonacciDelay = (attempt, baseDelay) => {
    const fib = [1, 1, 2, 3, 5, 8, 13]
    return baseDelay * (fib[attempt - 1] || 13)
  }

  const httpService = createHttpService({
    retryStrategy: 'custom',
    delayFunction: fibonacciDelay,
    baseDelay: 500,
    retries: 6
  })

  try {
    const response = await httpService.get(
      'https://unreliable-api.example.com/data'
    )
    console.log('Data retrieved after retries:', response.data)
  } catch (error) {
    console.error('All retries exhausted:', error.message)
  }
}
```

## Disabling Retries

For scenarios where immediate failure is preferred without any retry attempts:

```javascript
import { createHttpService } from '../src/services/http/index.js'

async function noRetryExample() {
  // Create service with retries disabled
  const httpService = createHttpService({
    retries: 0
  })

  try {
    // This will fail immediately on any error without retries
    const response = await httpService.get(
      'https://unstable-api.example.com/data'
    )
    console.log('Success on first attempt:', response.data)
  } catch (error) {
    console.error('Request failed immediately (no retries):', error.message)
    // Handle error immediately - useful for real-time operations
    // where delays from retries are unacceptable
  }
}

// Alternative approach for critical path operations
async function criticalPathOperation() {
  const httpService = createHttpService({
    retries: 0,
    timeout: 5000 // Short timeout for fast failure
  })

  try {
    const response = await httpService.post(
      'https://api.example.com/critical-operation',
      {
        urgentData: 'time-sensitive-information'
      }
    )
    console.log('Critical operation completed:', response.data)
  } catch (error) {
    // Immediate fallback strategy without waiting for retries
    console.error('Critical operation failed, executing fallback...')
    // Execute alternative logic immediately
  }
}
```

## Marine Licensing API Service

A complete service class for marine licensing operations:

```javascript
import {
  createHttpService,
  HttpServiceConfig
} from '../src/services/http/index.js'

class MarineLicensingApiService {
  constructor() {
    this.httpService = createHttpService(
      HttpServiceConfig.forAWS({
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '2024-01-01'
        }
      })
    )
    this.baseUrl =
      process.env.MARINE_API_BASE_URL || 'https://api.marine-licensing.gov.uk'
  }

  async getLicense(licenseId) {
    const response = await this.httpService.get(
      `${this.baseUrl}/licenses/${licenseId}`
    )
    return response.data
  }

  async createLicenseApplication(applicationData) {
    const response = await this.httpService.post(
      `${this.baseUrl}/applications`,
      applicationData
    )
    return response.data
  }

  async updateApplicationStatus(applicationId, status) {
    const response = await this.httpService.patch(
      `${this.baseUrl}/applications/${applicationId}`,
      { status }
    )
    return response.data
  }

  async searchLicenses(criteria) {
    const queryParams = new URLSearchParams(criteria).toString()
    const response = await this.httpService.get(
      `${this.baseUrl}/licenses/search?${queryParams}`
    )
    return response.data
  }
}
```

### Usage Example

```javascript
const marineLicensingService = new MarineLicensingApiService()

// Get a specific license
const license = await marineLicensingService.getLicense('LIC-12345')

// Create a new application
const newApplication = await marineLicensingService.createLicenseApplication({
  applicantName: 'John Doe',
  licenseType: 'fishing',
  location: 'North Sea'
})

// Search for licenses
const searchResults = await marineLicensingService.searchLicenses({
  type: 'fishing',
  status: 'active',
  location: 'North Sea'
})
```

## Error Handling

Comprehensive error handling with different strategies for various error types:

```javascript
import { getHttpService } from '../src/services/http/index.js'

async function errorHandlingExample() {
  const httpService = getHttpService()

  try {
    const response = await httpService.get(
      'https://api.example.com/protected-resource',
      {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      }
    )
  } catch (error) {
    if (error.statusCode === 401) {
      console.log('Authentication failed - refreshing token')
      // Handle token refresh logic
    } else if (error.statusCode >= 500) {
      console.log('Server error - will be retried automatically')
    } else if (error.retryable) {
      console.log('Network error - retries exhausted')
      // Log for monitoring/alerting
    } else {
      console.log('Non-retryable error:', error.message)
    }
  }
}
```

## Dynamic Configuration

Update configuration at runtime for specific operations:

```javascript
import { getHttpService } from '../src/services/http/index.js'

async function dynamicConfiguration() {
  const httpService = getHttpService()

  // Update timeout for specific operations
  httpService.updateConfig({ timeout: 60000 })

  try {
    // Long-running operation
    const response = await httpService.post(
      'https://api.example.com/long-process',
      {
        data: 'large-dataset'
      }
    )

    // Reset to default timeout
    httpService.updateConfig({ timeout: 30000 })
  } catch (error) {
    console.error('Long operation failed:', error.message)
  }
}
```

## Environment Variables

The service uses the following environment variables:

- `API_TOKEN` - Authentication token for API requests
- `MARINE_API_BASE_URL` - Base URL for the Marine Licensing API (defaults to `https://api.marine-licensing.gov.uk`)

## Features

- **Automatic Retries**: Configurable retry strategies with exponential backoff
- **AWS Integration**: Pre-configured settings for AWS environments
- **Error Handling**: Comprehensive error categorization and handling
- **Timeout Management**: Configurable timeouts with runtime updates
- **Custom Headers**: Support for authentication and service identification headers
- **Monitoring Ready**: Error categorization for logging and alerting systems
