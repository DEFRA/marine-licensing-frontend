import { JSDOM } from 'jsdom'
import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import {
  setupTestServer,
  mockExemption
} from '~/tests/integration/shared/test-setup-helpers.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'

vi.mock('#src/server/common/helpers/save-site-details.js')

const exemptionWithMultipleSites = {
  id: 'test-exemption-123',
  projectName: 'Test Project',
  multipleSiteDetails: {
    multipleSitesEnabled: true
  },
  siteDetails: [{ coordinatesType: 'coordinates' }]
}

describe('Same activity description page', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(exemptionWithMultipleSites))

  test('should display the same activity description page with correct content', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption(
      exemptionWithMultipleSites
    )
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-description'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Is the activity description the same for every site?'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, exemptionWithMultipleSites.projectName)
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'Yes, the description is the same for every site'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'No, at least one site has a different description'
      })
    ).toBeInTheDocument()

    expect(
      getByLabelText(
        document,
        'Yes, the description is the same for every site'
      )
    ).toBeInTheDocument()

    expect(
      getByText(document, "You'll only need to enter the description once")
    ).toBeInTheDocument()

    expect(
      getByLabelText(
        document,
        'No, at least one site has a different description'
      )
    ).toBeInTheDocument()

    expect(
      getByText(document, "You'll need to enter a description for each site")
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Cancel' })).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toBeInTheDocument()

    expect(updateExemptionMultipleSiteDetails).not.toHaveBeenCalled()
  })

  test('should pre-populate radio when sameActivityDescription value exists in cache', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption({
      ...exemptionWithMultipleSites,
      multipleSiteDetails: {
        ...exemptionWithMultipleSites.multipleSiteDetails,
        sameActivityDescription: 'yes'
      }
    })

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-description'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'radio', {
        name: 'Yes, the description is the same for every site'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'No, at least one site has a different description'
      })
    ).toBeInTheDocument()

    expect(updateExemptionMultipleSiteDetails).not.toHaveBeenCalled()
  })

  test('should have correct navigation links', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-description'
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/exemption/task-list?cancel=site-details'
    )

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', '/exemption/activity-dates')
  })

  test('should have correct navigation links for file upload', async () => {
    mockExemption({
      ...exemptionWithMultipleSites,
      siteDetails: exemptionWithMultipleSites.siteDetails.map((site) => ({
        ...site,
        coordinatesType: 'file'
      }))
    })

    const { result } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-dates'
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/exemption/task-list?cancel=site-details'
    )

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', '/exemption/upload-file')
  })

  test('should stay on same page when continue is clicked without selecting an option', async () => {
    const { result, statusCode } = await makePostRequest({
      url: '/exemption/same-activity-description',
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Is the activity description the same for every site?'
      })
    ).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'sameActivityDescription',
        message:
          'Select whether the activity description is the same for every site'
      }
    ]

    validateErrors(expectedErrors, document)
  })

  test('should redirect to coordinates entry choice when "yes" is selected', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption(
      exemptionWithMultipleSites
    )
    const response = await makePostRequest({
      url: '/exemption/same-activity-description',
      server: getServer(),
      formData: {
        sameActivityDescription: 'yes'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-description')

    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDescription',
      'yes'
    )
  })

  test('should redirect to review site details "no" is selected in a file upload', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption({
      ...exemptionWithMultipleSites,
      siteDetails: exemptionWithMultipleSites.siteDetails.map((site) => ({
        ...site,
        coordinatesType: 'file'
      }))
    })

    const response = await makePostRequest({
      url: '/exemption/same-activity-description',
      server: getServer(),
      formData: {
        sameActivityDescription: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/review-site-details')
    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDescription',
      'no'
    )
  })

  test('should redirect to coordinates entry choice when "no" is selected', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption(
      exemptionWithMultipleSites
    )
    const response = await makePostRequest({
      url: '/exemption/same-activity-description',
      server: getServer(),
      formData: {
        sameActivityDescription: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-description')

    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDescription',
      'no'
    )
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-description'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/exemption/task-list?cancel=site-details'
    )
  })
})
