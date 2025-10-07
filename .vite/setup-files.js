import { vi, beforeEach } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'
import '@testing-library/jest-dom/vitest'

const fetchMock = createFetchMock(vi)

fetchMock.enableMocks()
global.fetch = fetchMock

beforeEach(() => expect.hasAssertions())
