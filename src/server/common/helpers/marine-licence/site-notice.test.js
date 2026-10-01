import {
  findSiteNoticeTask,
  loadMarineLicence,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  mockApplicationTaskContactId,
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
  it('finds the site notice task among other task types', () => {
    const task = buildTask({})
    expect(
      findSiteNoticeTask({
        applicationTasks: [{ type: 'SOMETHING_ELSE' }, task]
      })
    ).toBe(task)
  })

  it('returns undefined when there is no site notice task', () => {
    expect(findSiteNoticeTask({ applicationTasks: [] })).toBeUndefined()
    expect(findSiteNoticeTask({})).toBeUndefined()
  })
})

describe('validateEvidenceParam', () => {
  const marineLicenceId = '507f1f77bcf86cd799439011'

  it('continues when the evidence number is valid', () => {
    const h = createMockH()
    const result = validateEvidenceParam.method(
      createMockRequest({
        params: { marineLicenceId },
        query: { evidence: '1' }
      }),
      h
    )

    expect(result).toBe(h.continue)
  })

  it('redirects when the evidence number is invalid', () => {
    const h = createMockH()

    validateEvidenceParam.method(
      createMockRequest({
        params: { marineLicenceId },
        query: { evidence: '99' }
      }),
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
    )
  })
})
