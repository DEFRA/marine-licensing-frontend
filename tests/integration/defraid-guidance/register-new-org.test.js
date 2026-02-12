import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

describe('Guidance - Register new organisation', () => {
  const getServer = setupTestServer()

  it('should display page "Create a new Defra account for your organisation"', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.REGISTER_NEW_ORG,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Create a new Defra account for your organisation'
    })
    expect(pageHeading).toBeInTheDocument()
    expect(
      within(document).getByRole('link', { name: 'Back' })
    ).toHaveAttribute('href', '/guidance/check-setup-employee')
  })

  it('should have a continue button linking to signin', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.REGISTER_NEW_ORG,
      server: getServer()
    })
    expect(
      within(document).getByRole('button', { name: 'Continue' })
    ).toHaveAttribute('href', '/signin')
  })

  it('should have a guidance link that opens in a new tab', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.REGISTER_NEW_ORG,
      server: getServer()
    })
    const guidanceLink = within(document).getByRole('link', {
      name: /How to create a Defra account/
    })
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/creating-a-defra-account'
    )
    expect(guidanceLink).toHaveAttribute('target', '_blank')
    expect(guidanceLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
