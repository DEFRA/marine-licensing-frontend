import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Public Register Card Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    describe('When consent is "yes"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'yes'
          },
          isReadOnly: false
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "Yes" for consent to publish', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Consent to publish your project information'
        )
        expect(htmlContent).toContain('Yes')
      })

      test('Should not display reason field when consent is "yes"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).not.toContain('Why you do not consent')
      })

      test('Should show Change link when not read-only', () => {
        expect(
          $component('.govuk-summary-card__actions a').text().trim()
        ).toContain('Change')
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Sharing your project information publicly'
        )
      })
    })

    describe('When consent is "no"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'no',
            reason: 'Commercial sensitivity - contains proprietary information'
          },
          isReadOnly: false
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "No" for consent to publish', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Consent to publish your project information'
        )
        expect(htmlContent).toContain('No')
      })

      test('Should display reason field when consent is "no"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why you do not consent')
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
          'Sharing your project information publicly'
        )
      })
    })

    describe('When consent is "no" but no reason provided', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'no'
            // No reason provided
          },
          isReadOnly: false
        })
      })

      test('Should display empty reason field', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why you do not consent')
        // Should show the field but with empty content due to default('')
      })
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    describe('When consent is "yes"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'yes'
          },
          isReadOnly: true
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "Yes" for consent to publish', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Consent to publish your project information'
        )
        expect(htmlContent).toContain('Yes')
      })

      test('Should not display reason field when consent is "yes"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).not.toContain('Why you do not consent')
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Sharing your project information publicly'
        )
      })
    })

    describe('When consent is "no"', () => {
      beforeEach(() => {
        $component = renderComponent('public-register-card', {
          publicRegister: {
            consent: 'no',
            reason: 'Legal privilege - contains confidential legal advice'
          },
          isReadOnly: true
        })
      })

      test('Should render public register card component', () => {
        expect($component('#public-register-card')).toHaveLength(1)
      })

      test('Should display "No" for consent to publish', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain(
          'Consent to publish your project information'
        )
        expect(htmlContent).toContain('No')
      })

      test('Should display reason field when consent is "no"', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Why you do not consent')
        expect(htmlContent).toContain(
          'Legal privilege - contains confidential legal advice'
        )
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Sharing your project information publicly'
        )
      })
    })
  })
})
