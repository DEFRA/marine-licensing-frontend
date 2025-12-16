import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { within } from '@testing-library/dom'
import { validatePublicRegister } from '#tests/integration/shared/summary-card-validators.js'

describe('Public Register Card Component', () => {
  describe('Applicant is viewing exemption', () => {
    describe('When consent is "yes"', () => {
      const renderComponent = (params) => {
        return renderComponentJSDOM('public-register-card', {
          publicRegister: {
            consent: 'yes'
          },
          isApplicantView: true,
          isReadOnly: true,
          ...params
        })
      }

      test('Should have correct card title', () => {
        const component = renderComponent()
        expect(
          within(component).getByRole('heading', { level: 2 })
        ).toHaveTextContent('Sharing your project information publicly')
      })

      test('Should display "Yes" for consent to publish', () => {
        const component = renderComponent()
        validatePublicRegister(component, {
          publicRegister: {
            'Consent to publish your project information': 'Yes'
          }
        })
      })

      test('Should not display reason field when consent is "yes"', () => {
        const component = renderComponent()
        expect(
          within(component).queryByText('Why you do not consent')
        ).not.toBeInTheDocument()
      })

      test('should not show a change link when read-only', () => {
        const component = renderComponent()
        expect(
          within(component).queryByRole('link', {
            name: /Change/
          })
        ).not.toBeInTheDocument()
      })

      test('should show a change link when not read-only', () => {
        const component = renderComponent({ isReadOnly: false })
        expect(
          within(component).getByRole('link', {
            name: /Change/
          })
        ).toHaveAttribute(
          'href',
          '/exemption/sharing-your-project-information-publicly?from=check-your-answers'
        )
      })
    })

    describe('When consent is "no"', () => {
      const renderComponent = (params) => {
        return renderComponentJSDOM('public-register-card', {
          publicRegister: {
            consent: 'no',
            reason: 'Commercial sensitivity - contains proprietary information'
          },
          isApplicantView: true,
          isReadOnly: true,
          ...params
        })
      }

      test('Should have correct card title', () => {
        const component = renderComponent()
        expect(
          within(component).getByRole('heading', { level: 2 })
        ).toHaveTextContent('Sharing your project information publicly')
      })

      test('Should display "No" for consent to publish, and the reason', () => {
        const component = renderComponent()
        validatePublicRegister(component, {
          publicRegister: {
            'Consent to publish your project information': 'No',
            'Why you do not consent':
              'Commercial sensitivity - contains proprietary information'
          }
        })
      })

      test("should show nothing in the reason field if one wasn't provided", () => {
        const component = renderComponent({ publicRegister: { consent: 'no' } })
        validatePublicRegister(component, {
          publicRegister: {
            'Consent to publish your project information': 'No',
            'Why you do not consent': ''
          }
        })
      })

      test('should not show a change link when read-only', () => {
        const component = renderComponent()
        expect(
          within(component).queryByRole('link', {
            name: /Change/
          })
        ).not.toBeInTheDocument()
      })

      test('should show a change link when not read-only', () => {
        const component = renderComponent({ isReadOnly: false })
        expect(
          within(component).getByRole('link', {
            name: /Change/
          })
        ).toHaveAttribute(
          'href',
          '/exemption/sharing-your-project-information-publicly?from=check-your-answers'
        )
      })
    })
  })

  describe('Internal user or public user is viewing exemption', () => {
    describe('When consent is "yes"', () => {
      const renderComponent = (params) => {
        return renderComponentJSDOM('public-register-card', {
          publicRegister: {
            consent: 'yes'
          },
          isApplicantView: false,
          isReadOnly: true,
          ...params
        })
      }

      test('Should have correct card title', () => {
        const component = renderComponent()
        expect(
          within(component).getByRole('heading', { level: 2 })
        ).toHaveTextContent('Sharing project information publicly')
      })

      test('Should display "Yes" for consent to publish', () => {
        const component = renderComponent()
        validatePublicRegister(component, {
          publicRegister: {
            'Consent to publish project information': 'Yes'
          }
        })
      })

      test('Should not display reason field when consent is "yes"', () => {
        const component = renderComponent()
        expect(
          within(component).queryByText('Why you do not consent')
        ).not.toBeInTheDocument()
      })

      test('should not show a change link when read-only', () => {
        const component = renderComponent()
        expect(
          within(component).queryByRole('link', {
            name: /Change/
          })
        ).not.toBeInTheDocument()
      })

      test('should show a change link when not read-only', () => {
        const component = renderComponent({ isReadOnly: false })
        expect(
          within(component).getByRole('link', {
            name: /Change/
          })
        ).toHaveAttribute(
          'href',
          '/exemption/sharing-your-project-information-publicly?from=check-your-answers'
        )
      })
    })

    describe('When consent is "no"', () => {
      const renderComponent = (params) => {
        return renderComponentJSDOM('public-register-card', {
          publicRegister: {
            consent: 'no',
            reason: 'Commercial sensitivity - contains proprietary information'
          },
          isApplicantView: false,
          isReadOnly: true,
          ...params
        })
      }

      test('Should have correct card title', () => {
        const component = renderComponent()
        expect(
          within(component).getByRole('heading', { level: 2 })
        ).toHaveTextContent('Sharing project information publicly')
      })

      test('Should display "No" for consent to publish, and the reason', () => {
        const component = renderComponent()
        validatePublicRegister(component, {
          publicRegister: {
            'Consent to publish project information': 'No',
            'Why the applicant did not consent':
              'Commercial sensitivity - contains proprietary information'
          }
        })
      })

      test('should not show a change link when read-only', () => {
        const component = renderComponent()
        expect(
          within(component).queryByRole('link', {
            name: /Change/
          })
        ).not.toBeInTheDocument()
      })

      test('should show a change link when not read-only', () => {
        const component = renderComponent({ isReadOnly: false })
        expect(
          within(component).getByRole('link', {
            name: /Change/
          })
        ).toHaveAttribute(
          'href',
          '/exemption/sharing-your-project-information-publicly?from=check-your-answers'
        )
      })
    })
  })
})
