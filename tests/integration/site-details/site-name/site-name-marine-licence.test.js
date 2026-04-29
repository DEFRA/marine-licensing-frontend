import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import {
  mockFileUploadMarineLicence,
  mockMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { sharedSiteNameTests } from './site-name-tests.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { JSDOM } from 'jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
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
    cancelLinkHref: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
    backLinkHref: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
  })

  test('should redirect after valid site name is submitted for a manual site', async () => {
    setupMock([{}])

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
      server: getServer(),
      formData: { siteName: 'Test Site Name' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
    )
  })

  test('should redirect after valid site name is submitted for a file upload', async () => {
    setupMock(mockFileUploadMarineLicence.siteDetails)

    const response = await makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_SITE_NAME,
      server: getServer(),
      formData: { siteName: 'Test Site Name' }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
    )
  })

  test('should show correct content for second site and manual coordinates', async () => {
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

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
    )
  })

  test('should show correct content for file upload page variant', async () => {
    setupMock(mockFileUploadMarineLicence.siteDetails)

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NAME}?site=1`
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )

    const cancelLink = queryByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).not.toBeInTheDocument()
  })
})
