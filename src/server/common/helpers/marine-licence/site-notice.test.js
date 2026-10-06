import {
  findSiteNoticeTask,
  getSiteNoticeEvidence,
  loadMarineLicence,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceApplication,
  mockMarineLicenceWithApplicationTask
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

const buildTask = (data) => ({
  taskId: 'task-1',
  type: APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE,
  data
})

describe('loadMarineLicence', () => {
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id
  const getMarineLicenceById = vi.fn()

  beforeEach(() => {
    getMarineLicenceById.mockResolvedValue(mockMarineLicenceWithApplicationTask)
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById
    })
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  test('returns the licence for the original submitter', async () => {
    const request = createMockRequest({ params: { marineLicenceId } })

    await expect(loadMarineLicence(request)).resolves.toEqual({
      marineLicence: mockMarineLicenceWithApplicationTask,
      marineLicenceId
    })
    expect(getMarineLicenceById).toHaveBeenCalledWith(marineLicenceId)
  })

  test('throws when the caller did not submit the application', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

    await expect(
      loadMarineLicence(createMockRequest({ params: { marineLicenceId } }))
    ).rejects.toThrow(
      'Only the person who submitted the application can view its notifications'
    )
  })
})

describe('findSiteNoticeTask', () => {
  test('finds the site notice task among other task types', () => {
    const task = buildTask({})
    expect(
      findSiteNoticeTask({
        applicationTasks: [{ type: 'SOMETHING_ELSE' }, task]
      })
    ).toBe(task)
  })

  test('returns undefined when there is no site notice task', () => {
    expect(findSiteNoticeTask({ applicationTasks: [] })).toBeUndefined()
    expect(findSiteNoticeTask({})).toBeUndefined()
  })
})

describe('validateEvidenceParam', () => {
  const marineLicenceId = mockMarineLicenceWithApplicationTask.id
  const getMarineLicenceById = vi.fn()

  beforeEach(() => {
    getMarineLicenceById.mockResolvedValue(mockMarineLicenceWithApplicationTask)
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById
    })
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  const runHandler = async (
    evidence,
    marineLicence = mockMarineLicenceWithApplicationTask
  ) => {
    getMarineLicenceById.mockResolvedValue(marineLicence)
    const request = createMockRequest({
      params: { marineLicenceId },
      query: evidence === undefined ? {} : { evidence }
    })
    const h = createMockH()
    const result = await validateEvidenceParam.method(request, h)

    return { request, h, result }
  }

  test('continues for an existing row and stores the licence on the request', async () => {
    const { request, h, result } = await runHandler('1')

    expect(result).toBe(h.continue)
    expect(request.marineLicence).toBe(mockMarineLicenceWithApplicationTask)
    expect(getMarineLicenceById).toHaveBeenCalledTimes(1)
  })

  test('continues for a second saved row', async () => {
    const marineLicence = {
      ...mockMarineLicenceWithApplicationTask,
      siteNoticeEvidence: [{}, {}]
    }
    const { h, result } = await runHandler('2', marineLicence)

    expect(result).toBe(h.continue)
  })

  test.each(['0', '99', undefined])(
    'redirects when the evidence number is %s',
    async (evidence) => {
      const { h } = await runHandler(evidence)

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
      )
    }
  )
})

describe('getSiteNoticeEvidence', () => {
  test('correctly returns evidence', () => {
    const result = getSiteNoticeEvidence(
      mockMarineLicenceWithApplicationTask,
      1
    )
    expect(result).toEqual(
      mockMarineLicenceWithApplicationTask.siteNoticeEvidence[0]
    )
  })

  test('correctly returns empty object for incorrect index', () => {
    const result = getSiteNoticeEvidence(
      mockMarineLicenceWithApplicationTask,
      10
    )
    expect(result).toEqual({})
  })

  test('correctly returns empty object for empty evidence array', () => {
    const result = getSiteNoticeEvidence(mockMarineLicenceApplication, 1)
    expect(result).toEqual({})
  })
})
