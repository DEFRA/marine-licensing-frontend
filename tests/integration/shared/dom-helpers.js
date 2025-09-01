/**
 * DOM manipulation and assertion helpers for integration tests
 * Provides utilities for common DOM operations and validations
 * @jest-environment jsdom
 */

/* eslint-env jest */

import { within } from '@testing-library/dom'

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

/**
 * Finds an element by text content within a container
 * @param {Element} container - Container element to search within
 * @param {string} text - Text to search for
 * @param {object} [options] - Search options
 * @param {boolean} [options.exact] - Whether to match exact text
 * @returns {Element|null} Found element or null
 */
export const findByText = (container, text, options = { exact: true }) => {
  const elements = container.querySelectorAll('*')
  return (
    Array.from(elements).find((element) => {
      const elementText = element.textContent.trim()
      return options.exact ? elementText === text : elementText.includes(text)
    }) ?? null
  )
}

/**
 * Validates that an element contains expected text
 * @param {Element} element - Element to check
 * @param {string} expectedText - Expected text content
 * @param {boolean} [exact] - Whether to match exact text
 */
export const validateElementText = (element, expectedText, exact = true) => {
  expect(element).toBeTruthy()
  const actualText = element.textContent.trim()
  if (exact) {
    expect(actualText).toBe(expectedText)
  } else {
    expect(actualText).toContain(expectedText)
  }
}

/**
 * Validates that an element has expected attributes
 * @param {Element} element - Element to check
 * @param {object} expectedAttributes - Object with attribute name-value pairs
 */
export const validateElementAttributes = (element, expectedAttributes) => {
  expect(element).toBeTruthy()
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value)
  })
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
