// @vitest-environment jsdom
import { vi } from 'vitest'

import { IatAnswerPrint } from './index.js'

describe('IatAnswerPrint', () => {
  beforeEach(() => {
    window.print = vi.fn()
  })

  test('calls window.print and prevents default on click', () => {
    const a = document.createElement('a')
    a.setAttribute('href', '#')
    document.body.appendChild(a)

    new IatAnswerPrint(a) // eslint-disable-line no-new

    const event = new MouseEvent('click', {
      cancelable: true,
      bubbles: true
    })
    a.dispatchEvent(event)

    expect(window.print).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  test('does not throw or bind when given null', () => {
    expect(() => new IatAnswerPrint(null)).not.toThrow()
    expect(window.print).not.toHaveBeenCalled()
  })
})
