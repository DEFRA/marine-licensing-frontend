import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockExemption as mockExemptionData } from '~/src/server/test-helpers/mocks/exemption.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

describe('withdraw exemption', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(mockExemptionData))

  test('should display the withdraw site page', async () => {
    const document = await loadPage({
      requestUrl: routes.WITHDRAW_EXEMPTION,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Are you sure you want to withdraw this project?'
    })
    expect(pageHeading).toBeInTheDocument()

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent(
      `Exempt activity notification: ${mockExemptionData.projectName}`
    )

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.DASHBOARD)

    within(document).getByRole('button', {
      name: 'Yes, withdraw project'
    })

    const cancelLink = within(document).getByRole('link', {
      name: 'Cancel'
    })
    expect(cancelLink).toHaveAttribute('href', routes.DASHBOARD)
  })
})
