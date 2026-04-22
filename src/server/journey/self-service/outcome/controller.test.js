import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/session-answers.js')

import {
  outcomeController,
  outcomePostController
} from '#src/server/journey/self-service/outcome/controller.js'
import {
  getOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  getSection,
  isIntermediateOutcome
} from '#src/server/journey/self-service/services/journey-data.js'
import {
  getBackLink,
  pushOutcomeSelection
} from '#src/server/journey/self-service/services/session-answers.js'

const mockOutcome = {
  route: '/construction/journey-select',
  heading: 'Marine licence may be required',
  text: '<b>Please select the service you require.</b>',
  section: 'doINeedAMarineLicenceConstruction',
  outcomeTypes: [
    'WO_CON_EXEMPTION_JOURNEY',
    'WO_CON_SELF_SERVICE_JOURNEY',
    'WO_STANDARD_MLA'
  ]
}

const mockSection = {
  id: 'doINeedAMarineLicenceConstruction',
  text: 'Construction activity'
}

const otExemption = {
  id: 'WO_CON_EXEMPTION_JOURNEY',
  heading: 'Check to see if an exemption applies',
  text: '<p>body</p>',
  nextQuestionRoute: '/exemption/construction'
}

const otSelfService = {
  id: 'WO_CON_SELF_SERVICE_JOURNEY',
  heading: 'Check self-service',
  text: '<p>body</p>',
  nextQuestionRoute: '/construction/activity'
}

const otStandard = {
  id: 'WO_STANDARD_MLA',
  heading: 'Apply for a standard marine licence',
  text: '<p>body</p>',
  module: 'MMO_APP2_CONTROL'
}

describe('#outcomeController', () => {
  beforeEach(() => {
    vi.mocked(getOutcome).mockReturnValue(mockOutcome)
    vi.mocked(getSection).mockReturnValue(mockSection)
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      otExemption,
      otSelfService,
      otStandard
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)
    vi.mocked(getBackLink).mockReturnValue(
      '/journey/self-service/activity-type'
    )
  })

  test('renders the intermediate outcome view model', () => {
    const request = { params: { outcomePath: 'construction/journey-select' } }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(getOutcome).toHaveBeenCalledWith('/construction/journey-select')
    expect(isIntermediateOutcome).toHaveBeenCalledWith(mockOutcome)
    expect(getBackLink).toHaveBeenCalledWith(
      request,
      '/construction/journey-select',
      'outcome'
    )
    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({
        pageTitle: 'Marine licence may be required',
        outcome: mockOutcome,
        section: mockSection,
        options: [
          {
            id: 'WO_CON_EXEMPTION_JOURNEY',
            heading: 'Check to see if an exemption applies',
            text: '<p>body</p>',
            isTerminal: false
          },
          {
            id: 'WO_CON_SELF_SERVICE_JOURNEY',
            heading: 'Check self-service',
            text: '<p>body</p>',
            isTerminal: false
          },
          {
            id: 'WO_STANDARD_MLA',
            heading: 'Apply for a standard marine licence',
            text: '<p>body</p>',
            isTerminal: true
          }
        ],
        backLink: '/journey/self-service/activity-type'
      })
    )
  })

  test('throws Boom.notFound for an unknown outcome route', () => {
    vi.mocked(getOutcome).mockReturnValue(null)
    const request = { params: { outcomePath: 'nope' } }
    const h = { view: vi.fn() }

    expect(() => outcomeController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('throws Boom.notFound for a terminal outcome', () => {
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)
    const request = { params: { outcomePath: 'licence-not-required' } }
    const h = { view: vi.fn() }

    expect(() => outcomeController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('passes null section when outcome has no section', () => {
    vi.mocked(getOutcome).mockReturnValue({
      ...mockOutcome,
      section: undefined
    })
    vi.mocked(getSection).mockReturnValue(null)
    const request = { params: { outcomePath: 'construction/journey-select' } }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({ section: null })
    )
  })
})

describe('#outcomePostController', () => {
  beforeEach(() => {
    vi.mocked(getOutcome).mockReturnValue(mockOutcome)
    vi.mocked(isIntermediateOutcome).mockReturnValue(true)
    vi.mocked(getOutcomeType).mockImplementation((id) => {
      if (id === 'WO_CON_EXEMPTION_JOURNEY') return otExemption
      if (id === 'WO_CON_SELF_SERVICE_JOURNEY') return otSelfService
      if (id === 'WO_STANDARD_MLA') return otStandard
      return null
    })
    vi.mocked(pushOutcomeSelection).mockReturnValue(undefined)
  })

  test('redirects to next question and records the outcome selection', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' }
    }
    const h = { redirect: vi.fn() }

    outcomePostController.handler(request, h)

    expect(pushOutcomeSelection).toHaveBeenCalledWith(
      request,
      '/construction/journey-select',
      'WO_CON_SELF_SERVICE_JOURNEY'
    )
    expect(h.redirect).toHaveBeenCalledWith(
      '/journey/self-service/construction/activity'
    )
  })

  test('throws Boom.notFound for an unknown outcome', () => {
    vi.mocked(getOutcome).mockReturnValue(null)
    const request = {
      params: { outcomePath: 'nope' },
      payload: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' }
    }
    const h = { redirect: vi.fn() }

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('throws Boom.notFound for a terminal outcome page', () => {
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)
    const request = {
      params: { outcomePath: 'licence-not-required' },
      payload: { outcomeType: 'WO_STANDARD_MLA' }
    }
    const h = { redirect: vi.fn() }

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('throws Boom.badRequest when outcomeType is not in this outcome list', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'WO_UNRELATED_OUTCOME_TYPE' }
    }
    vi.mocked(getOutcomeType).mockReturnValue({
      id: 'WO_UNRELATED_OUTCOME_TYPE',
      nextQuestionRoute: '/other-question'
    })
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 })
      })
    )
  })

  test('throws Boom.badRequest when outcomeType is terminal (no nextQuestionRoute)', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'WO_STANDARD_MLA' }
    }
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 })
      })
    )
  })

  test('throws Boom.badRequest when outcomeType payload is missing', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: {}
    }
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 })
      })
    )
  })

  test('throws Boom.badRequest when outcomeType is unknown', () => {
    vi.mocked(getOutcomeType).mockReturnValue(null)
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'NOT_A_REAL_ID' }
    }
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 })
      })
    )
  })
})
