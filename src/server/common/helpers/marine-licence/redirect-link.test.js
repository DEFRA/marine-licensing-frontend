import { getCommonRedirectLink } from './redirect-link.js'

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
