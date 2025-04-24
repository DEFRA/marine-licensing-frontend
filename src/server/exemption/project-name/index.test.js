import { projectNameRoutes } from '~/src/server/exemption/project-name/index.js'

describe('projectNameRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(projectNameRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/project-name'
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(projectNameRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/project-name'
      })
    )
  })
})
