import { vi } from 'vitest'
import { getAllByRole, getByRole, getByText } from '@testing-library/dom'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockConsultations } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  consulteeSession,
  employeeSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Consultations', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(consulteeSession)
  })

  const loadConsultationsPage = () =>
    loadPage({
      requestUrl: routes.CONSULTATIONS,
      server: getServer()
    })

  test('page elements', async () => {
    mockMarineLicence({ consultations: mockConsultations })

    const document = await loadConsultationsPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Consultations'
    )

    const table = getByRole(document, 'table', { name: 'Consultations' })
    const headers = getAllByRole(table, 'columnheader').map((header) =>
      header.textContent.trim()
    )
    expect(headers).toEqual([
      'Application name',
      'Type',
      'Reference',
      'Status',
      'Received'
    ])

    const [, firstRow] = getAllByRole(table, 'row')
    const cells = getAllByRole(firstRow, 'cell').map((cell) =>
      cell.textContent.trim()
    )
    expect(cells).toEqual([
      'Harbour wall repair',
      'Application notification',
      'MLA/2026/10001',
      'Response needed',
      '1 Oct 2026'
    ])
  })

  test('shows the empty message when there are no consultations', async () => {
    mockMarineLicence({ consultations: [] })

    const document = await loadConsultationsPage()

    expect(
      getByText(document, 'There are no consultations to display.')
    ).toBeInTheDocument()
  })

  test('redirects users who are not consultees', async () => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
    mockMarineLicence({ consultations: mockConsultations })

    const response = await makeGetRequest({
      url: routes.CONSULTATIONS,
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(routes.SERVICE_HOME)
  })
})
