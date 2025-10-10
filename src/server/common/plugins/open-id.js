import { createEntraIdStrategy } from '#src/server/common/plugins/auth/entra-id-strategy.js'
import { createDefraIdStrategy } from '#src/server/common/plugins/auth/defra-id-strategy.js'
import { createSessionStrategy } from '#src/server/common/plugins/auth/session-strategy.js'

export const openId = {
  plugin: {
    name: 'auth',
    register: async (server) => {
      await createDefraIdStrategy(server)

      await createEntraIdStrategy(server)

      createSessionStrategy(server)
    }
  }
}
