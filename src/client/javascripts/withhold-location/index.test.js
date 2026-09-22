// @vitest-environment jsdom
import { describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { WithholdLocation } from './index.js'
import { RedactionField } from '../redaction-field/index.js'
import { SiteDetailsMap } from '../site-details-map/index.js'

vi.mock('govuk-frontend', () => ({
  Component: class {
    constructor($root) {
      this.$root = $root
    }
  }
}))

vi.mock('../redaction-field/index.js', () => ({
  RedactionField: vi.fn()
}))

vi.mock('../site-details-map/index.js', () => ({
  SiteDetailsMap: vi.fn()
}))

const buildCard = ({ withheld = false } = {}) => `
  <div class="govuk-summary-card" id="site-details-2" data-module="withhold-location">
    <div class="app-redaction-field" data-module="redaction-field"></div>
    ${withheld ? '' : '<div class="app-site-details-map" data-module="site-details-map"></div>'}
    <form class="app-withhold-location__form" method="post" action="/redact">
      <input type="hidden" name="fieldKey" value="siteDetails.withholdLocation" />
      <input type="hidden" name="index" value="1" />
      <input type="hidden" name="withhold" value="${withheld ? 'false' : 'true'}" />
      <input type="hidden" name="csrfToken" value="test-token" />
      <button type="submit" class="app-withhold__button">
        ${withheld ? 'Display location' : 'Withhold location'}
      </button>
    </form>
  </div>
`

const buildPageResponse = (options) =>
  `<html lang="en"><body><main>${buildCard(options)}</main></body></html>`

const submitForm = ($form) =>
  $form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

const cardOf = () => document.querySelector('#site-details-2')

describe('WithholdLocation', () => {
  let $root
  let component
  let fetchMock

  beforeEach(() => {
    document.body.innerHTML = buildCard()
    $root = cardOf()
    component = new WithholdLocation($root)

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(buildPageResponse({ withheld: true }))
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  test('posts the withhold payload instead of navigating', async () => {
    submitForm(component.$form)

    await vi.waitFor(() =>
      expect(
        cardOf().querySelector('.app-withhold__button').textContent
      ).toContain('Display location')
    )
    expect(fetchMock).toHaveBeenCalledWith(
      component.$form.action,
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
    )

    const [, options] = fetchMock.mock.calls[0]
    expect(options.body.toString()).toBe(
      new URLSearchParams({
        fieldKey: 'siteDetails.withholdLocation',
        index: '1',
        withhold: 'true',
        csrfToken: 'test-token'
      }).toString()
    )

    expect(cardOf()).not.toBe($root)
    expect($root.isConnected).toBe(false)
    expect(cardOf().querySelector('.app-site-details-map')).toBeNull()
  })

  test('focuses the button on the swapped-in card', async () => {
    submitForm(component.$form)

    await vi.waitFor(() =>
      expect(document.activeElement).toBe(
        cardOf().querySelector('.app-withhold__button')
      )
    )
  })

  test('re-creates the nested components', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(buildPageResponse({ withheld: false }))
    })

    submitForm(component.$form)
    await vi.waitFor(() => expect(RedactionField).toHaveBeenCalled())

    expect(RedactionField).toHaveBeenCalledWith(
      cardOf().querySelector('[data-module="redaction-field"]')
    )
    expect(SiteDetailsMap).toHaveBeenCalledWith(
      cardOf().querySelector('[data-module="site-details-map"]')
    )
  })

  test('creates no map component when the response withholds the location', async () => {
    submitForm(component.$form)
    await vi.waitFor(() => expect(RedactionField).toHaveBeenCalled())

    expect(SiteDetailsMap).not.toHaveBeenCalled()
  })

  test('handles errors correctly', async () => {
    fetchMock.mockResolvedValue({ ok: false })

    submitForm(component.$form)

    await vi.waitFor(() => expect(component.$button.disabled).toBe(false))

    expect(cardOf()).toBe($root)
  })

  test('ignores a second submit while one is already in flight', async () => {
    let resolveFetch
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    submitForm(component.$form)
    submitForm(component.$form)

    resolveFetch({
      ok: true,
      text: () => Promise.resolve(buildPageResponse({ withheld: true }))
    })
    await vi.waitFor(() => expect(cardOf()).not.toBe($root))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
