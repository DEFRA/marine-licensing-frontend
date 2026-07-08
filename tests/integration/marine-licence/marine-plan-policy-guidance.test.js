import { getByRole, queryByRole, queryByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Marine plan policy guidance page (marine licence)', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'test-marine-licence-123',
    projectName: 'Test Marine Project'
  }

  test('should display the correct content', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Marine plan policy guidance' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        name: 'How to complete the Marine plan policies section'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Supporting the policy' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        name: 'Stating the case for proceeding'
      })
    ).toBeInTheDocument()
  })

  test('should not show a back link, project name, user name or navigation links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      server: getServer()
    })

    expect(queryByRole(document, 'link', { name: 'Back' })).toBeNull()
    expect(queryByText(document, marineLicence.projectName)).toBeNull()
    expect(document.querySelector('.app-border-bottom')).toBeNull()
    expect(queryByRole(document, 'link', { name: 'Home' })).toBeNull()
    expect(queryByRole(document, 'link', { name: 'Sign out' })).toBeNull()
  })

  test('should still show the beta phase banner', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      server: getServer()
    })

    expect(document.querySelector('.govuk-phase-banner')).toBeInTheDocument()
    expect(
      getByRole(document, 'link', { name: /give your feedback/i })
    ).toBeInTheDocument()
  })

  test('should still show the page content links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      server: getServer()
    })

    expect(
      getByRole(document, 'link', {
        name: 'Explore marine plans (opens in new tab)'
      })
    ).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/explore-marine-plans'
    )
  })
})
