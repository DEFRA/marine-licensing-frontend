import Boom from '@hapi/boom'

export const notFound = {
  plugin: {
    name: 'not-found',
    register(server) {
      server.route({
        method: 'GET',
        path: '/{any*}',
        options: {
          // 'try' populates credentials for a valid session without redirecting when there is none,
          // so the 404 page is fully signed-in or fully signed-out. The cookie scheme's redirectTo is
          // disabled because it runs before the auth mode is checked and would record the unknown URL
          // as the post-sign-in destination.
          auth: { mode: 'try' },
          plugins: { cookie: { redirectTo: false } }
        },
        handler() {
          throw Boom.notFound()
        }
      })
    }
  }
}
