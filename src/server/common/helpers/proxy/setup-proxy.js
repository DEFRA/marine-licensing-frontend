import Http from 'node:http'
import Https from 'node:https'
import Wreck from '@hapi/wreck'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { config } from '#src/config/config.js'

const logger = createLogger()

export function setupProxy() {
  if (config.get('httpProxy')) {
    logger.info('Routing outbound requests via proxy')
    // Required for Wreck — Node env proxy (NODE_USE_ENV_PROXY) is not used otherwise
    Wreck.agents.http = Http.globalAgent
    Wreck.agents.https = Https.globalAgent
  }
}
