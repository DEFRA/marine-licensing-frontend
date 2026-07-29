import { within } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('Upload construction drawing (placeholder)', () => {
  mockMarineLicence(mockMarineLicenceApplication)

  const getServer = setupTestServer()

  test('displays a holding page for the not-yet-built upload journey', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=1&activity=1`,
      server: getServer()
    })

    within(document).getByRole('heading', {
      level: 1,
      name: 'Upload a construction drawing'
    })

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      '/marine-licence/review-site-details#activity-details-site-1-activity-1'
    )
  })
})
