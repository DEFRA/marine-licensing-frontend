import {
  findSiteNoticeTask,
  validateEvidenceParam
} from '#src/server/common/helpers/marine-licence/site-notice.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

const buildTask = (data) => ({
  taskId: 'task-1',
  type: APPLICATION_TASK_TYPE.PUBLIC_SITE_NOTICE,
  data
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
