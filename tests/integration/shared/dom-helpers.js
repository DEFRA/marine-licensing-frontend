// @vitest-environment jsdom

/* eslint-env vitest */

import { getAllByRole, getByRole, within } from '@testing-library/dom'

/**
 * Validates that no "Change" links are present (read-only mode)
 * @param {Document} document - JSDOM document
 */
export const validateReadOnlyBehavior = (document) => {
  // Verify no "Change" links are present (read-only mode)
  const changeLinks = document.querySelectorAll('a[href*="change"]')
  expect(changeLinks).toHaveLength(0)

  // Verify no submit button is present
  const submitButton = document.querySelector('button[type="submit"]')
  expect(submitButton).toBeNull()
}

/**
 * Validates submission section elements (for editable forms)
 * @param {Document} document - JSDOM document
 * @param {object} expected - Expected page content
 * @param {string} expected.submitButton - Expected submit button text
 */
export const validateSubmissionSection = (document, expected) => {
  const confirmButton = document.querySelector('#confirm-and-send')
  expect(confirmButton.textContent.trim()).toBe(expected.submitButton)
}

export const getInputInFieldset = ({ document, fieldsetLabel, inputLabel }) => {
  const fieldset = getFieldsetByLabel({ document, fieldsetLabel })
  return within(fieldset).getByLabelText(inputLabel)
}

export const getFieldsetByLabel = ({ document, fieldsetLabel }) =>
  within(document)
    .getByText(fieldsetLabel, {
      selector: 'legend'
    })
    .closest('fieldset')

export const getExemptionsTableRow = ({ document, name }) => {
  const table = getByRole(document, 'table', { name: 'Projects' })
  expect(table).toBeInTheDocument()
  const row = getByRole(table, 'cell', {
    name
  }).closest('tr')
  return getAllByRole(row, 'cell')
}
