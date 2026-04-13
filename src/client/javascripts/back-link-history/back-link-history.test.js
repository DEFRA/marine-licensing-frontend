// @vitest-environment jsdom
import { vi } from 'vitest'

import { BackLinkHistory } from './index.js'

describe('BackLinkHistory', () => {
  let element

  beforeEach(() => {
    document.body.innerHTML =
      '<a class="govuk-back-link" href="#" data-module="app-back-link-history">Back</a>'
    element = document.querySelector('[data-module="app-back-link-history"]')
  })

  test('clicking the link calls window.history.back and prevents default navigation', () => {
    const historyBack = vi
      .spyOn(window.history, 'back')
      .mockImplementation(() => {})

    new BackLinkHistory(element) // eslint-disable-line no-new

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault')

    element.dispatchEvent(clickEvent)

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(historyBack).toHaveBeenCalledOnce()

    historyBack.mockRestore()
  })
})
