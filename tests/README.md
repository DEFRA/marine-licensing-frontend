# Integration Tests

This directory contains integration tests that provide a faster, more reliable testing approach compared to full end-to-end tests whilst maintaining comprehensive validation coverage.

## Overview

These tests replace slow, flaky E2E validation tests with fast, deterministic integration tests that use:

- **Direct HTTP testing** via `server.inject()` - Real server responses without network overhead
- **DOM Testing Library** - User-centric, semantic DOM queries and assertions
- **JSDOM parsing** - Full HTML structure validation without browser automation
- **Strategic mocking** - Eliminate external dependencies while testing real application logic
- **Lightning-fast execution** - 20-50ms per test instead of 5-30 seconds

## Purpose and Benefits

### Why These Tests Exist

1. **E2E Test Problems**: Traditional E2E tests are slow, expensive to maintain and lack fast feedback loop
2. **Coverage Gaps**: Unit tests alone don't catch integration issues between components
3. **Validation Focus**: Form validation tests don't need full browser automation
4. **Developer Experience**: Faster feedback loops improve development velocity
5. **CI Efficiency**: Reduced build times and infrastructure costs

### What Makes This Approach Better

- **Real Validation Logic**: Tests actual Joi schemas, error handling, and HTML generation
- **User-Centric**: DOM Testing Library focuses on how users interact with forms
- **Comprehensive Coverage**: Every validation scenario from E2E tests, but much faster
- **Deterministic**: No network timeouts, browser quirks, or Docker container issues
- **Easy Debugging**: Clear error messages and isolated test failures

## Test Structure

```
tests/
├── integration/
│   └── activity-dates/
│       └── activity-dates-validation.test.js  # ✅ Complete validation suite (33 tests)
└── README.md
```

## Performance Benefits

| Aspect             | E2E Tests                  | Integration Tests |
| ------------------ | -------------------------- | ----------------- |
| **Setup Time**     | 30-60 seconds              | <1 second         |
| **Test Execution** | 5-30 seconds each          | 20-50ms each      |
| **Dependencies**   | Docker + Browser + Backend | None              |
| **Debugging**      | Complex (multi-service)    | Simple (isolated) |

## What These Tests Cover

### ✅ HTTP Request/Response Testing

- Status codes and redirects
- Request/response headers
- Form submission handling
- Error handling

### ✅ HTML Structure Validation

- Page structure and elements
- Form components and labels
- Accessibility attributes
- Responsive design classes

### ✅ Content Verification

- Text content presence
- Dynamic data rendering
- Error message display
- Navigation elements

## Example Test Pattern

```javascript
import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'

test('should show validation error for invalid date', async () => {
  const response = await server.inject({
    method: 'POST',
    url: routes.ACTIVITY_DATES,
    payload: { 'activity-start-date-day': '32' }
  })

  const { document } = new JSDOM(response.result).window

  // User-centric queries
  const errorSummary = getByRole(document, 'alert')
  const errorMessage = getByText(document, 'The start date must be a real date')

  expect(errorSummary).toBeInTheDocument()
  expect(errorMessage).toBeInTheDocument()
})
```

### Key DOM Testing Library Benefits

- **Semantic Queries**: `getByRole('button')` instead of `querySelector('button')`
- **User-Focused**: Tests how users actually perceive and interact with the page
- **Accessibility Testing**: Ensures proper ARIA roles, labels, and semantic structure
- **Better Error Messages**: Clear feedback when elements aren't found as expected
- **Robustness**: Less brittle than CSS selector-based tests
