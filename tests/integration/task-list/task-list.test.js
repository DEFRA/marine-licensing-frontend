import { getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Task List', () => {
  const getServer = setupTestServer()
  let document

  beforeEach(async () => {
    const exemption = {
      id: 'test-exemption-123',
      projectName: 'Test Project',
      taskList: []
    }
    mockExemption(exemption)
    document = await loadPage({
      requestUrl: routes.TASK_LIST,
      server: getServer()
    })
  })

  test('should render task list page elements', () => {
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Test Project'
    )

    expect(
      getByText(
        document,
        'You must complete each section before you can send us your information.'
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
