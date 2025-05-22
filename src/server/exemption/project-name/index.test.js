import { projectNameRoutes } from '~/src/server/exemption/project-name/index.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('projectNameRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(projectNameRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: routes.PROJECT_NAME
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(projectNameRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: routes.PROJECT_NAME
      })
    )
  })
})
