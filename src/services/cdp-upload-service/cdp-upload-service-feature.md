# CdpUploadService Requirements

## Overview

The `CdpUploadService` provides integration with the Defra CDP Uploader utility for secure file uploads with virus scanning. This service handles upload initiation and status polling only.

## Dependencies

- **Configuration**: Uses the convict-based configuration system

## File Constraints

- Maximum file size: **50MB**
- File size validation handled by CDP Uploader service

## Configuration Requirements

The following configuration values must be added to `src/config/config.js`:

```javascript
cdpUploader: {
  baseUrl: {
    doc: 'CDP Uploader service base URL',
    format: String,
    default: 'http://localhost:7337', // Local development default
    env: 'CDP_UPLOADER_BASE_URL'
  },
  timeout: {
    doc: 'Request timeout for CDP Uploader calls in milliseconds',
    format: Number,
    default: 30000,
    env: 'CDP_UPLOADER_TIMEOUT'
  },
  maxFileSize: {
    doc: 'Maximum file size in bytes (50MB)',
    format: Number,
    default: 52428800, // 50MB in bytes
    env: 'CDP_UPLOADER_MAX_FILE_SIZE'
  },

}
```

### Environment-Specific Configuration

#### Production

- Uses production CDP Uploader endpoint via HTTPS

#### Local Development

- Uses CDP Uploader on `localhost:7337`
- Mock virus scanning enabled
- HTTP protocol

## Service Implementation

### Class Structure

```javascript
export class CdpUploadService {
  constructor(allowedMimeTypes?)
  async initiate(redirectUrl, allowedMimeTypes?)
  async getStatus(uploadId) // Instance method preferred
}

// Factory functions for service instantiation
export function getCdpUploadService(allowedMimeTypes?)
```

### Constructor

```javascript
/**
 * @param {string[]?} allowedMimeTypes - Optional array of allowed MIME types (e.g., ['application/zip', 'application/vnd.google-earth.kml+xml'])
 */
constructor(allowedMimeTypes)
```

**Requirements:**

- Import and read config directly using `config.get('cdpUploader')`
- Accept optional `allowedMimeTypes` array for file type restrictions
- Controllers determine appropriate MIME types based on their use case
- Implement error handling and logging following API Integration Standards
- Configure timeout and base URL from config
- Implement logging at from debug levels upwards

### Factory Functions

Simple factory functions for service instantiation:

```javascript
/**
 * Get or create default CDP Upload service instance
 * @param {string[]?} allowedMimeTypes - Optional MIME types for file restrictions
 */
export function getCdpUploadService(allowedMimeTypes = null) {
  return new CdpUploadService(allowedMimeTypes)
}

/**
 * Create a new CDP Upload service instance
 * @param {string[]?} allowedMimeTypes - Optional MIME types for file restrictions
 */
export function createCdpUploadService(allowedMimeTypes = null) {
  return new CdpUploadService(allowedMimeTypes)
}
```

### Method: `initiate(redirectUrl, allowedMimeTypes?)`

**Purpose**: Initiates a new file upload session with CDP Uploader

**Parameters:**

- `redirectUrl` (string): URL to redirect user after upload completion
- `allowedMimeTypes` (string[], optional): Array of allowed MIME types to override constructor defaults

**Returns:**

```javascript
{
  uploadId: string,      // UUID for this upload session
  uploadUrl: string,     // Direct upload endpoint URL
  maxFileSize: number,   // Maximum allowed file size in bytes
  allowedTypes: string[] // Array of allowed MIME types
}
```

**Implementation Requirements:**

- POST to `{baseUrl}/initiate` with configuration
- Include redirect URL in request payload
- Use `allowedMimeTypes` parameter if provided, otherwise fall back to constructor parameter
- Return upload configuration for frontend form
- Handle HTTP errors and provide meaningful error messages

**Request Body:**

```javascript
{
  redirectUrl: string,
  maxFileSize: number,
  mimeTypes: string[] // From parameter > constructor (e.g., ['application/zip', 'application/vnd.google-earth.kml+xml'])
}
```

### Method: `getStatus(uploadId, statusUrl)`

**Purpose**: Polls the status of an upload operation

**Implementation**: Instance method (preferred for expandability)

**Parameters:**

- `uploadId` (string): UUID of the upload session to check
- `statusUrl` (string): the URL provided in the `initiate()` response to retrieve the status of the file

**Returns:**

```javascript
{
  status: 'pending' | 'scanning' | 'ready' | 'rejected' | 'error',
  message?: string,      // User-friendly status message (GDS approved)
  filename?: string,     // Original uploaded filename
  fileSize?: number,     // File size in bytes
  uploadedAt?: string,   // ISO timestamp of upload
  completedAt?: string,  // ISO timestamp of completion (if applicable)
  errorCode?: string,    // Error code for system logging
  retryable?: boolean    // Whether the operation can be retried
}
```

The status values should be exported constants that are easy to consume by tests and other services. Ideally a single export.

**Status Values:**

- `pending`: Upload initiated but not yet started
- `scanning`: File uploaded and being virus scanned
- `ready`: File scanned and available for use
- `rejected`: File rejected (virus found, invalid type, too large)
- `error`: System error occurred

**Implementation Requirements:**

- GET from `{baseUrl}/status/{uploadId}`
- Parse CDP Uploader response and transform to standardized format
- **Important**: Error messages from CDP Uploader are GDS content approved and can be passed directly to views
- Handle timeout scenarios gracefully
- Provide appropriate error messages for different failure scenarios

**Error Handling:**

- HTTP 404: Upload ID not found → `{ status: 'error', message: 'Upload session not found', retryable: false }`
- HTTP 5xx: Service error → `{ status: 'error', message: 'Service temporarily unavailable', retryable: true }`
- Network timeout → `{ status: 'error', message: 'Unable to check status', retryable: true }`

## Usage Example

**In Controller:**

```javascript
import { getCdpUploadService } from '~/src/services/cdp-upload-service/index.js'

// Usage without MIME type restrictions (allows any file type)
const cdpService = getCdpUploadService()
const uploadConfig = await cdpService.initiate('/success-page')
const status = await cdpService.getStatus(uploadId)

// With MIME type restrictions for Shapefiles and KML
const mimeTypes = ['application/zip', 'application/vnd.google-earth.kml+xml']
const cdpService = getCdpUploadService(mimeTypes)
const uploadConfig = await cdpService.initiate('/success-page')

// Override MIME types per upload
const cdpService = getCdpUploadService(['application/zip'])
const uploadConfig = await cdpService.initiate('/success-page', [
  'application/vnd.google-earth.kml+xml'
])
```

## Testing Requirements

### Coverage Requirements

- **Minimum**: >90% test coverage
- **Target**: 100% test coverage
- All methods, error paths, and edge cases must be tested

### Unit Tests

- Test error handling for all HTTP response scenarios
- Validate configuration parsing
- Test factory function behavior
- Test MIME type validation and prioritization (method parameter > constructor parameter)
- Test timeout and retry scenarios
- Test malformed response handling
- Test network failure scenarios

### Test Coverage Areas

- **Constructor**: All parameter combinations and validation
- **initiate()**: Success, HTTP errors, network failures, invalid responses
- **getStatus()**: All status types, error conditions, malformed responses
- **Factory Function**: `getCdpUploadService()`
- **Error Mapping**: CDP responses to standardized error format
- **Configuration**: Default values, overrides, validation

### Test Files

- **CdpUploadService**: `src/services/cdp-upload-service/cdp-upload-service.test.js`
- **Factory Functions**: `src/services/cdp-upload-service/index.test.js`
- **Integration**: `src/services/cdp-upload-service/integration.test.js`

### Testing Tools

- Jest for unit testing framework
- Test data covering all CDP Uploader response formats
- Coverage reporting via Jest's built-in coverage tools

## Coding Standards

### Avoid Magic Strings and Numbers

All string literals and numeric values must be defined as named constants:

```javascript
// Status constants
const UPLOAD_STATUS = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  READY: 'ready'
}

const FILE_STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  REJECTED: 'rejected'
}

const ERROR_STATUS = {
  ERROR: 'error'
}

// HTTP status codes
const HTTP_STATUS = {
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// API endpoints
const ENDPOINTS = {
  INITIATE: '/initiate',
  STATUS: '/status'
}

// Error messages
const ERROR_MESSAGES = {
  UPLOAD_NOT_FOUND: 'Upload session not found',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  STATUS_CHECK_FAILED: 'Unable to check status'
}

// Default values
const DEFAULTS = {
  MAX_FILE_SIZE: 52428800, // 50MB in bytes
  TIMEOUT: 30000
}
```

### Implementation Requirements

- Define all string literals as named constants
- Group related constants in objects
- Use descriptive constant names
- Export constants for use in tests
- Document constant purposes with JSDoc comments

## Security Considerations

- Upload IDs are UUIDs (non-guessable)
- No file content stored in frontend application
- File size limits enforced by CDP Uploader service
- Virus scanning handled by CDP Uploader

## API Response Formats

Based on the [CDP Uploader documentation](https://github.com/DEFRA/cdp-uploader):

### POST `/initiate` Response

```javascript
{
  "uploadId": "b18ceadb-afb1-4955-a70b-256bf94444d5",
  "uploadUrl": "/upload-and-scan/b18ceadb-afb1-4955-a70b-256bf94444d5",
  "statusUrl": "https://cdp-uploader/status/b18ceadb-afb1-4955-a70b-256bf94444d5"
}
```

### GET `/status/{uploadId}` Response

```javascript
{
  "uploadStatus": "ready", // "initiated" | "pending" | "ready"
  "metadata": {
    // Custom metadata from initiate request
  },
  "form": {
    "fieldName": {
      "fileId": "9fcaabe5-77ec-44db-8356-3a6e8dc51b13",
      "filename": "dragon-b.jpeg",
      "contentType": "image/jpeg",
      "fileStatus": "complete", // "complete" | "rejected" | "pending"
      "contentLength": 11264,
      "checksumSha256": "bng5jOVC6TxEgwTUlX4DikFtDEYEc8vQTsOP0ZAv21c=",
      "detectedContentType": "image/jpeg",
      "s3Key": "path/to/file",
      "s3Bucket": "bucket-name",
      "hasError": false, // true when rejected
      "errorMessage": "The selected file contains a virus" // GDS approved message
    }
  },
  "numberOfRejectedFiles": 0
}
```

### Error Messages (GDS Approved)

The `errorMessage` field contains user-ready text:

| Cause             | Error Message                                         |
| ----------------- | ----------------------------------------------------- |
| Virus detected    | "The selected file contains a virus"                  |
| File is empty     | "The selected file is empty"                          |
| File too large    | "The selected file must be smaller than {size}"       |
| Invalid file type | "The selected file must be a {types}"                 |
| Server error      | "The selected file could not be uploaded – try again" |

### Status Values

- **uploadStatus**: `"initiated"` → `"pending"` → `"ready"`
- **fileStatus**: `"pending"` → `"complete"` or `"rejected"`

## Implementation Decisions

1. ✅ **getStatus Implementation**: Instance method (preferred for expandability)

2. ✅ **API Endpoints**:

   - `POST /initiate` to prepare the endpoint for an upload
   - `GET /status/{uploadId}` for polling the status of the uploaded file

3. ✅ **Error Message Format**: GDS-approved messages can be displayed directly to users
