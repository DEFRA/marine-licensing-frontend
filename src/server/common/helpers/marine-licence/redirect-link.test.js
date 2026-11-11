import {
  getCommonRedirectLink,
  withCheckYourAnswersQuery
} from './redirect-link.js'

describe('getCommonRedirectLink', () => {
  describe('when from query param is "check-your-answers"', () => {
    it('returns the check-your-answers route', () => {
      const request = { query: { from: 'check-your-answers' } }
      expect(getCommonRedirectLink(request)).toBe(
        '/marine-licence/check-your-answers'
      )
    })
  })

  describe('when from query param is not "check-your-answers"', () => {
    it('returns the task-list route when from is a different string', () => {
      const request = { query: { from: 'somewhere-else' } }
      expect(getCommonRedirectLink(request)).toBe('/marine-licence/task-list')
    })

    it('returns the task-list route when from is absent from query', () => {
      const request = { query: {} }
      expect(getCommonRedirectLink(request)).toBe('/marine-licence/task-list')
    })

    it('returns the task-list route when query is undefined', () => {
      const request = { query: undefined }
      expect(getCommonRedirectLink(request)).toBe('/marine-licence/task-list')
    })

    it('returns the task-list route when query is absent', () => {
      const request = {}
      expect(getCommonRedirectLink(request)).toBe('/marine-licence/task-list')
    })
  })
})

describe('withCheckYourAnswersQuery', () => {
  it('adds the query when the user came from check your answers', () => {
    const request = { query: { from: 'check-your-answers' } }
    expect(withCheckYourAnswersQuery(request, '/marine-licence/page')).toBe(
      '/marine-licence/page?from=check-your-answers'
    )
  })

  it('returns the path unchanged otherwise', () => {
    expect(
      withCheckYourAnswersQuery({ query: {} }, '/marine-licence/page')
    ).toBe('/marine-licence/page')
  })
})
