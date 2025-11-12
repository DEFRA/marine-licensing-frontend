import process from 'node:process'

import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { startServer } from '#src/server/common/helpers/start-server.js'

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = createLogger()
  logger.info('Unhandled rejection detected')

  // Log with ECS format structure for proper error tracking
  logger.error(
    {
      error: {
        message: error?.message || String(error),
        stack_trace: error?.stack,
        type: error?.name || error?.constructor?.name || 'UnhandledRejection'
      }
    },
    'Unhandled rejection error'
  )

  process.exitCode = 1
})
