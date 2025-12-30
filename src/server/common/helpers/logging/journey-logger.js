export const journeyLogger = {
  plugin: {
    name: 'journey-logger',
    register(server) {
      server.ext('onPostAuth', (request, h) => {
        if (request.yar?.id && request.logger?.setBindings) {
          request.logger.setBindings({
            'transaction.id': request.yar.id
          })
        }
        return h.continue
      })
    }
  }
}
