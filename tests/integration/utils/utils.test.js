import { getByRole, getByText, within } from '@testing-library/dom'

export const validateErrors = (expectedErrors, document) => {
  const errorSummary = getByRole(document, 'alert')
  expect(errorSummary).toBeInTheDocument()
  expect(getByText(errorSummary, 'There is a problem')).toBeInTheDocument()

  expectedErrors.forEach(({ field, message, summaryMessage }) => {
    const summaryList = within(errorSummary).getByRole('list')
    const summaryLink = within(summaryList).getByText(summaryMessage || message)
    expect(summaryLink).toBeInTheDocument()
    expect(summaryLink).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`^#${field}`))
    )

    const fieldContainer = document.getElementById(field)
    expect(fieldContainer).toBeInTheDocument()

    const errorMessage = getByText(
      fieldContainer.closest('.govuk-form-group') ?? fieldContainer,
      message,
      { exact: false }
    )
    expect(errorMessage).toBeInTheDocument()

    const formGroup = fieldContainer.closest('.govuk-form-group')
    const hasErrorStyling =
      formGroup?.classList.contains('govuk-form-group--error') ??
      fieldContainer.querySelectorAll('.govuk-input--error').length > 0
    expect(hasErrorStyling).toBe(true)
  })
}
