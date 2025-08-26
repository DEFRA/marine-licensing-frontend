import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Public Register Card Component', () => {
  /** @type {CheerioAPI} */
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    describe('When consent is "no"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'no'
          },
          isReadOnly: false
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "No" for information withheld', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Information withheld from public register'
        )
        expect(htmlContent).toContain('No')
      })

      test('Should not display reason field when consent is "no"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).not.toContain(
          'Why the information should be withheld'
        )
      })

      test('Should show Change link when not read-only', () => {
        expect(
          $component('.govuk-summary-card__actions a').text().trim()
        ).toContain('Change')
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Public register'
        )
      })
    })

    describe('When consent is "yes"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'yes',
            reason: 'Commercial sensitivity - contains proprietary information'
          },
          isReadOnly: false
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "Yes" for information withheld', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Information withheld from public register'
        )
        expect(htmlContent).toContain('Yes')
      })

      test('Should display reason field when consent is "yes"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why the information should be withheld')
        expect(htmlContent).toContain(
          'Commercial sensitivity - contains proprietary information'
        )
      })

      test('Should show Change link when not read-only', () => {
        expect(
          $component('.govuk-summary-card__actions a').text().trim()
        ).toContain('Change')
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Public register'
        )
      })
    })

    describe('When consent is "yes" but no reason provided', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'yes'
            // No reason provided
          },
          isReadOnly: false
        })
      })

      test('Should display empty reason field', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why the information should be withheld')
        // Should show the field but with empty content due to default('')
      })
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    describe('When consent is "no"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'no'
          },
          isReadOnly: true
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "No" for information withheld', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Information withheld from public register'
        )
        expect(htmlContent).toContain('No')
      })

      test('Should not display reason field when consent is "no"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).not.toContain(
          'Why the information should be withheld'
        )
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Public register'
        )
      })
    })

    describe('When consent is "yes"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'yes',
            reason: 'Legal privilege - contains confidential legal advice'
          },
          isReadOnly: true
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "Yes" for information withheld', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Information withheld from public register'
        )
        expect(htmlContent).toContain('Yes')
      })

      test('Should display reason field when consent is "yes"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why the information should be withheld')
        expect(htmlContent).toContain(
          'Legal privilege - contains confidential legal advice'
        )
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Public register'
        )
      })
    })
  })
})
