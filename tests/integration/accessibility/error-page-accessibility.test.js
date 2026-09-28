// @vitest-environment jsdom
import Boom from '@hapi/boom'
import { JSDOM } from 'jsdom'
import { runAxeChecks } from '~/.vite/axe-helper.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '../shared/test-setup-helpers.js'

describe('Error page accessibility', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    getServer().route({
      method: 'GET',
      path: '/test-accessibility-boom-500',
      options: { auth: false },
      handler() {
        throw Boom.internal('test failure')
      }
    })
  })

  test.each([
    {
      title: 'Page not found',
      url: '/this-page-does-not-exist-for-testing',
      status: statusCodes.notFound
    },
    {
      title: 'There is a problem with the service',
      url: '/test-accessibility-boom-500',
      status: statusCodes.internalServerError
    }
  ])('"$title" page', async ({ url, status }) => {
    const response = await getServer().inject({ method: 'GET', url })

    expect(response.statusCode).toBe(status)
    const { document } = new JSDOM(response.result).window
    await runAxeChecks(document.documentElement)
  })
})
