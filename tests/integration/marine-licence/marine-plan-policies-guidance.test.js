import { getByRole } from '@testing-library/dom'
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
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE,
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
      getByRole(document, 'heading', { name: 'Policy walkthrough' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Mitigation hierarchy' })
    ).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
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
