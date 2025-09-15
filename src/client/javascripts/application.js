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

import { AddAnotherPoint } from './add-another-point/index.js'
import { SiteDetailsMap } from './site-details-map/index.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)
createAll(FileUpload)

function syncClarityConsent() {
  if (
    window.clarity &&
    typeof window.clarity === 'function' &&
    typeof window.ANALYTICS_ENABLED === 'boolean'
  ) {
    try {
      window.clarity('consent', window.ANALYTICS_ENABLED)
    } catch {
      // Silently handle Clarity consent errors
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.CLARITY_PROJECT_ID) {
    Clarity.init(window.CLARITY_PROJECT_ID)
    syncClarityConsent()
  }

  const addAnotherElements = document.querySelectorAll(
    '[data-module="add-another-point"]'
  )
  addAnotherElements.forEach((element) => {
    new AddAnotherPoint(element) // eslint-disable-line no-new
  })

  const mapElements = document.querySelectorAll(
    '[data-module="site-details-map"]'
  )
  mapElements.forEach((element) => {
    new SiteDetailsMap(element) // eslint-disable-line no-new
  })
})
