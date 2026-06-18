import { describe, it, expect } from 'vitest'
import {
  HANDOFF_ALLOWLISTS,
  projectMappedAnswers,
  projectOutcomeParams,
  buildHandoffQueryString,
  buildHandoffRedirectUrl,
  buildMcmsHandoffQueryString,
  buildMcmsRedirectUrl
} from './application-handoff.js'

const exemption = HANDOFF_ALLOWLISTS.exemption

const questionLog = [
  {
    questionRoute: '/activity-type',
    answers: [{ id: 'REMOVAL', text: 'Removal' }],
    mcmsAppFormMapping: 'ACTIVITY_TYPE'
  },
  {
    questionRoute: '/exemption/removal/activity-type',
    answers: [{ id: 'maintenance', text: 'Maintenance' }],
    mcmsAppFormMapping: 'EXE_ACTIVITY_SUBTYPE_REMOVAL'
  },
  {
    questionRoute: '/historic-england',
    answers: [{ id: 'yes', text: 'Yes' }],
    mcmsAppFormMapping: 'HISTORIC_ENGLAND'
  },
  {
    questionRoute: '/no-mapping',
    answers: [{ id: 'x', text: 'X' }],
    mcmsAppFormMapping: null
  }
]

const focusedOption = {
  id: 'WO_EXE_AVAILABLE_ARTICLE_34',
  overrideCtaButtonUrl: 'https://example.test/guidance',
  params: [
    { name: 'ADV_TYPE', value: 'EXE' },
    { name: 'ARTICLE', value: '34' },
    { name: 'EMERGENCY', value: 'true' }
  ]
}

describe('projectMappedAnswers', () => {
  it('keeps allow-listed mappings and drops everything else', () => {
    expect(projectMappedAnswers(questionLog, exemption)).toEqual({
      ACTIVITY_TYPE: 'REMOVAL',
      EXE_ACTIVITY_SUBTYPE_REMOVAL: 'maintenance'
    })
  })

  it('skips entries with an allow-listed mapping but no answer', () => {
    const log = [
      { mcmsAppFormMapping: 'ACTIVITY_TYPE', answers: [] },
      { mcmsAppFormMapping: 'ARTICLE', answers: undefined }
    ]
    expect(projectMappedAnswers(log, exemption)).toEqual({})
  })
})

describe('projectOutcomeParams', () => {
  it('keeps allow-listed params and drops EMERGENCY', () => {
    expect(projectOutcomeParams(focusedOption, exemption)).toEqual({
      ADV_TYPE: 'EXE',
      ARTICLE: '34'
    })
  })

  it('returns empty object when there are no params', () => {
    expect(projectOutcomeParams({ params: null }, exemption)).toEqual({})
  })
})

describe('buildHandoffQueryString', () => {
  it('orders params per the allow-list, appends pdfDownloadUrl last, and percent-encodes', () => {
    const qs = buildHandoffQueryString({
      questionLog,
      focusedOption,
      answersUrl:
        'https://fe.example/journey/self-service/outcome-document/ABC_123',
      allowList: exemption
    })
    expect(qs).toBe(
      'ACTIVITY_TYPE=REMOVAL' +
        '&EXE_ACTIVITY_SUBTYPE_REMOVAL=maintenance' +
        '&ADV_TYPE=EXE' +
        '&ARTICLE=34' +
        '&pdfDownloadUrl=https%3A%2F%2Ffe.example%2Fjourney%2Fself-service%2Foutcome-document%2FABC_123'
    )
  })

  it('omits pdfDownloadUrl when answersUrl is missing', () => {
    const qs = buildHandoffQueryString({
      questionLog: [],
      focusedOption: { params: [{ name: 'ADV_TYPE', value: 'EXE' }] },
      answersUrl: null,
      allowList: exemption
    })
    expect(qs).toBe('ADV_TYPE=EXE')
  })
})

describe('buildHandoffRedirectUrl', () => {
  it('returns the override path + query as a relative URL (no host/origin)', () => {
    const result = buildHandoffRedirectUrl(
      'https://get-permission-for-marine-work.defra.gov.uk/guidance/who-is-the-exemption-for/',
      'ACTIVITY_TYPE=CON&ADV_TYPE=EXE'
    )
    expect(result).toBe(
      '/guidance/who-is-the-exemption-for/?ACTIVITY_TYPE=CON&ADV_TYPE=EXE'
    )
    expect(result.startsWith('/')).toBe(true)
    expect(result).not.toContain('get-permission-for-marine-work.defra.gov.uk')
  })

  it('returns just the path when there is no query string', () => {
    expect(
      buildHandoffRedirectUrl('https://example.test/guidance/x/', '')
    ).toBe('/guidance/x/')
  })

  it('merges with an existing query already on the override URL', () => {
    expect(
      buildHandoffRedirectUrl(
        'https://example.test/guidance/x?foo=bar',
        'ADV_TYPE=EXE'
      )
    ).toBe('/guidance/x?foo=bar&ADV_TYPE=EXE')
  })
})

describe('buildMcmsHandoffQueryString', () => {
  it('reproduces the ML-1167 worked example with no allow-list', () => {
    const questionLog = [
      {
        questionRoute: '/activity-type',
        answers: [{ id: 'DEPOSIT', text: 'Deposit' }],
        mcmsAppFormMapping: 'ACTIVITY_TYPE'
      },
      {
        questionRoute: '/deposit/method',
        answers: [{ id: 'vehicleOrVessel', text: 'From a vehicle or vessel' }],
        mcmsAppFormMapping: null
      },
      {
        questionRoute: '/exemption/deposit/activity-type',
        answers: [{ id: 'fishing', text: 'Fishing' }],
        mcmsAppFormMapping: 'EXE_ACTIVITY_SUBTYPE_DEPOSIT'
      }
    ]
    const focusedOption = {
      id: 'WO_MARINE_LICENCE',
      module: 'MMO_ADVICE_CONTROL',
      params: [
        { name: 'ADV_TYPE', value: 'MLA' },
        { name: 'FAST_TRACK', value: 'true' }
      ]
    }

    const qs = buildMcmsHandoffQueryString({
      questionLog,
      focusedOption,
      journeyId: 'CTX123',
      viewAnswersUrl: 'https://fe.example/iat/answers/CTX123'
    })

    expect(qs).toBe(
      'journeyId=CTX123' +
        '&viewAnswersUrl=https%3A%2F%2Ffe.example%2Fiat%2Fanswers%2FCTX123' +
        '&ACTIVITY_TYPE=DEPOSIT' +
        '&EXE_ACTIVITY_SUBTYPE_DEPOSIT=fishing' +
        '&ADV_TYPE=MLA' +
        '&FAST_TRACK=true'
    )
  })

  it('always emits journeyId and skips entries with no mapping or no answer', () => {
    const qs = buildMcmsHandoffQueryString({
      questionLog: [
        { mcmsAppFormMapping: null, answers: [{ id: 'x' }] },
        { mcmsAppFormMapping: 'ACTIVITY_TYPE', answers: [] }
      ],
      focusedOption: { params: null },
      journeyId: 'CTX',
      viewAnswersUrl: null
    })
    expect(qs).toBe('journeyId=CTX')
  })

  it('omits viewAnswersUrl when it is missing', () => {
    const qs = buildMcmsHandoffQueryString({
      questionLog: [],
      focusedOption: { params: [{ name: 'FAST_TRACK', value: 'true' }] },
      journeyId: 'CTX',
      viewAnswersUrl: undefined
    })
    expect(qs).toBe('journeyId=CTX&FAST_TRACK=true')
  })
})

describe('buildMcmsRedirectUrl', () => {
  it('keeps the absolute origin and appends the query string', () => {
    expect(
      buildMcmsRedirectUrl(
        'https://marinelicensingtest.marinemanagement.org.uk/',
        '',
        'journeyId=X&FAST_TRACK=true'
      )
    ).toBe(
      'https://marinelicensingtest.marinemanagement.org.uk/?journeyId=X&FAST_TRACK=true'
    )
  })

  it('joins a non-empty path onto the base URL', () => {
    expect(
      buildMcmsRedirectUrl('https://mcms.test/', 'apply/new', 'a=1')
    ).toBe('https://mcms.test/apply/new?a=1')
  })

  it('returns just the base URL when there is no query string', () => {
    expect(buildMcmsRedirectUrl('https://mcms.test/', '', '')).toBe(
      'https://mcms.test/'
    )
  })
})
