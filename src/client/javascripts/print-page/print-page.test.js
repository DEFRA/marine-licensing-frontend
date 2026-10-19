// @vitest-environment jsdom
import { vi } from 'vitest'

import { initPrintPage } from './index.js'

describe('initPrintPage', () => {
  beforeEach(() => {
    window.print = vi.fn()
  })

  test('calls window.print and prevents default on click', () => {
    const a = document.createElement('a')
    a.setAttribute('href', '#')
    document.body.appendChild(a)

    initPrintPage(a)

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

    initPrintPage(button)

    expect(button.hidden).toBe(false)
  })

  test('reveals the surrounding print controls that are hidden until JavaScript runs', () => {
    const controls = document.createElement('div')
    controls.dataset.printPageControls = ''
    controls.hidden = true
    const button = document.createElement('button')
    controls.appendChild(button)
    document.body.appendChild(controls)

    initPrintPage(button)

    expect(controls.hidden).toBe(false)
  })

  test('does not throw or bind when given null', () => {
    expect(() => initPrintPage(null)).not.toThrow()
    expect(window.print).not.toHaveBeenCalled()
  })
})
