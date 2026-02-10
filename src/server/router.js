import inert from '@hapi/inert'

import { health } from '#src/server/health/index.js'
import { home } from '#src/server/home/index.js'
import { serveStaticFiles } from '#src/server/common/helpers/serve-static-files.js'
import { about } from '#src/server/about/index.js'
import { exemption } from '#src/server/exemption/index.js'
import { marineLicense } from '#src/server/marine-license/index.js'
import { serviceHome } from '#src/server/service-home/index.js'
import { auth } from '#src/server/auth/index.js'
import { help } from '#src/server/help/index.js'
import { browserLogs } from '#src/server/browser-logs/index.js'
import { internalUserAdmin } from '#src/server/internal-user-admin/index.js'
import { defraIdGuidance } from '#src/server/defraid-guidance/index.js'
export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Browser error logging API
      await server.register([browserLogs])

      // Application specific routes, add your own routes here
      await server.register([
        exemption,
        about,
        home,
        auth,
        help,
        defraIdGuidance,
        internalUserAdmin,
        marineLicense,
        serviceHome
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
