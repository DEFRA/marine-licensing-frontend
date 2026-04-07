import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { sharedSiteNameTests } from './site-name-tests.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

describe('Site name page (marine licence)', () => {
  const getServer = setupTestServer()

  const setupMock = (siteDetails = [{}]) => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails
    })
  }

  beforeEach(() => {
    setupMock()
  })

  sharedSiteNameTests({
    getServer,
    url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
    setupMock,
    projectName: mockMarineLicenceApplication.projectName,
    cancelLinkHref: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
    backLinkHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
  })

  test('should redirect after valid site name is submitted', async () => {
    setupMock([{}])

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
      server: getServer(),
      formData: { siteName: 'Test Site Name' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_SITE_NAME
    )
  })

  test('should show correct content for second site', async () => {
    setupMock([{}, {}])

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NAME}?site=2`
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
    )
  })
})
