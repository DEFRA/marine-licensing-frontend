import { getByRole, getByText } from '@testing-library/dom'
import {
  marineLicenceRoutes,
  routes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'

describe('Fee estimate are you sure', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Are you sure you do not accept the fee estimate?'
    )
    expect(getByRole(document, 'button', { name: 'Finish' })).toHaveAttribute(
      'href',
      routes.DASHBOARD
    )
    expect(
      getByRole(document, 'link', { name: 'Go back to fee estimate' })
    ).toHaveAttribute('href', marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE)
  })

  test('warning text and body content', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE_ARE_YOU_SURE,
      server: getServer()
    })

    const warningText = document.querySelector('.govuk-warning-text__text')
    expect(warningText).toHaveTextContent(
      'If you do not accept the fee estimate you will not be able to submit your application.'
    )
    expect(
      getByText(document, (content) =>
        content.includes(
          'The information provided will be saved as a draft in this account.'
        )
      )
    ).toBeInTheDocument()
    expect(
      getByText(document, (content) =>
        content.includes(
          'You can come back later to accept the fee estimate if you need to submit your application.'
        )
      )
    ).toBeInTheDocument()
  })
})
