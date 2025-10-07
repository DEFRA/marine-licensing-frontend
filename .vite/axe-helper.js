import { axe } from 'vitest-axe'

/**
 * Runs axe accessibility checks against a DOM node
 * @param {Element} container - The DOM element to test
 * @param {Object} options - Axe configuration options
 * @returns {Promise<Object>} Axe results
 */
export async function runAxeChecks(container, options = {}) {
  const results = await axe(container, options)
  return results
}
