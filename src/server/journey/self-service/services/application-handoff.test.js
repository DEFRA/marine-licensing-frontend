import { describe, it, expect } from 'vitest'
import {
  HANDOFF_ALLOWLISTS,
  projectMappedAnswers,
  projectOutcomeParams,
  buildHandoffQueryString
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
      answersUrl: 'https://fe.example/outcome-documents/ABC_123',
      allowList: exemption
    })
    expect(qs).toBe(
      'ACTIVITY_TYPE=REMOVAL' +
        '&EXE_ACTIVITY_SUBTYPE_REMOVAL=maintenance' +
        '&ADV_TYPE=EXE' +
        '&ARTICLE=34' +
        '&pdfDownloadUrl=https%3A%2F%2Ffe.example%2Foutcome-documents%2FABC_123'
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
