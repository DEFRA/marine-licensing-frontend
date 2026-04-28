import { runLoadTimeScan } from '#src/server/journey/self-service/services/data-quality.js'
import { getJourneyData } from '#src/server/journey/self-service/services/journey-data.js'

export const journeySelfServiceDataQualityInit = {
  plugin: {
    name: 'journeySelfServiceDataQualityInit',
    register(server) {
      server.events.on('start', () => {
        runLoadTimeScan(server.logger, getJourneyData())
      })
    }
  }
}
