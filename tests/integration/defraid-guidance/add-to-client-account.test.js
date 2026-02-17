import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

describe('Guidance - Intermediary needs to be added to client account', () => {
  const getServer = setupTestServer()

  it('should display page heading', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'You need to be added to your client\u2019s Defra account'
    })
    expect(pageHeading).toBeInTheDocument()
  })

  it('should have a back link to check-setup-client', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute(
      'href',
      routes.defraIdGuidance.CHECK_SETUP_CLIENT
    )
  })

  it('should have a link to Sign in', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const link = within(document).getByRole('link', {
      name: /Sign in to or create a Defra account/
    })
    expect(link).toHaveAttribute('href', '/')
  })

  it('should have a guidance link to creating a Defra account', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const guidanceLink = within(document).getByRole('link', {
      name: 'How to create a Defra account'
    })
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/creating-a-defra-account'
    )
  })

  it('should have a guidance link to adding users to a Defra account', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const guidanceLink = within(document).getByRole('link', {
      name: /How to add users to a Defra account/
    })
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/adding-users-to-a-defra-account-as-an-admin'
    )
  })

  it('should not have a continue button', async () => {
    const document = await loadPage({
      requestUrl: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })
    const continueButton = within(document).queryByRole('button', {
      name: 'Continue'
    })
    expect(continueButton).not.toBeInTheDocument()
  })
})
