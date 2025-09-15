import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

jest.mock('~/src/server/common/plugins/auth/utils.js')

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
        text: 'Projects',
        href: '/home'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', async () => {
    expect(await buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        active: false,
        text: 'Projects',
        href: '/home'
      }
    ])
  })

  test('Should mark Projects Home as active when on dashboard page', async () => {
    const request = { path: '/home' }
    const navigation = await buildNavigation(request)

    const projectsHomeLink = navigation.find((item) => item.text === 'Projects')
    expect(projectsHomeLink.active).toBe(true)
  })

  test('Should mark Projects Home as inactive when not on dashboard page', async () => {
    const request = { path: '/exemption/project-name' }
    const navigation = await buildNavigation(request)

    const projectsHomeLink = navigation.find((item) => item.text === 'Projects')
    expect(projectsHomeLink.active).toBe(false)
  })

  test('Should include a Sign out nav link if user is authenticated', async () => {
    jest.mocked(getUserSession).mockResolvedValue({})
    expect(await buildNavigation(mockRequest({ path: '/home' }))).toEqual(
      expect.arrayContaining([
        {
          href: '/sign-out',
          text: 'Sign out'
        }
      ])
    )
  })

  test('Should not include a Sign out nav link if user is not authenticated', async () => {
    jest.mocked(getUserSession).mockResolvedValue(null)
    expect(await buildNavigation(mockRequest({ path: '/home' }))).toEqual(
      expect.not.arrayContaining([
        {
          href: '/sign-out',
          text: 'Sign out'
        }
      ])
    )
  })

  test('should add a Defra account nav item if user authenticated with Defra ID', async () => {
    jest.mocked(getUserSession).mockResolvedValue({ strategy: 'defra-id' })
    expect(await buildNavigation(mockRequest({ path: '/home' }))).toEqual(
      expect.arrayContaining([
        {
          text: 'Defra account',
          href: '#'
        }
      ])
    )
  })

  test('should not add a Defra account nav item if user not authenticated with Defra ID', async () => {
    jest.mocked(getUserSession).mockResolvedValue({ strategy: 'other' })
    expect(await buildNavigation(mockRequest({ path: '/home' }))).toEqual(
      expect.not.arrayContaining([
        {
          text: 'Defra account',
          href: '#'
        }
      ])
    )
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
