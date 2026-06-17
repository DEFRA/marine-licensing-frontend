import { isMcmsHost } from './is-mcms-host.js'

export function isDownloadablePdf(url) {
  if (!url) {
    return false
  }
  try {
    return isMcmsHost(new URL(url).host)
  } catch {
    return false
  }
}

export function withAnswersLinkType(mcmsContext) {
  if (!mcmsContext) {
    return mcmsContext
  }
  return {
    ...mcmsContext,
    isDownloadablePdf: isDownloadablePdf(mcmsContext.pdfDownloadUrl)
  }
}
