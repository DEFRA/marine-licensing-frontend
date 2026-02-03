import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenseRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicense,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenseApplication } from '~/src/server/test-helpers/mocks/marine-license-mocks.js'

describe('Task List', () => {
  const getServer = setupTestServer()
  let document

  beforeEach(async () => {
    mockMarineLicense(mockMarineLicenseApplication)
    document = await loadPage({
      requestUrl: marineLicenseRoutes.MARINE_LICENSE_TASK_LIST,
      server: getServer()
    })
  })

  test('should render task list page elements', () => {
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Marine licence start page'
    )

    expect(
      getByText(
        document,
        "When you provide your information you'll need to complete all sections before you can send your application."
      )
    ).toBeInTheDocument()
  })

  test('should display phase banner with feedback link that goes to current URL', () => {
    const phaseBanner = document.querySelector('.govuk-phase-banner')
    expect(phaseBanner).toBeInTheDocument()

    const betaTag = getByText(phaseBanner, 'Beta')
    expect(betaTag).toBeInTheDocument()

    const feedbackLink = getByRole(phaseBanner, 'link', {
      name: /give your feedback/i
    })
    expect(feedbackLink).toBeInTheDocument()
    expect(feedbackLink).toHaveAttribute('target', '_blank')
    expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://forms.office.com/pages/responsepage.aspx?id=UCQKdycCYkyQx044U38RAjXEiYXnHG1DvkWr_VjRfzZUNERIRURNOFNVT0tXSlo1NUdONUYxQjNKUy4u&route=shorturl'
    )
  })
})
