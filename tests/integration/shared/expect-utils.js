/* eslint-env jest */

import { getByRole, getByText, within } from '@testing-library/dom'
import {
  getFieldsetByLabel,
  getInputInFieldset
} from '~/tests/integration/shared/dom-helpers.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

export const expectDateInputValues = ({
  document,
  fieldsetLabel,
  day,
  month,
  year
}) => {
  expectFieldsetInputValue({
    document,
    fieldsetLabel,
    inputLabel: 'Day',
    value: day
  })
  expectFieldsetInputValue({
    document,
    fieldsetLabel,
    inputLabel: 'Month',
    value: month
  })
  expectFieldsetInputValue({
    document,
    fieldsetLabel,
    inputLabel: 'Year',
    value: year
  })
}

export const expectFieldsetInputValue = ({
  document,
  fieldsetLabel,
  inputLabel,
  value
}) => {
  const input = getInputInFieldset({
    document,
    fieldsetLabel,
    inputLabel
  })
  expect(input).toHaveValue(value)
}

export const expectFieldsetError = ({
  document,
  fieldsetLabel,
  errorMessage
}) => {
  const errorSummary = within(document).getByRole('alert')
  within(errorSummary).getByRole('heading', {
    level: 2,
    name: 'There is a problem'
  })
  const errorSummaryLink = within(errorSummary).getByRole('link', {
    name: errorMessage
  })

  const fieldset = getFieldsetByLabel({
    document,
    fieldsetLabel
  })
  within(fieldset).getByText(errorMessage)

  // confirm that the error summary link correctly references an input within the fieldset
  const fieldsetId = errorSummaryLink.getAttribute('href')
  const input = fieldset.querySelector(fieldsetId)
  expect(input).toBeInTheDocument()
}

export const expectNoFieldsetError = ({
  document,
  fieldsetLabel,
  errorMessage
}) => {
  const errorSummary = within(document).queryByRole('alert')
  if (errorSummary) {
    expect(
      within(errorSummary).queryByRole('link', {
        name: errorMessage
      })
    ).not.toBeInTheDocument()
  }
  const fieldset = getFieldsetByLabel({
    document,
    fieldsetLabel
  })
  expect(within(fieldset).queryByText(errorMessage)).not.toBeInTheDocument()
}

/* use expectFieldsetError instead */
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
