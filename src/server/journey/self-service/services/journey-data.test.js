import {
  getQuestion,
  getSection,
  getFirstQuestionRoute,
  hasQuestion,
  getOutcome,
  hasOutcome,
  getOutcomeType,
  getOutcomeTypesForOutcome,
  isIntermediateOutcome
} from '#src/server/journey/self-service/services/journey-data.js'

describe('#journey-data', () => {
  describe('#getFirstQuestionRoute', () => {
    test('returns the first question route from the JSON', () => {
      expect(getFirstQuestionRoute()).toBe('/sea')
    })
  })

  describe('#getQuestion', () => {
    test('returns the question object for a known route', () => {
      const question = getQuestion('/sea')
      expect(question).toEqual(
        expect.objectContaining({
          route: '/sea',
          text: 'Where will the activity take place?',
          section: 'doINeedAMarineLicence'
        })
      )
      expect(question.answers).toHaveLength(5)
    })

    test('returns null for an unknown route', () => {
      expect(getQuestion('/does-not-exist')).toBeNull()
    })

    test('sanitises HTML in question hint fields', () => {
      const question = getQuestion('/sea')
      expect(question.hint).toContain('<a')
      expect(question.hint).not.toContain('<script')
    })

    test('sanitises HTML in answer hint fields', () => {
      const question = getQuestion('/sea')
      const answerWithHint = question.answers.find((a) => a.id === 'inSea')
      expect(answerWithHint.hint).toBe(
        'The sea includes any area submerged at mean high water springs'
      )
    })
  })

  describe('#hasQuestion', () => {
    test('returns true for a known route', () => {
      expect(hasQuestion('/sea')).toBe(true)
    })

    test('returns false for an unknown route', () => {
      expect(hasQuestion('/does-not-exist')).toBe(false)
    })
  })

  describe('#getSection', () => {
    test('returns section object for a known section id', () => {
      expect(getSection('doINeedAMarineLicence')).toEqual({
        id: 'doINeedAMarineLicence',
        text: 'Jurisdiction check'
      })
    })

    test('returns null for an unknown section id', () => {
      expect(getSection('nonexistent')).toBeNull()
    })
  })

  describe('#getOutcome', () => {
    test('returns the outcome for a known route', () => {
      const outcome = getOutcome('/construction/journey-select')
      expect(outcome).toEqual(
        expect.objectContaining({
          route: '/construction/journey-select',
          heading: 'Marine licence may be required',
          section: 'doINeedAMarineLicenceConstruction'
        })
      )
      expect(outcome.outcomeTypes).toEqual([
        'WO_CON_EXEMPTION_JOURNEY',
        'WO_CON_SELF_SERVICE_JOURNEY',
        'WO_STANDARD_MLA'
      ])
    })

    test('returns null for an unknown outcome route', () => {
      expect(getOutcome('/does-not-exist')).toBeNull()
    })

    test('sanitises HTML in outcome.text as rich text (no govuk-hint class)', () => {
      const outcome = getOutcome('/construction/journey-select')
      expect(outcome.text).toContain('<b>')
      expect(outcome.text).toContain('<a')
      expect(outcome.text).not.toContain('govuk-hint')
      expect(outcome.text).not.toContain('<script')
    })

    test('strips HTML from outcome.heading', () => {
      const outcome = getOutcome('/construction/journey-select')
      expect(outcome.heading).toBe('Marine licence may be required')
      expect(outcome.heading).not.toContain('<')
    })
  })

  describe('#hasOutcome', () => {
    test('returns true for a known outcome route', () => {
      expect(hasOutcome('/construction/journey-select')).toBe(true)
    })

    test('returns false for an unknown outcome route', () => {
      expect(hasOutcome('/does-not-exist')).toBe(false)
    })
  })

  describe('#getOutcomeType', () => {
    test('returns the outcomeType for a known id', () => {
      const outcomeType = getOutcomeType('WO_CON_SELF_SERVICE_JOURNEY')
      expect(outcomeType).toEqual(
        expect.objectContaining({
          id: 'WO_CON_SELF_SERVICE_JOURNEY',
          nextQuestionRoute: '/construction/activity'
        })
      )
    })

    test('returns null for an unknown id', () => {
      expect(getOutcomeType('NOT_AN_ID')).toBeNull()
    })

    test('sanitises HTML in outcomeType.text as rich text', () => {
      const outcomeType = getOutcomeType('WO_CON_EXEMPTION_JOURNEY')
      expect(outcomeType.text).toContain('<p>')
      expect(outcomeType.text).not.toContain('govuk-hint')
    })

    test('strips HTML from outcomeType.heading', () => {
      const outcomeType = getOutcomeType('WO_STANDARD_MLA')
      expect(outcomeType.heading).toBe('Apply for a standard marine licence')
      expect(outcomeType.heading).not.toContain('<')
    })
  })

  describe('#getOutcomeTypesForOutcome', () => {
    test('resolves the outcomeType string ids to full objects', () => {
      const outcome = getOutcome('/construction/journey-select')
      const resolved = getOutcomeTypesForOutcome(outcome)
      expect(resolved).toHaveLength(3)
      expect(resolved.map((ot) => ot.id)).toEqual([
        'WO_CON_EXEMPTION_JOURNEY',
        'WO_CON_SELF_SERVICE_JOURNEY',
        'WO_STANDARD_MLA'
      ])
    })

    test('silently skips unknown ids', () => {
      const fakeOutcome = { outcomeTypes: ['WO_STANDARD_MLA', 'NOT_A_REAL_ID'] }
      const resolved = getOutcomeTypesForOutcome(fakeOutcome)
      expect(resolved).toHaveLength(1)
      expect(resolved[0].id).toBe('WO_STANDARD_MLA')
    })

    test('returns an empty array for an outcome without outcomeTypes', () => {
      expect(getOutcomeTypesForOutcome({})).toEqual([])
    })
  })

  describe('#isIntermediateOutcome', () => {
    test('returns true when at least one outcomeType has nextQuestionRoute', () => {
      const outcome = getOutcome('/construction/journey-select')
      expect(isIntermediateOutcome(outcome)).toBe(true)
    })

    test('returns false when no outcomeType has nextQuestionRoute', () => {
      const outcome = getOutcome('/licence-not-required-devolved')
      expect(isIntermediateOutcome(outcome)).toBe(false)
    })
  })
})
