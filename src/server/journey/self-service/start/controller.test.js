import { describe, test, expect, vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getFirstQuestionRoute: vi.fn(() => '/sea')
}))

const { iatStartController } =
  await import('#src/server/journey/self-service/start/controller.js')

describe('iatStartController', () => {
  test('passes firstQuestionRoute to the view', () => {
    const viewData = {}
    const h = {
      view: (_template, data) => {
        Object.assign(viewData, data)
        return 'rendered'
      }
    }

    iatStartController.handler({}, h)

    expect(viewData.firstQuestionRoute).toBe('/journey/self-service/sea')
  })

  test('Should call h.view with expected template path and view model', () => {
    const h = { view: vi.fn() }

    iatStartController.handler({}, h)

    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith('journey/self-service/start/index', {
      pageTitle: 'Check if you need a marine licence',
      firstQuestionRoute: '/journey/self-service/sea',
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
