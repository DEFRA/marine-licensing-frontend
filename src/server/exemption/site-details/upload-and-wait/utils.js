/**
 * Is the file upload for multiple site
 * @param {object} coordinateData - Extracted coordinate data
 * @returns {boolean} True for multiple sites
 */
export const isMultipleSitesFile = (coordinateData) =>
  coordinateData.featureCount > 1
