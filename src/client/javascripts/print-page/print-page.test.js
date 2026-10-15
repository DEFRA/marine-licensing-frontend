// @vitest-environment jsdom
import { vi } from 'vitest'

import { PrintPage } from './index.js'

describe('PrintPage', () => {
  beforeEach(() => {
    window.print = vi.fn()
  })

  test('calls window.print and prevents default on click', () => {
    const a = document.createElement('a')
    a.setAttribute('href', '#')
    document.body.appendChild(a)

    new PrintPage(a) // eslint-disable-line no-new

    const event = new MouseEvent('click', {
      cancelable: true,
      bubbles: true
    })
    a.dispatchEvent(event)

    expect(window.print).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  test('reveals a control that is hidden until JavaScript runs', () => {
    const button = document.createElement('button')
    button.hidden = true
    document.body.appendChild(button)

    new PrintPage(button) // eslint-disable-line no-new

    expect(button.hidden).toBe(false)
  })

  test('does not throw or bind when given null', () => {
    expect(() => new PrintPage(null)).not.toThrow()
    expect(window.print).not.toHaveBeenCalled()
  })
})
