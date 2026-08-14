import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

describe('Confirmation page', () => {
  const getServer = setupTestServer()

  it('should display the confirmation page with all required elements', async () => {
    const testReference = 'TEST-REF-123'
    const document = await loadPage({
      requestUrl: `${routes.CONFIRMATION}?applicationReference=${testReference}`,
      server: getServer()
    })

    const panel = document.querySelector('.govuk-panel')
    expect(panel).toBeInTheDocument()

    const panelTitle = within(panel).getByText('Application complete')
    expect(panelTitle).toBeInTheDocument()

    const referenceText = within(panel).getByText(testReference)
    expect(referenceText).toBeInTheDocument()

    const confirmationMessage = within(document).getByText(
      /We have sent you a confirmation email with your reference number/
    )
    expect(confirmationMessage).toBeInTheDocument()

    const nextStepsHeading = within(document).getByRole('heading', {
      level: 2,
      name: 'What happens next'
    })
    expect(nextStepsHeading).toBeInTheDocument()

    const activityMessage = within(document).getByText(
      /You can complete your activity within the dates you provided/
    )
    expect(activityMessage).toBeInTheDocument()

    const feedbackLink = within(document).getByRole('link', {
      name: /What did you think of this service/
    })
    expect(feedbackLink).toBeInTheDocument()
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZURFMxRkhCSzQyVlRKQzdZNDEyVDhSMFdSNy4u&route=shorturl'
    )
    expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(feedbackLink).toHaveClass('govuk-link')
    expect(feedbackLink.parentElement).toHaveTextContent(
      'What did you think of this service? (takes 30 seconds)'
    )
  })

  it('should keep the exemption mid journey survey URL in the banner', async () => {
    const document = await loadPage({
      requestUrl: `${routes.CONFIRMATION}?applicationReference=TEST-REF-123`,
      server: getServer()
    })

    const phaseBanner = document.querySelector('.govuk-phase-banner')
    const bannerLink = within(phaseBanner).getByRole('link', {
      name: /give your feedback/i
    })
    expect(bannerLink).toHaveAttribute(
      'href',
      'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZUNERIRURNOFNVT0tXSlo1NUdONUYxQjNKUy4u&route=shorturl'
    )
  })

  it('should return bad request when application reference is missing', async () => {
    const response = await makeGetRequest({
      server: getServer(),
      url: routes.CONFIRMATION
    })

    expect(response.statusCode).toBe(statusCodes.badRequest)
  })

  it('should handle application reference from query parameter', async () => {
    const testReference = 'ANOTHER-REF-456'
    const document = await loadPage({
      requestUrl: `${routes.CONFIRMATION}?applicationReference=${testReference}`,
      server: getServer()
    })

    const referenceText = within(document).getByText(testReference)
    expect(referenceText).toBeInTheDocument()
  })
})
