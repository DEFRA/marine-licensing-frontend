import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getByRole, within } from '@testing-library/dom'
import { beforeAll } from 'vitest'
import { citizenUserSession } from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Post-login - Confirm Individual', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)
  })

  it('should display page for Confirming Individual users', async () => {
    const document = await loadPage({
      requestUrl: routes.postLogin.CONFIRM_INDIVIDUAL,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: `Confirm you're notifying us as ${citizenUserSession.displayName} for a personal project`
    })
    expect(pageHeading).toBeInTheDocument()

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toBeInTheDocument()
    expect(warningText.textContent).toContain(
      "This Defra account is for an individual. This means the exempt activity notification will be in your name personally, not an organisation's name."
    )

    const yesRadio = getByRole(document, 'radio', {
      name: "Yes, I'm notifying you about a personal project"
    })
    const noRadio = getByRole(document, 'radio', {
      name: "No, I'm notifying you for an organisation"
    })

    expect(yesRadio).not.toBeChecked()
    expect(noRadio).not.toBeChecked()
  })
})
