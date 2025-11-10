import { JSDOM } from 'jsdom'
import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'

describe('Same activity dates page', () => {
  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    multipleSiteDetails: {
      multipleSitesEnabled: true
    },
    siteDetails: [{ coordinatesType: 'coordinates' }]
  }
  beforeEach(() => mockExemption(mockExemptionData))

  const getServer = setupTestServer()

  test('should display the same activity dates page with correct content', async () => {
    const { updateExemptionMultipleSiteDetails } =
      mockExemption(mockExemptionData)
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-dates'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Are the activity dates the same for every site?'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, mockExemptionData.projectName)
    ).toBeInTheDocument()

    const yesRadio = getByRole(document, 'radio', {
      name: 'Yes, the dates are the same for every site'
    })
    expect(yesRadio).toHaveAttribute('type', 'radio')

    const noRadio = getByRole(document, 'radio', {
      name: 'No, at least one site has different dates'
    })
    expect(noRadio).toHaveAttribute('type', 'radio')

    expect(
      getByLabelText(document, 'Yes, the dates are the same for every site')
    ).toBeInTheDocument()
    expect(
      getByText(document, "You'll only need to enter the dates once")
    ).toBeInTheDocument()
    expect(
      getByLabelText(document, 'No, at least one site has different dates')
    ).toBeInTheDocument()
    expect(
      getByText(document, "You'll need to enter dates for each site")
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Cancel' })).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toBeInTheDocument()

    expect(updateExemptionMultipleSiteDetails).not.toHaveBeenCalled()
  })

  test('should pre-populate radio when sameActivityDates value exists in cache', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption({
      ...mockExemptionData,
      multipleSiteDetails: {
        ...mockExemptionData.multipleSiteDetails,
        sameActivityDates: 'yes'
      }
    })

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-dates'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const yesRadio = getByRole(document, 'radio', {
      name: 'Yes, the dates are the same for every site'
    })
    expect(yesRadio).toBeChecked()

    const noRadio = getByRole(document, 'radio', {
      name: 'No, at least one site has different dates'
    })
    expect(noRadio).not.toBeChecked()

    expect(updateExemptionMultipleSiteDetails).not.toHaveBeenCalled()
  })

  test('should have correct navigation links for manual coordinates', async () => {
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
    expect(backLink).toHaveAttribute('href', '/exemption/site-name')
  })

  test('should have correct navigation links for file upload', async () => {
    mockExemption({
      ...mockExemptionData,
      siteDetails: mockExemptionData.siteDetails.map((site) => ({
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
      url: '/exemption/same-activity-dates',
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Are the activity dates the same for every site?'
      })
    ).toBeInTheDocument()

    const errorMessage = document.querySelector('.govuk-error-message')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage.textContent).toContain(
      'Select whether the activity dates are the same for every site'
    )
  })

  test('should redirect to coordinates entry choice when "yes" is selected', async () => {
    const { updateExemptionMultipleSiteDetails } =
      mockExemption(mockExemptionData)
    const response = await makePostRequest({
      url: '/exemption/same-activity-dates',
      server: getServer(),
      formData: {
        sameActivityDates: 'yes'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-dates')

    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDates',
      'yes'
    )
  })

  test('should redirect to coordinates entry choice when "no" is selected', async () => {
    const { updateExemptionMultipleSiteDetails } =
      mockExemption(mockExemptionData)
    const response = await makePostRequest({
      url: '/exemption/same-activity-dates',
      server: getServer(),
      formData: {
        sameActivityDates: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-dates')

    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDates',
      'no'
    )
  })

  test('should redirect to same-activity-description when "no" is selected in a file upload', async () => {
    const { updateExemptionMultipleSiteDetails } = mockExemption({
      ...mockExemptionData,
      siteDetails: mockExemptionData.siteDetails.map((site) => ({
        ...site,
        coordinatesType: 'file'
      }))
    })

    const response = await makePostRequest({
      url: '/exemption/same-activity-dates',
      server: getServer(),
      formData: {
        sameActivityDates: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/exemption/same-activity-description'
    )

    expect(updateExemptionMultipleSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'sameActivityDates',
      'no'
    )
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/same-activity-dates'
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
