import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'

describe('#calculateNextRoute', () => {
  test('returns next question route for a radio answer with nextQuestionRoute', () => {
    const question = {
      route: '/sea',
      answers: [
        { id: 'inSea', nextQuestionRoute: '/jurisdiction' },
        { id: 'other', outcomeRoute: '/not-licensable' }
      ]
    }
    const result = calculateNextRoute(question, 'inSea')
    expect(result).toEqual({ type: 'question', route: '/jurisdiction' })
  })

  test('returns outcome route for a radio answer with outcomeRoute', () => {
    const question = {
      route: '/sea',
      answers: [
        { id: 'inSea', nextQuestionRoute: '/jurisdiction' },
        { id: 'other', outcomeRoute: '/not-licensable' }
      ]
    }
    const result = calculateNextRoute(question, 'other')
    expect(result).toEqual({ type: 'outcome', route: '/not-licensable' })
  })

  test('throws when answer id is not found', () => {
    const question = {
      route: '/sea',
      answers: [{ id: 'inSea', nextQuestionRoute: '/jurisdiction' }]
    }
    expect(() => calculateNextRoute(question, 'bogus')).toThrow(
      "No answer found for id 'bogus' on question '/sea'"
    )
  })

  test('throws when answer has no route', () => {
    const question = {
      route: '/broken',
      answers: [{ id: 'noRoute' }]
    }
    expect(() => calculateNextRoute(question, 'noRoute')).toThrow(
      "Answer 'noRoute' on question '/broken' has no nextQuestionRoute or outcomeRoute"
    )
  })
})
