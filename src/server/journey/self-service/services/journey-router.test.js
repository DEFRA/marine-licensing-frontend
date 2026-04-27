import { calculateNextRoute } from '#src/server/journey/self-service/services/journey-router.js'

describe('#calculateNextRoute (single-select)', () => {
  const radioQuestion = {
    route: '/sea',
    answers: [
      { id: 'inSea', nextQuestionRoute: '/jurisdiction' },
      { id: 'other', outcomeRoute: '/not-licensable' }
    ]
  }

  test('returns next question route for an answer with nextQuestionRoute', () => {
    expect(calculateNextRoute(radioQuestion, ['inSea'])).toEqual({
      type: 'question',
      route: '/jurisdiction'
    })
  })

  test('returns outcome route for an answer with outcomeRoute', () => {
    expect(calculateNextRoute(radioQuestion, ['other'])).toEqual({
      type: 'outcome',
      route: '/not-licensable'
    })
  })

  test('throws when answer id is not found', () => {
    expect(() => calculateNextRoute(radioQuestion, ['bogus'])).toThrow(
      "No answer 'bogus' on '/sea'"
    )
  })

  test('throws when answer has no route', () => {
    const broken = { route: '/broken', answers: [{ id: 'noRoute' }] }
    expect(() => calculateNextRoute(broken, ['noRoute'])).toThrow(
      "Answer 'noRoute' on '/broken' has no route"
    )
  })

  test('throws when given zero ids on a single-select question', () => {
    expect(() => calculateNextRoute(radioQuestion, [])).toThrow(
      "Single-select question '/sea' received 0 answers"
    )
  })

  test('throws when given multiple ids on a single-select question', () => {
    expect(() => calculateNextRoute(radioQuestion, ['inSea', 'other'])).toThrow(
      "Single-select question '/sea' received 2 answers"
    )
  })
})

describe('#calculateNextRoute (multi-select)', () => {
  const multiSelectQuestion = {
    route: '/construction/maintenance-existing-works',
    multiSelect: {
      questionRoute: '/construction/maintenance-existing-works/scaffolding',
      outcomeRoute: '/standard-marine-licence-application/other-maintenance',
      outcomeAnswerId: 'OTHER_MAINTENANCE'
    },
    answers: [
      { id: 'SCAFFOLDING_ACCESS_TOWERS' },
      { id: 'REPAINTING_STRUCTURES' },
      { id: 'OTHER_MAINTENANCE' }
    ]
  }

  test('routes to questionRoute when only non-other answers selected', () => {
    expect(
      calculateNextRoute(multiSelectQuestion, ['SCAFFOLDING_ACCESS_TOWERS'])
    ).toEqual({
      type: 'question',
      route: '/construction/maintenance-existing-works/scaffolding'
    })
  })

  test('routes to questionRoute when multiple non-other answers selected', () => {
    expect(
      calculateNextRoute(multiSelectQuestion, [
        'SCAFFOLDING_ACCESS_TOWERS',
        'REPAINTING_STRUCTURES'
      ])
    ).toEqual({
      type: 'question',
      route: '/construction/maintenance-existing-works/scaffolding'
    })
  })

  test('routes to outcomeRoute when only the other answer is selected', () => {
    expect(
      calculateNextRoute(multiSelectQuestion, ['OTHER_MAINTENANCE'])
    ).toEqual({
      type: 'outcome',
      route: '/standard-marine-licence-application/other-maintenance'
    })
  })

  test('routes to outcomeRoute when other answer is mixed with non-other answers (OTHER_ANY rule)', () => {
    expect(
      calculateNextRoute(multiSelectQuestion, [
        'SCAFFOLDING_ACCESS_TOWERS',
        'OTHER_MAINTENANCE'
      ])
    ).toEqual({
      type: 'outcome',
      route: '/standard-marine-licence-application/other-maintenance'
    })
  })

  test('routes to questionRoute when ids array is empty (degenerate but defined)', () => {
    expect(calculateNextRoute(multiSelectQuestion, [])).toEqual({
      type: 'question',
      route: '/construction/maintenance-existing-works/scaffolding'
    })
  })
})
