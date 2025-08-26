import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Project Details Card Component', () => {
  /** @type {CheerioAPI} */
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: false
      })
    })

    test('Should render project details card component', () => {
      expect($component('#project-details-card')).toHaveLength(1)
    })

    test('Should display project name', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Test Marine Project')
    })

    test('Should show Change link when not read-only', () => {
      expect(
        $component('.govuk-summary-card__actions a').text().trim()
      ).toContain('Change')
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Project details'
      )
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('project-details-card', {
        projectName: 'Test Marine Project',
        isReadOnly: true
      })
    })

    test('Should render project details card component', () => {
      expect($component('#project-details-card')).toHaveLength(1)
    })

    test('Should display project name', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Test Marine Project')
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Project details'
      )
    })
  })
})

/**
 * @import { CheerioAPI } from 'cheerio'
 */
