import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')
vi.mock('#src/server/journey/self-service/services/session-answers.js')
vi.mock('#src/server/journey/self-service/services/data-quality.js')

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
import { reportRuntimeIssue } from '#src/server/journey/self-service/services/data-quality.js'

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
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(getOutcome).toHaveBeenCalledWith('/construction/journey-select')
    expect(getBackLink).toHaveBeenCalledWith(
      request,
      '/construction/journey-select',
      'outcome'
    )
    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({
        classification: 'intermediate',
        heading: 'Marine licence may be required',
        pageTitle: 'Marine licence may be required',
        outcome: mockOutcome,
        section: mockSection,
        options: [
          {
            id: 'WO_CON_EXEMPTION_JOURNEY',
            heading: 'Check to see if an exemption applies',
            text: '<p>body</p>',
            isTerminal: false,
            ctaLabel: 'Continue'
          },
          {
            id: 'WO_CON_SELF_SERVICE_JOURNEY',
            heading: 'Check self-service',
            text: '<p>body</p>',
            isTerminal: false,
            ctaLabel: 'Continue'
          },
          {
            id: 'WO_STANDARD_MLA',
            heading: 'Apply for a standard marine licence',
            text: '<p>body</p>',
            isTerminal: true,
            ctaLabel: 'Continue'
          }
        ],
        backLink: '/journey/self-service/activity-type'
      })
    )
  })

  test('throws Boom.notFound for an unknown outcome route', () => {
    vi.mocked(getOutcome).mockReturnValue(null)
    const request = {
      params: { outcomePath: 'nope' },
      logger: { warn: vi.fn() }
    }
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
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({ section: null })
    )
  })

  test('logs unknown-outcome-route on 404', () => {
    vi.mocked(getOutcome).mockReturnValue(null)
    const request = {
      params: { outcomePath: 'nope' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    expect(() => outcomeController.handler(request, h)).toThrow()

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'unknown-outcome-route',
      '/nope',
      expect.any(String),
      expect.any(String)
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
      payload: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' },
      logger: { warn: vi.fn() }
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
      payload: { outcomeType: 'WO_CON_SELF_SERVICE_JOURNEY' },
      logger: { warn: vi.fn() }
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
      payload: { outcomeType: 'WO_STANDARD_MLA' },
      logger: { warn: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 404 })
      })
    )
  })

  test('logs post-on-non-intermediate-outcome when POSTed to a terminal outcome', () => {
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)
    const request = {
      params: { outcomePath: 'licence-not-required' },
      payload: { outcomeType: 'WO_STANDARD_MLA' },
      logger: { warn: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    expect(() => outcomePostController.handler(request, h)).toThrow()

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'post-on-non-intermediate-outcome',
      '/licence-not-required',
      expect.any(String),
      expect.any(String)
    )
  })

  test('throws Boom.badRequest when outcomeType is not in this outcome list', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'WO_UNRELATED_OUTCOME_TYPE' },
      logger: { warn: vi.fn() }
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
      payload: { outcomeType: 'WO_STANDARD_MLA' },
      logger: { warn: vi.fn() }
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
      payload: {},
      logger: { warn: vi.fn() }
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
      payload: { outcomeType: 'NOT_A_REAL_ID' },
      logger: { warn: vi.fn() }
    }
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow(
      expect.objectContaining({
        isBoom: true,
        output: expect.objectContaining({ statusCode: 400 })
      })
    )
  })

  test('logs invalid-outcome-selection when outcomeType is rejected', () => {
    const request = {
      params: { outcomePath: 'construction/journey-select' },
      payload: { outcomeType: 'WO_STANDARD_MLA' },
      logger: { warn: vi.fn() }
    }
    const h = {}

    expect(() => outcomePostController.handler(request, h)).toThrow()

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'invalid-outcome-selection',
      '/construction/journey-select',
      expect.any(String),
      expect.any(String)
    )
  })
})

describe('#outcomeController — terminal-multi', () => {
  const multiOutcome = {
    route: '/scaffolding-impede-navigation',
    heading: 'Scaffolding or access towers - impede safe or normal navigation',
    text: null,
    outcomeTypes: [
      'WO_DOWNLOAD_HA_AGREED_METHOD_TEMPLATE',
      'WO_STANDARD_TRACK_MLA'
    ]
  }
  const otDownload = {
    id: 'WO_DOWNLOAD_HA_AGREED_METHOD_TEMPLATE',
    heading: 'Download HA self-service marine licensing agreed method template',
    text: '<p>download body</p>',
    link: 'https://x.docx'
  }
  const otStandardMla = {
    id: 'WO_STANDARD_TRACK_MLA',
    heading: 'Apply for a standard marine licence',
    text: '<p>standard MLA body</p>',
    module: 'MMO_APP2_CONTROL'
  }

  beforeEach(() => {
    vi.mocked(getOutcome).mockReturnValue(multiOutcome)
    vi.mocked(getSection).mockReturnValue(null)
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      otDownload,
      otStandardMla
    ])
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)
    vi.mocked(getBackLink).mockReturnValue('/journey/self-service/back-here')
  })

  test('renders terminal-multi view model with per-card ctaLabel', () => {
    const request = {
      params: { outcomePath: 'scaffolding-impede-navigation' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({
        classification: 'terminal-multi',
        heading: multiOutcome.heading,
        pageTitle: multiOutcome.heading,
        outcome: multiOutcome,
        options: [
          {
            id: 'WO_DOWNLOAD_HA_AGREED_METHOD_TEMPLATE',
            heading: otDownload.heading,
            text: '<p>download body</p>',
            ctaLabel: 'Download'
          },
          {
            id: 'WO_STANDARD_TRACK_MLA',
            heading: otStandardMla.heading,
            text: '<p>standard MLA body</p>',
            ctaLabel: 'Continue'
          }
        ],
        backLink: '/journey/self-service/back-here'
      })
    )
  })
})

describe('#outcomeController — terminal-single', () => {
  const terminalOutcome = {
    route: '/exemption/article-25A',
    heading: 'You need to provide more information',
    text: null,
    outcomeTypes: ['WO_EXE_AVAILABLE_ARTICLE_25A']
  }
  const terminalOutcomeType = {
    id: 'WO_EXE_AVAILABLE_ARTICLE_25A',
    heading: 'Fill out an exemption notification',
    text: '<p>Article 25A body…</p>',
    overrideCtaButtonText: 'Continue'
  }

  beforeEach(() => {
    vi.mocked(getOutcome).mockReturnValue(terminalOutcome)
    vi.mocked(getSection).mockReturnValue(null)
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([terminalOutcomeType])
    vi.mocked(isIntermediateOutcome).mockReturnValue(false)
    vi.mocked(getBackLink).mockReturnValue('/journey/self-service/something')
  })

  test('renders the terminal-single view model', () => {
    const request = {
      params: { outcomePath: 'exemption/article-25A' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({
        classification: 'terminal-single',
        heading: 'You need to provide more information',
        pageTitle: 'You need to provide more information',
        outcome: terminalOutcome,
        body: '<p>Article 25A body…</p>',
        ctaLabel: 'Continue',
        backLink: '/journey/self-service/something'
      })
    )
  })

  test('logs outcome-type-empty-text when terminal body is empty', () => {
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { ...terminalOutcomeType, text: '' }
    ])
    const request = {
      params: { outcomePath: 'exemption/article-25A' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'outcome-type-empty-text',
      'WO_EXE_AVAILABLE_ARTICLE_25A',
      expect.any(String),
      expect.any(String)
    )
  })

  test('logs outcome-missing-heading and uses "Result" fallback', () => {
    vi.mocked(getOutcome).mockReturnValue({ ...terminalOutcome, heading: null })
    const request = {
      params: { outcomePath: 'exemption/article-25A' },
      logger: { warn: vi.fn() }
    }
    const h = { view: vi.fn() }

    outcomeController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'journey/self-service/outcome/index',
      expect.objectContaining({ heading: 'Result', pageTitle: 'Result' })
    )
    expect(reportRuntimeIssue).toHaveBeenCalledWith(
      request,
      'outcome-missing-heading',
      '/exemption/article-25A',
      expect.any(String),
      expect.any(String)
    )
  })
})
