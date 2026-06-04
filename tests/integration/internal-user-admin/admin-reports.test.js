// @vitest-environment jsdom
import { getByRole, getByText } from '@testing-library/dom'
import { vi } from 'vitest'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  responseToDocument,
  setupTestServer,
  validateResponse
} from '~/tests/integration/shared/test-setup-helpers.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

const summaryApiValue = {
  submittedExemptions: 3,
  unsubmittedExemptions: 1,
  withdrawnExemptions: 1,
  coordinatesInputMethod: {
    shapefile: 1,
    kml: 2,
    manualCoordinates: 3
  },
  coordinateSystemVolume: {
    wgs84: { count: 3, percentage: 75 },
    bng: { count: 1, percentage: 25 },
    total: 4
  },
  byArticle: {
    25: 2,
    17: 1
  },
  byMarinePlanArea: {
    'East inshore': 2,
    'South inshore': 1
  },
  byCoastalOperationsArea: {
    South: 1,
    'South East': 1
  }
}

const teamAdminAuth = { credentials: { isTeamAdmin: true } }

describe('Admin exemptions summary report', () => {
  const getServer = setupTestServer()

  test('renders status counts and statistics from summary API', async () => {
    vi.mocked(authenticatedGetRequest).mockResolvedValue({
      payload: { message: 'success', value: summaryApiValue }
    })

    const response = await makeGetRequest({
      server: getServer(),
      url: routes.ADMIN_REPORTS,
      auth: teamAdminAuth
    })

    validateResponse(response)
    const document = responseToDocument(response)

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Exemptions summary report'
      })
    ).toBeInTheDocument()

    expect(getByText(document, 'Submitted exemptions')).toBeInTheDocument()
    expect(getByText(document, 'Unsubmitted exemptions')).toBeInTheDocument()
    expect(getByText(document, 'Shapefile')).toBeInTheDocument()
    expect(document.body.textContent).toContain('75%')
    expect(getByText(document, 'East inshore')).toBeInTheDocument()

    expect(authenticatedGetRequest).toHaveBeenCalledWith(
      expect.anything(),
      '/exemptions/summary'
    )
  })

  test('returns forbidden when user is not a team admin', async () => {
    const response = await makeGetRequest({
      server: getServer(),
      url: routes.ADMIN_REPORTS
    })

    expect(response.statusCode).toBe(statusCodes.forbidden)
  })

  test('shows error message when summary API fails', async () => {
    vi.mocked(authenticatedGetRequest).mockRejectedValueOnce(
      new Error('API Error')
    )

    const response = await makeGetRequest({
      server: getServer(),
      url: routes.ADMIN_REPORTS,
      auth: teamAdminAuth
    })

    validateResponse(response)
    const document = responseToDocument(response)

    expect(
      getByText(
        document,
        'We could not retrieve the latest report values. Showing zero values instead.'
      )
    ).toBeInTheDocument()
  })
})
