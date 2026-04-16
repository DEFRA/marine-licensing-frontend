import {
  getQuestion,
  getSection,
  getFirstQuestionRoute,
  hasQuestion
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
})
