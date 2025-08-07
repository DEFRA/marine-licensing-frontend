import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'

/**
 * @param {Partial<Request>} [options]
 */
function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', async () => {
    expect(
      await buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        active: false,
        text: 'Projects home',
        href: '/home'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', async () => {
    expect(await buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        active: false,
        text: 'Projects home',
        href: '/home'
      }
    ])
  })

  test('Should mark Projects Home as active when on dashboard page', async () => {
    const request = { path: '/home' }
    const navigation = await buildNavigation(request)

    const projectsHomeLink = navigation.find(
      (item) => item.text === 'Projects home'
    )
    expect(projectsHomeLink.active).toBe(true)
  })

  test('Should mark Projects Home as inactive when not on dashboard page', async () => {
    const request = { path: '/exemption/project-name' }
    const navigation = await buildNavigation(request)

    const projectsHomeLink = navigation.find(
      (item) => item.text === 'Projects home'
    )
    expect(projectsHomeLink.active).toBe(false)
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
