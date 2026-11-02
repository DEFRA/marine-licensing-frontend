import { vi } from 'vitest'
import { fetchConsultation } from './fetch-consultation.js'
import { authenticatedGetRequest } from '#src/server/common/helpers/authenticated-requests.js'
import { apiRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceWithConsultationApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('#fetchConsultation', () => {
  const { consultation } = mockMarineLicenceWithConsultationApplication
  const marineLicenceId = consultation.id
  const request = { params: { marineLicenceId } }

  test('Should fetch and return the consultation', async () => {
    vi.mocked(authenticatedGetRequest).mockResolvedValueOnce({
      payload: { value: { consultation } }
    })

    const result = await fetchConsultation(request, marineLicenceId)

    expect(authenticatedGetRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.GET_CONSULTATION.replace('{marineLicenceId}', marineLicenceId)
    )
    expect(result).toEqual(consultation)
  })

  test('Should return undefined when no payload is returned', async () => {
    vi.mocked(authenticatedGetRequest).mockResolvedValueOnce({})

    expect(await fetchConsultation(request, marineLicenceId)).toBeUndefined()
  })
})
