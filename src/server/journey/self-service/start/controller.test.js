import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/session-answers.js')

import {
  iatStartController,
  iatStartPostController
} from '#src/server/journey/self-service/start/controller.js'
import { clearAnswers } from '#src/server/journey/self-service/services/session-answers.js'

describe('iatStartController', () => {
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

describe('#iatStartPostController', () => {
  test('clears answers and redirects to first question', () => {
    const request = {}
    const h = { redirect: vi.fn() }

    iatStartPostController.handler(request, h)

    expect(clearAnswers).toHaveBeenCalledWith(request)
    expect(h.redirect).toHaveBeenCalledWith('/journey/self-service/sea')
  })
})
