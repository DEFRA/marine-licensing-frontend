import { describe, expect, it } from 'vitest'
import { getCancelLink } from './cancel-link.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('getCancelLink', () => {
  it('should return cancel link when action is undefined', () => {
    const result = getCancelLink(undefined)
    expect(result).toBe(routes.TASK_LIST + '?cancel=site-details')
  })

  it('should return cancel link when action is falsy', () => {
    const result = getCancelLink(null)
    expect(result).toBe(routes.TASK_LIST + '?cancel=site-details')
  })

  it('should return cancel link when action is empty string', () => {
    const result = getCancelLink('')
    expect(result).toBe(routes.TASK_LIST + '?cancel=site-details')
  })

  it('should return undefined when action has a value', () => {
    const result = getCancelLink('edit')
    expect(result).toBeUndefined()
  })

  it('should return undefined when action is any truthy string', () => {
    const result = getCancelLink('some-action')
    expect(result).toBeUndefined()
  })
})
