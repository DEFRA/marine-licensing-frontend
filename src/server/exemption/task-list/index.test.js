import { taskListRoutes } from '~/src/server/exemption/task-list/index.js'

describe('taskList routes', () => {
  test('get route is formatted correctly', () => {
    expect(taskListRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/task-list'
      })
    )
    expect(taskListRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/task-list/{exemptionId}'
      })
    )
  })
})
