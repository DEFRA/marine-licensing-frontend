import { getActivityOptions } from '#src/server/marine-licence/site-details/select-activity/utils.js'

describe('#selectActivity utils (marine licence)', () => {
  describe('#getActivityOptions', () => {
    test('should handle known activity type', () => {
      expect(getActivityOptions('construction')).toEqual(expect.any(Object))
      expect(getActivityOptions('deposit')).toEqual(expect.any(Object))
      expect(getActivityOptions('removal')).toEqual(expect.any(Object))
    })

    test('should handle unknown activity type', () => {
      const result = getActivityOptions('test')
      expect(result).toEqual([])
    })
  })
})
