import { findSiteNoticeTask } from '#src/server/common/helpers/marine-licence/site-notice.js'
import { APPLICATION_TASK_TYPE } from '#src/server/common/helpers/marine-licence/application-tasks/registry.js'

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
