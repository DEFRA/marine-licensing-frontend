import { taskListRoutes } from '#src/server/marine-licence/task-list/index.js'

describe('taskList routes', () => {
  test('get route is formatted correctly', () => {
    expect(taskListRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/marine-licence/task-list'
      })
    )
  })
})
