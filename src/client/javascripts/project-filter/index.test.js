// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProjectFilter } from './index.js'

describe('ProjectFilter', () => {
  let $module, component

  function createFilterHtml({
    hasForm = true,
    hasSubmitButton = true,
    selectedFilter = 'my-projects',
    rows = [
      { name: 'My Project', isOwn: true },
      { name: 'Other Project', isOwn: false }
    ]
  } = {}) {
    const radiosHtml = `
      <div class="govuk-form-group govuk-!-margin-bottom-3">
        <div class="govuk-radios govuk-radios--inline" data-module="app-project-filter">
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="filter-my" name="filter"
                   type="radio" value="my-projects"
                   ${selectedFilter === 'my-projects' ? 'checked' : ''}>
            <label class="govuk-label govuk-radios__label" for="filter-my">
              My projects
            </label>
          </div>
          <div class="govuk-radios__item">
            <input class="govuk-radios__input" id="filter-all" name="filter"
                   type="radio" value="all-projects"
                   ${selectedFilter === 'all-projects' ? 'checked' : ''}>
            <label class="govuk-label govuk-radios__label" for="filter-all">
              All Test Org projects
            </label>
          </div>
        </div>
      </div>
    `

    const submitButtonHtml = hasSubmitButton
      ? `<button type="submit" class="govuk-button govuk-button--secondary app-filter-submit">Update results</button>`
      : ''

    const formHtml = hasForm
      ? `<form method="post" class="app-filter-form" novalidate>
          ${radiosHtml}
          ${submitButtonHtml}
        </form>`
      : radiosHtml

    const rowsHtml = rows
      .map(
        (row) => `
      <tr class="govuk-table__row app-project-row" data-is-own-project="${row.isOwn}">
        <td class="govuk-table__cell">${row.name}</td>
        <td class="govuk-table__cell">Draft</td>
      </tr>
    `
      )
      .join('')

    return `
      <div>
        ${formHtml}
        <table class="govuk-table" id="ex-projects-table">
          <tbody class="govuk-table__body">
            ${rowsHtml}
          </tbody>
        </table>
        <p class="govuk-body app-empty-message govuk-!-display-none">
          There are no projects to display.
        </p>
      </div>
    `
  }

  beforeEach(() => {
    document.body.innerHTML = createFilterHtml()
    $module = document.querySelector('[data-module="app-project-filter"]')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('constructor', () => {
    it('should set element from constructor parameter', () => {
      component = new ProjectFilter($module)
      expect(component.element).toBe($module)
    })

    it('should find parent form element', () => {
      component = new ProjectFilter($module)
      expect(component.form).toBeInstanceOf(HTMLFormElement)
      expect(component.form.classList.contains('app-filter-form')).toBe(true)
    })

    it('should find submit button within form', () => {
      component = new ProjectFilter($module)
      expect(component.submitButton).toBeInstanceOf(HTMLButtonElement)
      expect(
        component.submitButton.classList.contains('app-filter-submit')
      ).toBe(true)
    })

    it('should find all radio inputs', () => {
      component = new ProjectFilter($module)
      expect(component.radios).toHaveLength(2)
      expect(component.radios[0].value).toBe('my-projects')
      expect(component.radios[1].value).toBe('all-projects')
    })

    it('should find all project rows', () => {
      component = new ProjectFilter($module)
      expect(component.rows).toHaveLength(2)
      expect(component.rows[0].classList.contains('app-project-row')).toBe(true)
    })

    it('should find table element', () => {
      component = new ProjectFilter($module)
      expect(component.table).toBeInstanceOf(HTMLTableElement)
      expect(component.table.id).toBe('ex-projects-table')
    })

    it('should find empty message element', () => {
      component = new ProjectFilter($module)
      expect(component.emptyMessage).toBeInstanceOf(HTMLParagraphElement)
      expect(
        component.emptyMessage.classList.contains('app-empty-message')
      ).toBe(true)
    })

    it('should handle missing form element gracefully', () => {
      document.body.innerHTML = createFilterHtml({ hasForm: false })
      $module = document.querySelector('[data-module="app-project-filter"]')

      expect(() => new ProjectFilter($module)).not.toThrow()
      component = new ProjectFilter($module)
      expect(component.form).toBeNull()
    })

    it('should handle missing submit button gracefully', () => {
      document.body.innerHTML = createFilterHtml({ hasSubmitButton: false })
      $module = document.querySelector('[data-module="app-project-filter"]')

      expect(() => new ProjectFilter($module)).not.toThrow()
      component = new ProjectFilter($module)
      expect(component.submitButton).toBeNull()
    })

    it('should call init method', () => {
      const initSpy = vi.spyOn(ProjectFilter.prototype, 'init')
      component = new ProjectFilter($module)
      expect(initSpy).toHaveBeenCalled()
      initSpy.mockRestore()
    })
  })

  describe('init', () => {
    it('should hide submit button by adding govuk-!-display-none class', () => {
      component = new ProjectFilter($module)
      expect(
        component.submitButton.classList.contains('govuk-!-display-none')
      ).toBe(true)
    })

    it('should not throw if submit button is missing', () => {
      document.body.innerHTML = createFilterHtml({ hasSubmitButton: false })
      $module = document.querySelector('[data-module="app-project-filter"]')

      expect(() => new ProjectFilter($module)).not.toThrow()
    })

    it('should remove govuk-!-margin-bottom-3 from form group', () => {
      component = new ProjectFilter($module)
      const formGroup = document.querySelector('.govuk-form-group')
      expect(formGroup.classList.contains('govuk-!-margin-bottom-3')).toBe(
        false
      )
    })

    it('should not throw if form group is missing', () => {
      document.body.innerHTML = createFilterHtml({ hasForm: false })
      $module = document.querySelector('[data-module="app-project-filter"]')

      expect(() => new ProjectFilter($module)).not.toThrow()
    })

    it('should add change event listeners to radio buttons', () => {
      const addEventListenerSpy = vi.spyOn(
        HTMLInputElement.prototype,
        'addEventListener'
      )
      component = new ProjectFilter($module)

      const changeCalls = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'change'
      )
      expect(changeCalls.length).toBeGreaterThanOrEqual(2)

      addEventListenerSpy.mockRestore()
    })
  })

  describe('filterProjects', () => {
    beforeEach(() => {
      component = new ProjectFilter($module)
    })

    it('should show all rows when "all-projects" is selected', () => {
      component.filterProjects('all-projects')

      const rows = document.querySelectorAll('.app-project-row')
      rows.forEach((row) => {
        expect(row.classList.contains('govuk-!-display-none')).toBe(false)
      })
    })

    it('should hide non-own project rows when "my-projects" is selected', () => {
      component.filterProjects('my-projects')

      const otherProjectRow = document.querySelector(
        '[data-is-own-project="false"]'
      )
      expect(otherProjectRow.classList.contains('govuk-!-display-none')).toBe(
        true
      )
    })

    it('should show own project rows when "my-projects" is selected', () => {
      component.filterProjects('my-projects')

      const ownProjectRow = document.querySelector(
        '[data-is-own-project="true"]'
      )
      expect(ownProjectRow.classList.contains('govuk-!-display-none')).toBe(
        false
      )
    })

    it('should add govuk-!-display-none class to hidden rows', () => {
      component.filterProjects('my-projects')

      const hiddenRow = document.querySelector('[data-is-own-project="false"]')
      expect(hiddenRow.classList.contains('govuk-!-display-none')).toBe(true)
    })

    it('should remove govuk-!-display-none class from visible rows', () => {
      const ownProjectRow = document.querySelector(
        '[data-is-own-project="true"]'
      )
      ownProjectRow.classList.add('govuk-!-display-none')

      component.filterProjects('all-projects')

      expect(ownProjectRow.classList.contains('govuk-!-display-none')).toBe(
        false
      )
    })

    it('should handle rows with only own projects', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'My Project 1', isOwn: true },
          { name: 'My Project 2', isOwn: true }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')

      const rows = document.querySelectorAll('.app-project-row')
      rows.forEach((row) => {
        expect(row.classList.contains('govuk-!-display-none')).toBe(false)
      })
    })

    it('should handle rows with only other projects', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'Other Project 1', isOwn: false },
          { name: 'Other Project 2', isOwn: false }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')

      const rows = document.querySelectorAll('.app-project-row')
      rows.forEach((row) => {
        expect(row.classList.contains('govuk-!-display-none')).toBe(true)
      })
    })

    it('should handle empty rows', () => {
      document.body.innerHTML = createFilterHtml({ rows: [] })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      expect(() => component.filterProjects('my-projects')).not.toThrow()
    })
  })

  describe('radio button change events', () => {
    beforeEach(() => {
      component = new ProjectFilter($module)
    })

    it('should call filterProjects when radio selection changes to all-projects', () => {
      const filterSpy = vi.spyOn(component, 'filterProjects')

      const allProjectsRadio = document.querySelector('#filter-all')
      allProjectsRadio.dispatchEvent(new Event('change'))

      expect(filterSpy).toHaveBeenCalledWith('all-projects')
    })

    it('should call filterProjects when radio selection changes to my-projects', () => {
      const filterSpy = vi.spyOn(component, 'filterProjects')

      const myProjectsRadio = document.querySelector('#filter-my')
      myProjectsRadio.dispatchEvent(new Event('change'))

      expect(filterSpy).toHaveBeenCalledWith('my-projects')
    })

    it('should filter correctly when switching from my-projects to all-projects', () => {
      component.filterProjects('my-projects')
      const otherProjectRow = document.querySelector(
        '[data-is-own-project="false"]'
      )
      expect(otherProjectRow.classList.contains('govuk-!-display-none')).toBe(
        true
      )

      const allProjectsRadio = document.querySelector('#filter-all')
      allProjectsRadio.dispatchEvent(new Event('change'))

      expect(otherProjectRow.classList.contains('govuk-!-display-none')).toBe(
        false
      )
    })

    it('should filter correctly when switching from all-projects to my-projects', () => {
      component.filterProjects('all-projects')
      const otherProjectRow = document.querySelector(
        '[data-is-own-project="false"]'
      )
      expect(otherProjectRow.classList.contains('govuk-!-display-none')).toBe(
        false
      )

      const myProjectsRadio = document.querySelector('#filter-my')
      myProjectsRadio.dispatchEvent(new Event('change'))

      expect(otherProjectRow.classList.contains('govuk-!-display-none')).toBe(
        true
      )
    })
  })

  describe('multiple project scenarios', () => {
    it('should correctly filter mixed ownership projects', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'My Draft', isOwn: true },
          { name: 'Colleague Draft', isOwn: false },
          { name: 'My Active', isOwn: true },
          { name: 'Colleague Active', isOwn: false }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')

      const rows = document.querySelectorAll('.app-project-row')
      expect(rows[0].classList.contains('govuk-!-display-none')).toBe(false)
      expect(rows[1].classList.contains('govuk-!-display-none')).toBe(true)
      expect(rows[2].classList.contains('govuk-!-display-none')).toBe(false)
      expect(rows[3].classList.contains('govuk-!-display-none')).toBe(true)
    })

    it('should show all projects regardless of ownership when all-projects selected', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'My Draft', isOwn: true },
          { name: 'Colleague Draft', isOwn: false },
          { name: 'My Active', isOwn: true },
          { name: 'Colleague Active', isOwn: false }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('all-projects')

      const rows = document.querySelectorAll('.app-project-row')
      rows.forEach((row) => {
        expect(row.classList.contains('govuk-!-display-none')).toBe(false)
      })
    })
  })

  describe('table and empty message visibility', () => {
    it('should show table and hide empty message when there are visible rows', () => {
      component = new ProjectFilter($module)

      component.filterProjects('all-projects')

      const table = document.querySelector('#ex-projects-table')
      const emptyMessage = document.querySelector('.app-empty-message')
      expect(table.classList.contains('govuk-!-display-none')).toBe(false)
      expect(emptyMessage.classList.contains('govuk-!-display-none')).toBe(true)
    })

    it('should hide table and show empty message when no rows are visible', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'Other Project 1', isOwn: false },
          { name: 'Other Project 2', isOwn: false }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')

      const table = document.querySelector('#ex-projects-table')
      const emptyMessage = document.querySelector('.app-empty-message')
      expect(table.classList.contains('govuk-!-display-none')).toBe(true)
      expect(emptyMessage.classList.contains('govuk-!-display-none')).toBe(
        false
      )
    })

    it('should show table when switching from no visible rows to visible rows', () => {
      document.body.innerHTML = createFilterHtml({
        rows: [
          { name: 'Other Project 1', isOwn: false },
          { name: 'Other Project 2', isOwn: false }
        ]
      })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')
      const table = document.querySelector('#ex-projects-table')
      const emptyMessage = document.querySelector('.app-empty-message')
      expect(table.classList.contains('govuk-!-display-none')).toBe(true)
      expect(emptyMessage.classList.contains('govuk-!-display-none')).toBe(
        false
      )

      component.filterProjects('all-projects')
      expect(table.classList.contains('govuk-!-display-none')).toBe(false)
      expect(emptyMessage.classList.contains('govuk-!-display-none')).toBe(true)
    })

    it('should handle empty rows showing empty message', () => {
      document.body.innerHTML = createFilterHtml({ rows: [] })
      $module = document.querySelector('[data-module="app-project-filter"]')
      component = new ProjectFilter($module)

      component.filterProjects('my-projects')

      const table = document.querySelector('#ex-projects-table')
      const emptyMessage = document.querySelector('.app-empty-message')
      expect(table.classList.contains('govuk-!-display-none')).toBe(true)
      expect(emptyMessage.classList.contains('govuk-!-display-none')).toBe(
        false
      )
    })
  })
})
