import { ErrorTracking } from './error-tracking/error-tracking.js'
import Clarity from '@microsoft/clarity'
import {
  Button,
  Checkboxes,
  createAll,
  ErrorSummary,
  FileUpload,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'
import { SortableTable } from '@ministryofjustice/frontend'

import { AddAnotherPoint } from './add-another-point/index.js'
import { SiteDetailsMap } from './site-details-map/index.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)
createAll(FileUpload)
createAll(SortableTable)

function syncClarityConsent() {
  if (
    globalThis.clarity &&
    typeof globalThis.clarity === 'function' &&
    typeof globalThis.ANALYTICS_ENABLED === 'boolean'
  ) {
    try {
      globalThis.clarity('consent', globalThis.ANALYTICS_ENABLED)
    } catch {
      // Silently handle Clarity consent errors
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (globalThis.ENABLE_BROWSER_LOGGING) {
    const errorTracking = new ErrorTracking()
    errorTracking.init()
  }
  if (globalThis.CLARITY_PROJECT_ID) {
    Clarity.init(globalThis.CLARITY_PROJECT_ID)
    syncClarityConsent()
  }

  const addAnotherElements = document.querySelectorAll(
    '[data-module="add-another-point"]'
  )
  for (const element of addAnotherElements) {
    new AddAnotherPoint(element) // eslint-disable-line no-new
  }

  const mapElements = document.querySelectorAll(
    '[data-module="site-details-map"]'
  )
  for (const element of mapElements) {
    new SiteDetailsMap(element) // eslint-disable-line no-new
  }
})
