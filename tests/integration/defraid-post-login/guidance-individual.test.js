import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getByRole, within } from '@testing-library/dom'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Post-login - Individual Guidance Advice', () => {
  const getServer = setupTestServer()

  test('should show guidance page for Individual Users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.GUIDANCE_INDIVIDUAL,
      server: getServer()
    })

    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Exempt activity notification for an individual`
    })

    expect(pageHeading).toBeInTheDocument()

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toBeInTheDocument()
    expect(warningText.textContent).toContain(
      'If you do not set up your Defra account correctly your exempt activity notification will not be valid. This is because it will not be registered to the person the exemption is for.'
    )

    const lists = document.querySelectorAll('ol.govuk-list--number')
    expect(lists).toHaveLength(1)

    const list = lists[0]

    const accountLink = within(list).getByRole('link', {
      name: /Your Defra account/
    })
    expect(accountLink).toBeInTheDocument()
    expect(accountLink).toHaveAttribute('href', '#')
    expect(accountLink).toHaveClass('govuk-link')

    const listLinks = list.querySelectorAll('li')
    expect(listLinks).toHaveLength(4)

    const continueButton = getByRole(document, 'button', {
      name: 'Go to your Defra account'
    })
    expect(continueButton).toHaveAttribute('href', '#')
  })
})
