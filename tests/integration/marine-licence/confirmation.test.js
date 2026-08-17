import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

describe('Marine licence confirmation page', () => {
  const getServer = setupTestServer()

  it('should display the confirmation page with all required elements', async () => {
    const testReference = 'ML-REF-123'
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${testReference}`,
      server: getServer()
    })

    const panel = document.querySelector('.govuk-panel')
    expect(panel).toBeInTheDocument()

    const panelTitle = within(panel).getByText(
      /The information relating to your marine licence application has been sent/
    )
    expect(panelTitle).toBeInTheDocument()

    const referenceText = within(panel).getByText(testReference)
    expect(referenceText).toBeInTheDocument()

    const confirmationEmailMessage = within(document).getByText(
      /We've sent you a confirmation email with your reference number/
    )
    expect(confirmationEmailMessage).toBeInTheDocument()

    const nextStepsHeading = within(document).getByRole('heading', {
      level: 2,
      name: 'What happens next'
    })
    expect(nextStepsHeading).toBeInTheDocument()

    const reviewMessage = within(document).getByText(
      /We'll review your information and contact you within 5 working days/
    )
    expect(reviewMessage).toBeInTheDocument()

    const contactParagraph = within(document).getByText(
      /If you need to contact us, you can email/
    )
    expect(contactParagraph).toBeInTheDocument()

    const contactEmail = within(document).getByRole('link', {
      name: 'marine.consents@marinemanagement.org.uk'
    })
    expect(contactEmail).toBeInTheDocument()
    expect(contactEmail).toHaveAttribute(
      'href',
      'mailto:marine.consents@marinemanagement.org.uk'
    )
    expect(contactEmail).toHaveClass('govuk-link')
  })

  it('should display the survey link with the hint text and the marine licence survey URL', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=ML-REF-123`,
      server: getServer()
    })

    const surveyLink = within(document).getByRole('link', {
      name: 'What did you think of this service?'
    })
    expect(surveyLink).toBeInTheDocument()
    expect(surveyLink).toHaveAttribute(
      'href',
      'https://forms.cloud.microsoft/e/vUT96ZvAez'
    )
    expect(surveyLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(surveyLink).toHaveClass('govuk-link')

    expect(surveyLink.parentElement).toHaveTextContent(
      'What did you think of this service? (takes 30 seconds)'
    )
  })

  it('should display the banner feedback link using a different, mid journey survey URL', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=ML-REF-123`,
      server: getServer()
    })

    const phaseBanner = document.querySelector('.govuk-phase-banner')
    const bannerLink = within(phaseBanner).getByRole('link', {
      name: /give your feedback/i
    })
    expect(bannerLink).toHaveAttribute(
      'href',
      'https://forms.cloud.microsoft/e/MHPbixhs4i'
    )

    const surveyLink = within(document).getByRole('link', {
      name: 'What did you think of this service?'
    })
    expect(bannerLink.getAttribute('href')).not.toBe(
      surveyLink.getAttribute('href')
    )
  })

  it('should return bad request when application reference is missing', async () => {
    const response = await makeGetRequest({
      server: getServer(),
      url: marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })

  it('should handle application reference from query parameter', async () => {
    const testReference = 'ML-ANOTHER-REF-456'
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRMATION}?applicationReference=${testReference}`,
      server: getServer()
    })

    const referenceText = within(document).getByText(testReference)
    expect(referenceText).toBeInTheDocument()
  })
})
