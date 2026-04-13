import { vi } from 'vitest'
import { iatStartController } from '#src/server/journey/self-service/start/controller.js'

describe('#iatStartController', () => {
  test('Should call h.view with expected template path and view model', () => {
    const h = { view: vi.fn() }

    iatStartController.handler({}, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith('journey/self-service/start/index', {
      pageTitle: 'Check if you need a marine licence',
      links: {
        jurisdiction:
          'https://www.gov.uk/guidance/marine-licensing-definitions#jurisdiction',
        exemptions:
          'https://www.gov.uk/guidance/do-i-need-a-marine-licence#exemptions',
        selfService:
          'https://www.gov.uk/guidance/do-i-need-a-marine-licence#self-service',
        guidance: 'https://www.gov.uk/guidance/do-i-need-a-marine-licence'
      }
    })
  })
})
