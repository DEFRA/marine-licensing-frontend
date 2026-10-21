import {
  loadResubmissionTask,
  validateResubmissionLocation,
  validateResubmissionParams
} from '#src/server/common/helpers/marine-licence/site-notice-resubmission.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithResubmissionTask,
  mockResubmissionTaskId,
  mockResubmittedMarineLicence
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

const marineLicenceId = mockMarineLicenceWithResubmissionTask.id
const taskUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${mockResubmissionTaskId}`
const params = { marineLicenceId, taskId: mockResubmissionTaskId }

describe('validateResubmissionParams', () => {
  const schema = validateResubmissionParams.validate.params

  test('accepts a marine licence id and task id', () => {
    expect(schema.validate(params).error).toBeUndefined()
  })

  test('rejects params without a taskId', () => {
    expect(schema.validate({ marineLicenceId }).error).toBeDefined()
  })
})

describe('loadResubmissionTask', () => {
  const getMarineLicenceById = vi.fn()

  beforeEach(() => {
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById
    })
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  const runHandler = async (marineLicence, taskId = mockResubmissionTaskId) => {
    getMarineLicenceById.mockResolvedValue(marineLicence)
    const request = createMockRequest({ params: { marineLicenceId, taskId } })
    const h = createMockH()
    const result = await loadResubmissionTask.method(request, h)

    return { request, h, result }
  }

  test('stores the licence and the task on the request', async () => {
    const { request, h, result } = await runHandler(
      mockMarineLicenceWithResubmissionTask
    )

    expect(result).toBe(h.continue)
    expect(request.marineLicence).toBe(mockMarineLicenceWithResubmissionTask)
    expect(request.resubmissionTask).toBe(
      mockMarineLicenceWithResubmissionTask.applicationTasks[1]
    )
  })

  test('redirects to view details for a task that is not a resubmission', async () => {
    const { h } = await runHandler(
      mockMarineLicenceWithResubmissionTask,
      mockMarineLicenceWithResubmissionTask.applicationTasks[0].taskId
    )

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    )
  })
})

describe('validateResubmissionLocation', () => {
  const runHandler = (location, marineLicence) => {
    const request = createMockRequest({
      params,
      query: { location },
      resubmissionTask: marineLicence.applicationTasks[1]
    })
    const h = createMockH()
    const result = validateResubmissionLocation.method(request, h)

    return { h, result }
  }

  test('continues for a location the caseworker rejected', () => {
    const { h, result } = runHandler('4', mockMarineLicenceWithResubmissionTask)

    expect(result).toBe(h.continue)
  })

  test.each([
    ['a location that was not rejected', '2'],
    ['a missing location', undefined]
  ])('redirects to the task page for %s', (_label, location) => {
    const { h } = runHandler(location, mockMarineLicenceWithResubmissionTask)

    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })

  test('redirects to the task page once the task is resolved', () => {
    const { h } = runHandler('4', mockResubmittedMarineLicence)

    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })
})
