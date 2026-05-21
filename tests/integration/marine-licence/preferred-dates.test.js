import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('Start and end dates', () => {
  const getServer = setupTestServer()

  test('page elements', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      preferredDates: undefined
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer()
    })

    expect(
      getByText(document, mockMarineLicenceApplication.projectName)
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What are your preferred start and end dates for the licence?'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('pre-populates form when cached dates exist', async () => {
    mockMarineLicence(mockMarineLicenceApplication)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PREFERRED_DATES,
      server: getServer()
    })

    expect(document.querySelector('#start-date-month').value).toBe('07')
    expect(document.querySelector('#start-date-year').value).toBe('2026')
    expect(document.querySelector('#end-date-month').value).toBe('08')
    expect(document.querySelector('#end-date-year').value).toBe('2027')
  })
})
