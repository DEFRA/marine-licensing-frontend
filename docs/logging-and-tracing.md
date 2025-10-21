# Logging and Tracing

## Overview

This document describes the logging strategy and distributed tracing implementation for the Marine Licensing Frontend application.

## CDP Request Tracing

### Implementation

The application implements distributed tracing to track requests across the CDP (Core Delivery Platform) infrastructure:

- All authenticated API requests automatically propagate the `x-cdp-request-id` header
- Tracing is handled by the `@defra/hapi-tracing` plugin
- Headers are added automatically in `src/server/common/helpers/authenticated-requests.js`

### How It Works

```javascript
// The tracing header is automatically added to all authenticated requests
const tracingHeader = config.get('tracing.header') // 'x-cdp-request-id'
const traceId = getTraceId() // From @defra/hapi-tracing
if (traceId) {
  headers[tracingHeader] = traceId
}
```

### Using Trace IDs for Debugging

1. **Find the trace ID**: Look for `x-cdp-request-id` in your application logs
2. **Cross-service tracing**: Use this ID to trace the request across all CDP services

## Logging Strategy

### Log Prefixes

All logs use consistent prefixes to enable easy filtering:

- **FileUpload**: All file upload and processing operations
- **[Future]**: Add prefixes for other subsystems as needed

Example:

```javascript
request.logger.info('FileUpload: Processing started')
request.logger.error({ error }, 'FileUpload: ERROR: Processing failed')
```

### Log Levels

#### **info** - Operational Events

Use for significant operational events that indicate normal flow:

- API calls initiated
- Status changes
- Operation completions
- Service responses received

#### **debug** - Detailed Information

Use for verbose information helpful during development:

- Full request/response payloads
- Form data contents
- Intermediate processing steps
- Configuration values

#### **error** - Failures and Exceptions

Use for all error conditions:

- Always include the full error object
- Add relevant context
- Use descriptive messages

### Error Logging Best Practices

#### Always Log Full Error Objects

```javascript
// Good - preserves stack trace
request.logger.error(
  {
    error,
    uploadId,
    fileType
  },
  'FileUpload: ERROR: Failed to process file'
)

// Bad - loses stack trace
request.logger.error(
  {
    error: error.message,
    uploadId
  },
  'Failed to process'
)
```

#### Include Relevant Context

```javascript
request.logger.error(
  {
    error,
    filename: status.filename,
    fileType: uploadConfig.fileType,
    uploadId: uploadConfig.uploadId,
    s3Location: { bucket, key }
  },
  'FileUpload: ERROR: Coordinate extraction failed'
)
```

## File Upload Logging

The file upload system uses comprehensive logging to track operations:

### Upload Flow Logging

1. **Upload initiation**: `FileUpload: Calling geo-parser API`
2. **Processing status**: Logged at each status check
3. **Success**: `FileUpload: Successfully extracted coordinates`
4. **Completion**: `FileUpload: File upload and coordinate extraction completed successfully`
5. **Errors**: `FileUpload: ERROR: [specific error message]`

### CDP Service Integration

- Full CDP responses logged at info level
- Status transformations logged for debugging
- File data extraction results tracked

## Testing Considerations

### Mocking Tracing

When testing authenticated requests:

```javascript
import { getTraceId } from '@defra/hapi-tracing'
vi.mock('@defra/hapi-tracing')

// In your test
const getTraceIdMock = vi.mocked(getTraceId)
getTraceIdMock.mockReturnValue('test-trace-id-123')
```

### Verifying Headers

```javascript
expect(Wreck.get).toHaveBeenCalledWith(
  expectedUrl,
  expect.objectContaining({
    headers: expect.objectContaining({
      'x-cdp-request-id': 'test-trace-id-123'
    })
  })
)
```

### Log Assertions

```javascript
// Verify correct log level and prefix
expect(mockRequest.logger.info).toHaveBeenCalledWith(
  expect.any(Object),
  expect.stringContaining('FileUpload:')
)

// Verify error objects are logged correctly
expect(mockRequest.logger.error).toHaveBeenCalledWith(
  expect.objectContaining({
    error: expect.any(Error)
  }),
  expect.any(String)
)
```

## Configuration

### Tracing Configuration

The tracing header name is configurable:

```javascript
// config/server.js or environment variable
tracing: {
  header: 'x-cdp-request-id'
}
```

### Log Level Configuration

Set via environment variables or configuration:

- Development: `debug` level recommended
- Production: `info` level recommended

## Troubleshooting

### Missing Trace Headers

1. Verify `@defra/hapi-tracing` is properly initialized
2. Check that the request has an active trace context
3. Ensure configuration includes `tracing.header`

### Log Aggregation Issues

1. Verify log prefix consistency
2. Check log level configuration
3. Ensure structured logging format is maintained

### Debugging Failed Requests

1. Find the initial request log with trace ID
2. Search all services using the trace ID
3. Check error logs for full stack traces
4. Review the request flow through CDP services
