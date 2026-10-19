import { vi } from 'vitest'
import {
  fetchConsultations,
  formatConsultationsForDisplay,
  getConsultationStatusCell
} from './utils.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { mockConsultations } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#fetchConsultations', () => {
  const request = {}

  test('Should request consultations and return the value', async () => {
    vi.mocked(authenticatedGetRequest).mockResolvedValueOnce({
      payload: { value: { consultations: mockConsultations } }
    })

    const result = await fetchConsultations(request)

    expect(authenticatedGetRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.GET_CONSULTATIONS
    )
    expect(result).toEqual(mockConsultations)
  })

  test('Should return an empty array when there is no value', async () => {
    vi.mocked(authenticatedGetRequest).mockResolvedValueOnce({ payload: {} })

    expect(await fetchConsultations(request)).toEqual([])
  })
})

describe('#formatConsultationsForDisplay', () => {
  test('Should format a consultation with all fields', () => {
    const result = formatConsultationsForDisplay([
      {
        projectName: 'Test Project',
        consultationType: 'REQUEST_FOR_ADVICE',
        applicationReference: 'MLA/2026/10001',
        consultationStatus: 'NO_RESPONSE_NEEDED',
        consultationStartDate: '2026-01-15'
      }
    ])

    expect(result).toEqual([
      {
        cells: [
          { text: 'Test Project' },
          { text: 'Request for advice' },
          { text: 'MLA/2026/10001' },
          {
            html: '<strong class="govuk-tag govuk-tag--grey">No response needed</strong>'
          },
          { text: '15 Jan 2026' }
        ]
      }
    ])
  })

  test('Should show placeholders when type, reference, status and date are missing', () => {
    const [{ cells }] = formatConsultationsForDisplay([
      { projectName: 'Test Project' }
    ])

    expect(cells).toEqual([
      { text: 'Test Project' },
      { text: '-' },
      { text: '-' },
      { text: '-' },
      { text: '-' }
    ])
  })

  test('Should return an empty array when there are no consultations', () => {
    expect(formatConsultationsForDisplay([])).toEqual([])
  })
})

describe('#getConsultationStatusCell', () => {
  test('Should render Response needed as a default tag', () => {
    expect(getConsultationStatusCell('RESPONSE_NEEDED')).toEqual({
      html: '<strong class="govuk-tag">Response needed</strong>'
    })
  })

  test('Should render No response needed as a grey tag', () => {
    expect(getConsultationStatusCell('NO_RESPONSE_NEEDED')).toEqual({
      html: '<strong class="govuk-tag govuk-tag--grey">No response needed</strong>'
    })
  })

  test('Should render a placeholder for an unknown status', () => {
    expect(getConsultationStatusCell('UNKNOWN')).toEqual({ text: '-' })
  })
})
