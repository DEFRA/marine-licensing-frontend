import {
  getByRole,
  getByText,
  queryByRole,
  queryByText
} from '@testing-library/dom'
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
      getByRole(document, 'heading', { name: 'Marine plan policies guidance' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        name: 'How to complete the Marine plan policies section'
      })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Policy walkthrough' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Mitigation hierarchy' })
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Avoiding may include changing the location, method, timing, of a proposal, potentially including buffers or exclusion zones. It is often easiest to achieve when designing a proposal so that the impact does not occur.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Minimising impacts could include considering the location, methodology, timing, re-use of infrastructure, or layout of the proposal.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'The inclusion of this information does not indicate that approval of the proposal will follow by default. Approval will also depend on other material considerations which may include, for example, other plans.'
      )
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
      getByRole(document, 'link', { name: 'Explore Marine Plans' })
    ).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/explore-marine-plans'
    )
    expect(
      getByRole(document, 'link', { name: 'Using marine plans' })
    ).toHaveAttribute('href', 'https://www.gov.uk/guidance/using-marine-plans')
  })
})
