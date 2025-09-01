import { activityTypes } from '~/src/server/common/constants/mcms-context.js'
import { transformMcmsContextForDisplay } from '~/src/server/common/helpers/mcms-context/transform-for-display.js'

describe('transformMcmsContextForDisplay', () => {
  it('should return correct labels for each activity type when used in transform function', () => {
    Object.entries(activityTypes).forEach(([key, expectedActivityType]) => {
      const mockContext = { activityType: key }
      const result = transformMcmsContextForDisplay(mockContext)

      expect(result.activityType).toEqual(expectedActivityType)
      expect(result.activityType.label).toBe(expectedActivityType.label)
      expect(result.activityType.value).toBe(expectedActivityType.value)
    })
  })
})
