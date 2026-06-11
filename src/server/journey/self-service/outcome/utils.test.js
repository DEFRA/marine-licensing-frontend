import { vi } from 'vitest'

vi.mock('#src/server/journey/self-service/services/journey-data.js')

import {
  buildIntermediateView,
  buildSnapshotPayload,
  buildTerminalMultiView,
  buildTerminalSingleView,
  classifyOutcome,
  ctaLabelFor
} from '#src/server/journey/self-service/outcome/utils.js'
import {
  getDocumentPreambleText,
  getOutcomeTypesForOutcome
} from '#src/server/journey/self-service/services/journey-data.js'

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
  const baseModel = { heading: 'h', outcomeRoute: '/x' }

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

describe('#buildTerminalSingleView — viewAnswersUrl', () => {
  test('builds /c/<slug>/view-answers/<typeId>/<outcomeRoute-without-leading-slash>', () => {
    const view = buildTerminalSingleView(
      {
        heading: 'h',
        outcomeRoute: '/markers/ha-not-agreed',
        slug: 'abcdefghijklmnopqrstuv'
      },
      { id: 'WO_FOO' }
    )
    expect(view.viewAnswersUrl).toBe(
      '/journey/self-service/c/abcdefghijklmnopqrstuv/view-answers/WO_FOO/markers/ha-not-agreed'
    )
  })
})

describe('#buildTerminalMultiView — hasContinue per option', () => {
  test('sets hasContinue per option from module / link / override', () => {
    const view = buildTerminalMultiView({ heading: 'h', outcomeRoute: '/x' }, [
      { id: 'A', text: 'a', module: 'M' },
      { id: 'B', text: 'b' },
      { id: 'C', text: 'c', link: 'https://example.gov.uk/x.docx' }
    ])
    expect(view.options.map((o) => o.hasContinue)).toEqual([true, false, true])
  })
})

describe('#buildSnapshotPayload — preamble', () => {
  test('reads preamble from JSON via getDocumentPreambleText and freezes it into the payload', () => {
    vi.mocked(getDocumentPreambleText).mockReturnValue('PREAMBLE-FROZEN')
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'X', module: 'M' }
    ])
    const payload = buildSnapshotPayload(
      { heading: 'h', text: 't' },
      '/some-outcome',
      'X'
    )
    expect(payload.preamble).toBe('PREAMBLE-FROZEN')
  })

  test('falls back to empty string when JSON has no preamble', () => {
    vi.mocked(getDocumentPreambleText).mockReturnValue(undefined)
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'X', module: 'M' }
    ])
    const payload = buildSnapshotPayload({}, '/some-outcome', 'X')
    expect(payload.preamble).toBe('')
  })

  test("throws when the focused outcomeTypeId is not one of the outcome's outcomeTypes", () => {
    vi.mocked(getOutcomeTypesForOutcome).mockReturnValue([
      { id: 'A', module: 'M' },
      { id: 'B', module: 'M' }
    ])
    expect(() =>
      buildSnapshotPayload({}, '/some-outcome', 'NOT_IN_LIST')
    ).toThrow(/Unknown outcomeTypeId: NOT_IN_LIST/)
  })
})

describe('#buildIntermediateView — section ternary fallback', () => {
  test('returns section: null when the outcome has no section field', () => {
    const view = buildIntermediateView(
      { heading: 'h', outcomeRoute: '/x', slug: 'abcdefghijklmnopqrstuv' },
      { outcomeTypes: ['X'] }, // no `section`
      [{ id: 'X', heading: 'opt' }]
    )
    expect(view.section).toBeNull()
  })
})

describe('continueUrl wiring', () => {
  const baseModel = { slug: 'S'.repeat(22), outcomeRoute: '/exemption/foo' }

  it('sets continueUrl for an exemption outcomeType (has overrideCtaButtonUrl)', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_EXE_AVAILABLE_ARTICLE_13',
      text: 'x',
      overrideCtaButtonUrl: 'https://example.test/guidance',
      overrideCtaButtonText: 'Continue'
    })
    expect(view.continueUrl).toBe(
      `/journey/self-service/c/${'S'.repeat(22)}/continue/WO_EXE_AVAILABLE_ARTICLE_13/exemption/foo`
    )
  })

  it('leaves continueUrl null for a non-exemption outcomeType', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_FAST_TRACK_MLA',
      text: 'x',
      module: 'MMO_APP2_CONTROL'
    })
    expect(view.continueUrl).toBeNull()
  })

  it('sets per-option continueUrl on terminal-multi exemption options', () => {
    const view = buildTerminalMultiView(baseModel, [
      {
        id: 'WO_EXE_AVAILABLE_ARTICLE_13',
        heading: 'h',
        text: 't',
        overrideCtaButtonUrl: 'https://example.test/guidance'
      },
      { id: 'WO_MOD_PERMISSION', heading: 'h2', text: 't2', module: null }
    ])
    expect(view.options[0].continueUrl).toBe(
      `/journey/self-service/c/${'S'.repeat(22)}/continue/WO_EXE_AVAILABLE_ARTICLE_13/exemption/foo`
    )
    expect(view.options[1].continueUrl).toBeNull()
  })
})
