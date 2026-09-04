import { FilterToggleButton, SortableTable } from '@ministryofjustice/frontend'
import { createAll } from 'govuk-frontend'

const FETCH_TIMEOUT_MS = 8000
const CLEAR_LINK_SELECTOR = '.moj-filter__heading-action a'

const SELECTED_FILTERS_SELECTOR = '.moj-filter__selected'
const TAG_SELECTOR = '.moj-filter__tag'

export class MojFilter {
  constructor() {
    this.$root = document.querySelector('[data-module="moj-filter"]')

    if (!(this.$root instanceof HTMLDivElement)) {
      return
    }

    this.filterToggleButton = new FilterToggleButton(this.$root, {
      bigModeMediaQuery: '(min-width: 48.0625em)',
      startHidden: true,
      toggleButton: {
        showText: 'Show filter',
        hideText: 'Hide filter',
        classes: 'govuk-button--secondary'
      },
      closeButton: {
        text: 'Close'
      }
    })

    // CSS only reveals the panel once this is set, so a slow-loading bundle never
    // leaves it visible before the toggle button has decided the correct state
    this.$root.classList.add('app-filter-ready')

    this.$form = this.$root.closest('form')
    this.$results = document.getElementById('app-project-results')
    this.$status = document.getElementById('app-project-results-status')
    this.$submitButton = this.$form?.querySelector('[type="submit"]')
    this.isSubmitting = false

    if (this.$form instanceof HTMLFormElement && this.$results) {
      this.$form.addEventListener('submit', (event) => this.onSubmit(event))
    }

    this.initClearFiltersLink()
  }

  async onSubmit(event, { clear = false } = {}) {
    event.preventDefault()

    // Guard from a user submitting the form
    if (this.isSubmitting) {
      return
    }

    this.isSubmitting = true
    this.$submitButton?.setAttribute('disabled', 'disabled')

    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(this.$form.action, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: clear
          ? new URLSearchParams({
              csrfToken: this.$form.elements.csrfToken.value
            })
          : new URLSearchParams(new FormData(this.$form)),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`Unexpected response from dashboard filter`)
      }

      const template = document.createElement('template')
      template.innerHTML = await response.text()

      const $newResults = template.content.getElementById('app-project-results')
      this.$results.innerHTML = $newResults.innerHTML

      const $newSelectedFilters = template.content.querySelector(
        SELECTED_FILTERS_SELECTOR
      )

      const $selectedFilters = this.$root.querySelector(
        SELECTED_FILTERS_SELECTOR
      )

      if ($newSelectedFilters && $selectedFilters) {
        $selectedFilters.innerHTML = $newSelectedFilters.innerHTML
      }

      createAll(SortableTable, undefined, this.$results)

      this.initClearFiltersLink()
      this.announceResultCount()
      this.initSelectedFilterTags()
    } catch {
      // On failure, reset page or submit form without JS as a fallback
      if (clear) {
        window.location.assign(this.$form.action)
      } else {
        this.$form.submit()
      }
    } finally {
      clearTimeout(timeout)
      this.isSubmitting = false
      this.$submitButton?.removeAttribute('disabled')
    }
  }

  initSelectedFilterTags() {
    const $selectedFilters = this.$root.querySelector(SELECTED_FILTERS_SELECTOR)
    if (!$selectedFilters) {
      return
    }

    for (const $tag of $selectedFilters.querySelectorAll(TAG_SELECTOR)) {
      $tag.addEventListener('click', (event) => this.onTagRemove(event))
    }
  }

  onTagRemove(event) {
    event.preventDefault()

    // data-value and data-field will contain remove details
    const { field, value } = event.currentTarget.dataset
    if (!field || !value) {
      return
    }

    const $checkbox = this.$form.querySelector(
      `input[name="${field}"][value="${value}"]`
    )

    if ($checkbox) {
      $checkbox.checked = false
      this.$form.requestSubmit()
    }
  }

  initClearFiltersLink() {
    const $clearLink = this.$root.querySelector(CLEAR_LINK_SELECTOR)

    if (!$clearLink) {
      return
    }

    $clearLink.addEventListener('click', (event) => {
      event.preventDefault()

      this.resetForm()
      this.onSubmit(event, { clear: true })
    })
  }

  resetForm() {
    // Reset 'show' value
    const $myProjectsRadio = this.$form.querySelector(
      'input[value="my-projects"]'
    )
    $myProjectsRadio.checked = true

    for (const $checkbox of this.$form.querySelectorAll(
      'input[type="checkbox"]'
    )) {
      $checkbox.checked = false
    }
  }

  announceResultCount() {
    // Accessibility to allow screen readers to announce the results of a fetch
    const count = this.$results.querySelectorAll('.app-project-row').length
    this.$status.textContent = count === 1 ? '1 result' : `${count} results`
  }

  static moduleName = 'moj-filter'
}
