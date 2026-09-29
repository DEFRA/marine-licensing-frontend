import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Site notice display page (marine licence)', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: '64f1a2b3c4d5e6f7a8b9c0d1',
    projectName: 'Test Marine Project',
    applicationReference: 'MLA/2026/10264'
  }

  test('should display the correct content', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicence.id}`,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Display a site notice' })
    ).toBeInTheDocument()
    expect(
      getByText(document, 'MLA/2026/10264 - Test Marine Project')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'You must publish one or more site notices to tell people about your application. This gives people who may be affected by, or interested in, the proposed activity the chance to comment.'
      )
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Notices should be placed in locations chosen to best bring the proposed application to the attention of the public and interested parties. Consider locations such as those below.'
      )
    ).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicence.id}`,
      server: getServer()
    })

    const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicence.id}`

    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      expectedViewDetailsUrl
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      expectedViewDetailsUrl
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      expectedViewDetailsUrl
    )
  })
})
