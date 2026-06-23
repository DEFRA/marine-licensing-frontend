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

  test('does not return "Download" for a link-only outcomeType (link renders as a text link, not a button)', () => {
    expect(ctaLabelFor({ link: 'https://example.com/template.docx' })).toBe(
      'Continue'
    )
  })

  test('returns the heading for a module (MCMS) outcomeType', () => {
    expect(
      ctaLabelFor({
        module: 'MMO_APP2_CONTROL',
        heading: 'Apply for a standard marine licence'
      })
    ).toBe('Apply for a standard marine licence')
  })

  test('falls back to "Continue" for a module outcomeType with no heading', () => {
    expect(ctaLabelFor({ module: 'MMO_APP2_CONTROL' })).toBe('Continue')
  })

  test('returns "Continue" for an info-only outcomeType (no module/link/override)', () => {
    expect(ctaLabelFor({ id: 'X' })).toBe('Continue')
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

describe('ctaHref wiring', () => {
  const baseModel = { slug: 'S'.repeat(22), outcomeRoute: '/exemption/foo' }
  const continueRoute = (id) =>
    `/journey/self-service/c/${'S'.repeat(22)}/continue/${id}/exemption/foo`

  it('sets ctaHref to the continue route for an exemption outcomeType', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_EXE_AVAILABLE_ARTICLE_13',
      text: 'x',
      overrideCtaButtonUrl: 'https://example.test/guidance',
      overrideCtaButtonText: 'Continue'
    })
    expect(view.ctaHref).toBe(continueRoute('WO_EXE_AVAILABLE_ARTICLE_13'))
  })

  it('sets ctaHref to the continue route for a module (MCMS) outcomeType', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_FAST_TRACK_MLA',
      text: 'x',
      module: 'MMO_APP2_CONTROL'
    })
    expect(view.ctaHref).toBe(continueRoute('WO_FAST_TRACK_MLA'))
  })

  it('does not use the link as ctaHref; exposes link and linkText for a link outcomeType', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_DOWNLOAD',
      heading: 'Download the template',
      link: 'https://example.com/template.docx'
    })
    expect(view.ctaHref).toBeNull()
    expect(view.link).toBe('https://example.com/template.docx')
    expect(view.linkText).toBe('Download the template')
  })

  it('leaves ctaHref null for an info-only outcomeType', () => {
    const view = buildTerminalSingleView(baseModel, { id: 'WO_NOT_LICENSABLE' })
    expect(view.ctaHref).toBeNull()
  })

  it('does not expose the retired hasContinue / continueUrl fields', () => {
    const view = buildTerminalSingleView(baseModel, {
      id: 'WO_FAST_TRACK_MLA',
      text: 'x',
      module: 'MMO_APP2_CONTROL'
    })
    expect(view).not.toHaveProperty('hasContinue')
    expect(view).not.toHaveProperty('continueUrl')
  })

  it('exposes link (not ctaHref) for a link option and ctaHref for a module option on terminal-multi', () => {
    const view = buildTerminalMultiView(baseModel, [
      {
        id: 'WO_DOWNLOAD',
        heading: 'h',
        text: 't',
        link: 'https://example.com/a.docx'
      },
      {
        id: 'WO_STANDARD_TRACK_MLA',
        heading: 'h2',
        text: 't2',
        module: 'MMO_APP2_CONTROL'
      }
    ])
    expect(view.options[0].link).toBe('https://example.com/a.docx')
    expect(view.options[0].ctaHref).toBeNull()
    expect(view.options[1].link).toBeNull()
    expect(view.options[1].ctaHref).toBe(continueRoute('WO_STANDARD_TRACK_MLA'))
  })

  it('sets ctaHref on an intermediate terminal (module) option', () => {
    const view = buildIntermediateView(
      { slug: 'S'.repeat(22), outcomeRoute: '/construction/journey-select' },
      { outcomeTypes: ['WO_STANDARD_MLA'] },
      [
        {
          id: 'WO_STANDARD_MLA',
          heading: 'Apply for a standard marine licence',
          module: 'MMO_APP2_CONTROL'
        }
      ]
    )
    expect(view.options[0].ctaHref).toBe(
      `/journey/self-service/c/${'S'.repeat(22)}/continue/WO_STANDARD_MLA/construction/journey-select`
    )
  })

  it('exposes link on an intermediate terminal (link) option', () => {
    const view = buildIntermediateView(
      { slug: 'S'.repeat(22), outcomeRoute: '/x' },
      { outcomeTypes: ['WO_DOWNLOAD'] },
      [{ id: 'WO_DOWNLOAD', heading: 'h', link: 'https://example.com/a.docx' }]
    )
    expect(view.options[0].link).toBe('https://example.com/a.docx')
  })
})
