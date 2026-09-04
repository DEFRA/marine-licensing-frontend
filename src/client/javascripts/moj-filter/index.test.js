// @vitest-environment jsdom
import { describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { FilterToggleButton } from '@ministryofjustice/frontend'
import { MojFilter } from './index.js'

vi.mock('@ministryofjustice/frontend', () => ({
  FilterToggleButton: vi.fn(),
  SortableTable: vi.fn()
}))

const buildSelectedFiltersMarkup = ({
  withClearLink = true,
  tags = []
} = {}) => `
    <div class="moj-filter__selected">
      <div class="moj-filter__selected-heading">
        <div class="moj-filter__heading-title">
          <h2 class="govuk-heading-m">Selected filters</h2>
        </div>
        ${
          withClearLink
            ? '<div class="moj-filter__heading-action"><p><a class="govuk-link govuk-link--no-visited-state" href="/projects">Clear filters</a></p></div>'
            : ''
        }
      </div>
      ${
        tags.length
          ? `<h3 class="govuk-heading-s govuk-!-margin-bottom-0">Status</h3>
      <ul class="moj-filter-tags">
        ${tags
          .map(
            ({ field, value, text }) => `
        <li>
          <a class="moj-filter__tag" href="#" data-field="${field}" data-value="${value}">
            <span class="govuk-visually-hidden">Remove this filter</span>
            ${text}</a>
        </li>`
          )
          .join('')}
      </ul>`
          : ''
      }
    </div>
  `

describe('MojFilter', () => {
  let assignSpy
  let fetchMock
  let originalLocation

  const buildFilterMarkup = ({ withClearLink = true } = {}) => `
      <form class="app-filter-form" action="/projects">
        <input type="hidden" name="csrfToken" value="test-token" />
        <div data-module="moj-filter">
          ${buildSelectedFiltersMarkup({ withClearLink })}
          <input type="radio" name="show" value="all-projects" checked />
          <input type="radio" name="show" value="my-projects" />
          <input type="checkbox" name="status" value="ACTIVE" checked />
        </div>
        <div id="app-project-results"></div>
      </form>
      <div id="app-project-results-status"></div>
    `

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        `<div id="app-project-results"></div>${buildSelectedFiltersMarkup({
          tags: [{ field: 'status', value: 'ACTIVE', text: 'Active' }]
        })}`
    })
    vi.stubGlobal('fetch', fetchMock)

    originalLocation = window.location

    assignSpy = vi.fn()

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy }
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('when the root element is missing or not a div', () => {
    test('should not throw when no element matches the moj-filter selector', () => {
      document.body.innerHTML = ''

      expect(() => new MojFilter()).not.toThrow()
      expect(FilterToggleButton).not.toHaveBeenCalled()
    })
  })

  describe('when the root element is present', () => {
    test('should create a FilterToggleButton with the root element', () => {
      document.body.innerHTML = '<div data-module="moj-filter"></div>'
      const $root = document.querySelector('[data-module="moj-filter"]')
      const init = () => new MojFilter()
      init()

      expect(FilterToggleButton).toHaveBeenCalledWith($root, expect.any(Object))
    })
  })

  describe('onSubmit behaviour', () => {
    test('should not send submit request twice when already submitting', async () => {
      document.body.innerHTML = buildFilterMarkup()

      const init = () => new MojFilter()
      init()

      const $form = document.querySelector('form')

      $form.dispatchEvent(new Event('submit', { cancelable: true }))
      $form.dispatchEvent(new Event('submit', { cancelable: true }))

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Clear filters link', () => {
    test('should not navigate and should reset the form when clicked', async () => {
      document.body.innerHTML = buildFilterMarkup()

      const init = () => new MojFilter()
      init()

      const $clearLink = document.querySelector('.moj-filter__heading-action a')
      $clearLink.click()

      const $tag = await vi.waitFor(() => {
        const tag = document.querySelector(
          '.moj-filter__selected .moj-filter__tag'
        )
        expect(tag).not.toBeNull()
        return tag
      })

      const $myProjectsRadio = document.querySelector(
        'input[value="my-projects"]'
      )
      const $allProjectsRadio = document.querySelector(
        'input[value="all-projects"]'
      )
      const $statusCheckbox = document.querySelector(
        'input[type="checkbox"][name="status"]'
      )

      expect($myProjectsRadio.checked).toBe(true)
      expect($allProjectsRadio.checked).toBe(false)
      expect($statusCheckbox.checked).toBe(false)
      expect(assignSpy).not.toHaveBeenCalled()

      expect($tag.dataset.field).toBe('status')
      expect($tag.dataset.value).toBe('ACTIVE')
    })

    test('should not navigate when the clear filters link is not present in the DOM', () => {
      document.body.innerHTML = buildFilterMarkup({ withClearLink: false })

      const submitSpy = vi
        .spyOn(HTMLFormElement.prototype, 'submit')
        .mockImplementation(() => {})

      expect(() => new MojFilter()).not.toThrow()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(assignSpy).not.toHaveBeenCalled()
      expect(submitSpy).not.toHaveBeenCalled()
    })
  })

  describe('selected filters swap', () => {
    test('should leave the existing selected filters unchanged when the response has none', async () => {
      document.body.innerHTML = buildFilterMarkup()

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '<div id="app-project-results"></div>'
      })

      const $selectedFiltersBefore = document.querySelector(
        '.moj-filter__selected'
      ).innerHTML

      const mojFilter = new MojFilter()

      const $form = document.querySelector('form')
      $form.dispatchEvent(new Event('submit', { cancelable: true }))

      await vi.waitFor(() => {
        expect(mojFilter.isSubmitting).toBe(false)
      })

      expect(document.querySelector('.moj-filter__selected').innerHTML).toBe(
        $selectedFiltersBefore
      )
    })
  })

  describe('onTagRemove', () => {
    const buildTagMarkup = ({
      tagAttributes = 'data-field="status" data-value="ACTIVE"',
      checkboxAttributes = 'name="status" value="ACTIVE" checked'
    } = {}) => `
      <form class="app-filter-form" action="/projects">
        <input type="hidden" name="csrfToken" value="test-token" />
        <div data-module="moj-filter">
          <div class="moj-filter__selected">
            <a class="moj-filter__tag" href="#" ${tagAttributes}>Active</a>
          </div>
          ${checkboxAttributes ? `<input type="checkbox" ${checkboxAttributes} />` : ''}
        </div>
        <div id="app-project-results"></div>
      </form>
      <div id="app-project-results-status"></div>
    `

    const clickTag = () => {
      const $tag = document.querySelector('.moj-filter__tag')
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })
      $tag.dispatchEvent(event)
      return event
    }

    test('should uncheck the matching checkbox and resubmit the form when a filter tag is clicked', () => {
      document.body.innerHTML = buildTagMarkup()

      const requestSubmitSpy = vi
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => {})

      const mojFilter = new MojFilter()
      mojFilter.initSelectedFilterTags()

      const $checkbox = document.querySelector(
        'input[name="status"][value="ACTIVE"]'
      )

      const event = clickTag()

      expect(event.defaultPrevented).toBe(true)
      expect($checkbox.checked).toBe(false)
      expect(requestSubmitSpy).toHaveBeenCalledTimes(1)
    })

    test('should not resubmit the form when the tag is missing data-field or data-value', () => {
      document.body.innerHTML = buildTagMarkup({
        tagAttributes: 'data-field="status"'
      })

      const requestSubmitSpy = vi
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => {})

      const mojFilter = new MojFilter()
      mojFilter.initSelectedFilterTags()

      const $checkbox = document.querySelector(
        'input[name="status"][value="ACTIVE"]'
      )

      clickTag()

      expect($checkbox.checked).toBe(true)
      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    test('should not resubmit the form when no checkbox matches the tag', () => {
      document.body.innerHTML = buildTagMarkup({ checkboxAttributes: null })

      const requestSubmitSpy = vi
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => {})

      const mojFilter = new MojFilter()
      mojFilter.initSelectedFilterTags()

      clickTag()

      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })

    test('should not resubmit the form when selected filters is not in the dom', () => {
      document.body.innerHTML = `
        <div data-module="moj-filter"></div>
        <div id="app-project-results"></div>
        <div id="app-project-results-status"></div>`

      const requestSubmitSpy = vi
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => {})

      const mojFilter = new MojFilter()
      mojFilter.initSelectedFilterTags()

      expect(requestSubmitSpy).not.toHaveBeenCalled()
    })
  })

  describe('announceResultCount', () => {
    test('should set the status text to the number of rendered result rows', () => {
      document.body.innerHTML = `
        <div data-module="moj-filter"></div>
        <div id="app-project-results">
          <div class="app-project-row"></div>
          <div class="app-project-row"></div>
        </div>
        <div id="app-project-results-status"></div>
      `

      const mojFilter = new MojFilter()
      mojFilter.announceResultCount()

      const $status = document.getElementById('app-project-results-status')
      expect($status.textContent).toBe('2 results')
    })

    test('should use the singular wording when there is exactly one result', () => {
      document.body.innerHTML = `
        <div data-module="moj-filter"></div>
        <div id="app-project-results">
          <div class="app-project-row"></div>
        </div>
        <div id="app-project-results-status"></div>
      `

      const mojFilter = new MojFilter()
      mojFilter.announceResultCount()

      const $status = document.getElementById('app-project-results-status')
      expect($status.textContent).toBe('1 result')
    })
  })
})
