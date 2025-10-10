import { vi, beforeEach, expect } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
expect.extend(matchers)

const fetchMock = createFetchMock(vi)

fetchMock.enableMocks()
global.fetch = fetchMock

beforeEach(() => expect.hasAssertions())
