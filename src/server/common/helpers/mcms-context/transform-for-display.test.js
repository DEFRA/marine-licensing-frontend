import { activityTypes } from '~/src/server/common/constants/mcms-context.js'
import { transformMcmsContextForDisplay } from '~/src/server/common/helpers/mcms-context/transform-for-display.js'

describe('transformMcmsContextForDisplay', () => {
  it('should return correct labels for each activity type when used in transform function', () => {
    Object.entries(activityTypes).forEach(([key, expectedActivityType]) => {
      const mockContext = { activityType: key }
      const result = transformMcmsContextForDisplay(mockContext)
      expect(result.activityType.label).toBe(expectedActivityType.label)
      expect(result.activityType.value).toBe(expectedActivityType.value)
    })
  })

  it('should add purpose label for CON activity type', () => {
    const mockContext = { activityType: 'CON', article: '25' }
    const result = transformMcmsContextForDisplay(mockContext)

    expect(result.activityType.purpose).toBe('Moorings or aids to navigation')
  })

  it('should add purpose label for DEPOSIT activity type', () => {
    const mockContext = { activityType: 'DEPOSIT', article: '13' }
    const result = transformMcmsContextForDisplay(mockContext)

    expect(result.activityType.purpose).toBe(
      'Shellfish propagation or cultivation'
    )
  })

  it('should add purpose label for REMOVAL activity type', () => {
    const mockContext = { activityType: 'REMOVAL', article: '17A' }
    const result = transformMcmsContextForDisplay(mockContext)

    expect(result.activityType.purpose).toBe('Samples for testing or analysis')
  })

  it('should add purpose label for DREDGE activity type', () => {
    const mockContext = { activityType: 'DREDGE', article: '18A' }
    const result = transformMcmsContextForDisplay(mockContext)

    expect(result.activityType.purpose).toBe('Navigational dredging')
  })

  it('should handle activity types without purposes', () => {
    const mockContext = { activityType: 'INCINERATION' }
    const result = transformMcmsContextForDisplay(mockContext)

    expect(result.activityType.purpose).toBeUndefined()
  })
})
