import { describe, expect, test, vi, beforeEach } from 'vitest'
import { outcomeDocumentController } from './controller.js'

vi.mock('#src/services/iat-service/iat-outcome-document.service.js', () => ({
  iatOutcomeDocumentService: { get: vi.fn() }
}))
import { iatOutcomeDocumentService } from '#src/services/iat-service/iat-outcome-document.service.js'

// CRITICAL (AC #6): mock journey-data.js so any sneaked-in lookup returns nothing.
// The controller MUST NOT call journey-data at render time — the snapshot is
// self-contained. If a future refactor sneaks in a lookup, the JSON-replacement
// test below catches it.
vi.mock('#src/server/journey/self-service/services/journey-data.js', () => ({
  getQuestion: vi.fn(() => null),
  getOutcome: vi.fn(() => null),
  getOutcomeType: vi.fn(() => null),
  getOutcomeTypesForOutcome: vi.fn(() => []),
  getDocumentPreambleText: vi.fn(() => 'PREAMBLE-FROM-JSON-SHOULD-NOT-APPEAR')
}))

const frozenDoc = {
  slug: 'b'.repeat(22),
  capturedAt: new Date('2026-05-26T10:00:00Z').toISOString(),
  preamble:
    'The purpose of the MMO marine licence requirement checker tool is to assist prospective applicants…',
  questionLog: [
    {
      questionRoute: '/activity-type',
      questionText: 'What kind of activity?',
      answers: [{ id: 'CON', text: 'Construction' }],
      mcmsAppFormMapping: 'ACTIVITY_TYPE'
    },
    {
      questionRoute: '/exemption/construction',
      questionText: 'Purpose?',
      answers: [{ id: 'new', text: 'Build new' }],
      mcmsAppFormMapping: 'EXE_ACTIVITY_SUBTYPE_CONSTRUCTION'
    }
  ],
  outcomeRoute: '/outcome-a',
  outcomeKind: 'terminal-single',
  outcomeHeading: 'You may apply for exemption',
  outcomeText: '',
  focusedOption: {
    id: 'WO_EXE_AVAILABLE_ARTICLE_13',
    heading: 'Apply for an exemption',
    text: '<p>You qualify under Article 13.</p>',
    module: 'MMO_ADVICE_CONTROL',
    link: null,
    overrideCtaButtonUrl: null,
    params: [
      { name: 'ADV_TYPE', value: 'EXE' },
      { name: 'ARTICLE', value: '13' }
    ]
  }
}

describe('outcomeDocumentController', () => {
  let h, request

  beforeEach(() => {
    iatOutcomeDocumentService.get.mockReset()
    h = { view: vi.fn().mockReturnValue('VIEW') }
    request = { params: { slug: 'b'.repeat(22) } }
  })

  test('renders the frozen question/answer text from the snapshot', async () => {
    iatOutcomeDocumentService.get.mockResolvedValue(frozenDoc)
    await outcomeDocumentController.handler(request, h)
    const [path, model] = h.view.mock.calls[0]
    expect(path).toBe('journey/self-service/outcome-document/index')
    expect(model.answers).toEqual([
      {
        questionRoute: '/activity-type',
        questionText: 'What kind of activity?',
        answers: [{ id: 'CON', text: 'Construction' }]
      },
      {
        questionRoute: '/exemption/construction',
        questionText: 'Purpose?',
        answers: [{ id: 'new', text: 'Build new' }]
      }
    ])
    expect(model.summaryText).toBe('<p>You qualify under Article 13.</p>')
  })

  test('JSON-REPLACEMENT GUARANTEE (AC #6): renders correctly even when journey-data.js returns nothing', async () => {
    iatOutcomeDocumentService.get.mockResolvedValue(frozenDoc)
    await outcomeDocumentController.handler(request, h)
    const journeyData =
      await import('#src/server/journey/self-service/services/journey-data.js')
    expect(journeyData.getQuestion).not.toHaveBeenCalled()
    expect(journeyData.getOutcome).not.toHaveBeenCalled()
    expect(journeyData.getOutcomeType).not.toHaveBeenCalled()
    expect(journeyData.getOutcomeTypesForOutcome).not.toHaveBeenCalled()
    expect(journeyData.getDocumentPreambleText).not.toHaveBeenCalled()
    const [, model] = h.view.mock.calls[0]
    expect(model.answers[0].questionText).toBe('What kind of activity?')
    expect(model.answers[0].answers[0].text).toBe('Construction')
  })

  test('404 when snapshot not found', async () => {
    iatOutcomeDocumentService.get.mockResolvedValue(null)
    await expect(outcomeDocumentController.handler(request, h)).rejects.toThrow(
      'Outcome document not found'
    )
  })

  test('passes dateOfCheck from capturedAt', async () => {
    iatOutcomeDocumentService.get.mockResolvedValue(frozenDoc)
    await outcomeDocumentController.handler(request, h)
    const [, model] = h.view.mock.calls[0]
    expect(model.dateOfCheck).toBe(frozenDoc.capturedAt)
  })

  test('introductionText is read from the frozen snapshot preamble, not hardcoded or JSON-resolved', async () => {
    iatOutcomeDocumentService.get.mockResolvedValue(frozenDoc)
    await outcomeDocumentController.handler(request, h)
    const [, model] = h.view.mock.calls[0]
    expect(model.introductionText).toBe(frozenDoc.preamble)
  })

  test('introductionText falls back to empty string when preamble is missing', async () => {
    const docNoPreamble = { ...frozenDoc, preamble: undefined }
    iatOutcomeDocumentService.get.mockResolvedValue(docNoPreamble)
    await outcomeDocumentController.handler(request, h)
    const [, model] = h.view.mock.calls[0]
    expect(model.introductionText).toBe('')
  })

  test('multi-select question renders all selected answers', async () => {
    const multiDoc = {
      ...frozenDoc,
      questionLog: [
        {
          questionRoute: '/multi-q',
          questionText: 'Pick multiple',
          answers: [
            { id: 'A', text: 'Apple' },
            { id: 'B', text: 'Banana' }
          ],
          mcmsAppFormMapping: 'FRUITS'
        }
      ]
    }
    iatOutcomeDocumentService.get.mockResolvedValue(multiDoc)
    await outcomeDocumentController.handler(request, h)
    const [, model] = h.view.mock.calls[0]
    expect(model.answers[0].answers).toEqual([
      { id: 'A', text: 'Apple' },
      { id: 'B', text: 'Banana' }
    ])
  })
})
