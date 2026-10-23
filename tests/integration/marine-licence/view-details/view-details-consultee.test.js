import { getByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { mockSubmittedMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { authenticatedGetRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { consulteeSession } from '~/tests/integration/shared/session-fixtures.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Marine Licence View Details - consultee', () => {
  const getServer = setupTestServer()
  const { id, projectName } = mockSubmittedMarineLicenceApplication
  let document

  beforeEach(async () => {
    mockMarineLicence(mockSubmittedMarineLicenceApplication)
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${id}`,
      server: getServer(),
      auth: { credentials: consulteeSession }
    })
    document = new JSDOM(response.result).window.document
  })

  test('fetches the marine licence from the consultation endpoint', () => {
    expect(authenticatedGetRequest).toHaveBeenCalledWith(
      expect.anything(),
      `/marine-licence/consultation/${id}/details`
    )

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      projectName
    )

    expect(document.querySelector('.govuk-back-link')).toBeNull()
  })

  test.each([
    ['fee estimate', '#fee-estimate-card'],
    ['invoicing', '#invoicing-card'],
    ['public register', '#public-register-card']
  ])('does not render the applicant-only %s card', (_name, selector) => {
    expect(document.querySelector(selector)).toBeNull()
  })
})
