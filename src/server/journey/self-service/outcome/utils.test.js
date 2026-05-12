import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')

import {
  buildTerminalMultiView,
  buildTerminalSingleView,
  classifyOutcome,
  ctaLabelFor
} from '#src/server/journey/self-service/outcome/utils.js'
import { getOutcomeTypesForOutcome } from '#src/server/journey/self-service/services/journey-data.js'

describe('#classifyOutcome', () => {
  test('returns "intermediate" when at least one outcomeType has nextQuestionRoute', () => {
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'A', nextQuestionRoute: '/q' },
      { id: 'B', module: 'X' }
    ])
    expect(classifyOutcome({})).toBe('intermediate')
  })

  test('returns "terminal-multi" when all outcomeTypes are terminal and there are 2+', () => {
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'A', module: 'X' },
      { id: 'B', link: 'https://x' }
    ])
    expect(classifyOutcome({})).toBe('terminal-multi')
  })

  test('returns "terminal-single" when there is exactly one terminal outcomeType', () => {
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'A', module: 'X' }
    ])
    expect(classifyOutcome({})).toBe('terminal-single')
  })
})

describe('#ctaLabelFor', () => {
  test('returns overrideCtaButtonText when present', () => {
    expect(
      ctaLabelFor({
        overrideCtaButtonText: 'Apply now',
        link: 'x',
        module: 'y'
      })
    ).toBe('Apply now')
  })

  test('returns "Download" when only link: is set', () => {
    expect(ctaLabelFor({ link: 'https://x.docx' })).toBe('Download')
  })

  test('returns "Continue" when neither override nor link is set', () => {
    expect(ctaLabelFor({ module: 'MMO_APP2_CONTROL' })).toBe('Continue')
  })

  test('returns "Continue" for an info-only outcomeType (no module/link/override)', () => {
    expect(ctaLabelFor({ id: 'X' })).toBe('Continue')
  })
})

describe('#buildTerminalSingleView — hasContinue', () => {
  const baseModel = { heading: 'h' }

  test('hasContinue=true when outcomeType has module', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'X',
      module: 'MMO_APP2_CONTROL'
    })
    expect(view.hasContinue).toBe(true)
  })

  test('hasContinue=true when outcomeType has link', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'X',
      link: 'https://example.gov.uk/template.docx'
    })
    expect(view.hasContinue).toBe(true)
  })

  test('hasContinue=true when outcomeType has overrideCtaButtonText', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'X',
      overrideCtaButtonText: 'Apply now'
    })
    expect(view.hasContinue).toBe(true)
  })

  test('hasContinue=false for an info-only outcomeType (no module/link/override/nextQuestionRoute)', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_EXE_NOT_LICENSABLE',
      text: '<p>info</p>'
    })
    expect(view.hasContinue).toBe(false)
  })
})

describe('#buildTerminalMultiView — hasContinue per option', () => {
  test('sets hasContinue per option from module / link / override', () => {
    const view = buildTerminalMultiView({ heading: 'h' }, [
      { id: 'A', text: 'a', module: 'M' },
      { id: 'B', text: 'b' },
      { id: 'C', text: 'c', link: 'https://example.gov.uk/x.docx' }
    ])
    expect(view.options.map((o) => o.hasContinue)).toEqual([true, false, true])
  })
})
