import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { within } from '@testing-library/dom'

jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Delete site', () => {
  const getServer = setupTestServer()

  beforeEach(() => mockExemption(mockExemption))

  test('should display the delete site page', async () => {
    const document = await loadPage({
      requestUrl: `${routes.DELETE_SITE}?site=1`,
      server: getServer()
    })
    const pageHeading = within(document).getByRole('heading', {
      level: 1,
      name: 'Are you sure you want to delete this site?'
    })
    expect(pageHeading).toBeInTheDocument()

    const inset = document.querySelector('.govuk-inset-text')
    expect(inset).toHaveTextContent('Site 1')

    const backLink = within(document).getByRole('link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', routes.REVIEW_SITE_DETAILS)

    within(document).getByRole('button', {
      name: 'Yes, delete site'
    })

    const cancelLink = within(document).getByRole('link', {
      name: 'Cancel'
    })
    expect(cancelLink).toHaveAttribute('href', routes.REVIEW_SITE_DETAILS)
  })
})
