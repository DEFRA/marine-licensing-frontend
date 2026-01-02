import { browserLogsController } from '#src/server/browser-logs/controller.js'

export const browserLogs = {
  plugin: {
    name: 'browser_logs',
    register(server) {
      server.route({
        method: 'POST',
        path: '/api/browser-logs',
        ...browserLogsController
      })
    }
  }
}
