import { ErrorTracking } from './error-tracking/error-tracking.js'
import {
  Button,
  Checkboxes,
  createAll,
  ErrorSummary,
  FileUpload,
  Radios,
  ServiceNavigation,
  SkipLink
} from 'govuk-frontend'
import { SortableTable } from '@ministryofjustice/frontend'

import { AccessibleAutocomplete } from './accessible-autocomplete/index.js'
import { AddAnotherPoint } from './add-another-point/index.js'
import { BackLinkHistory } from './back-link-history/index.js'
import { MojFilter } from './moj-filter/index.js'
import { IatAnswerPrint } from './iat-answer-print/index.js'
import { SiteDetailsMap } from './site-details-map/index.js'
import { RedactionField } from './redaction-field/index.js'
import { WithholdLocation } from './withhold-location/index.js'
import { initCookieConsent } from './cookie-consent/index.js'
import { initClarity } from './clarity/index.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(ServiceNavigation)
createAll(Radios)
createAll(SkipLink)
createAll(FileUpload)
createAll(SortableTable)
createAll(AccessibleAutocomplete)

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent()

  if (globalThis.ENABLE_BROWSER_LOGGING) {
    const errorTracking = new ErrorTracking()
    errorTracking.init()
  }
  initClarity()

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

  const backLinkHistoryElements = document.querySelectorAll(
    '[data-module="app-back-link-history"]'
  )
  for (const element of backLinkHistoryElements) {
    new BackLinkHistory(element) // eslint-disable-line no-new
  }

  const printElements = document.querySelectorAll(
    '[data-module="iat-answer-print"]'
  )
  for (const element of printElements) {
    new IatAnswerPrint(element) // eslint-disable-line no-new
  }

  const redactionFieldElements = document.querySelectorAll(
    '[data-module="redaction-field"]'
  )
  for (const element of redactionFieldElements) {
    new RedactionField(element) // eslint-disable-line no-new
  }

  const withholdLocationElements = document.querySelectorAll(
    '[data-module="withhold-location"]'
  )
  for (const element of withholdLocationElements) {
    new WithholdLocation(element) // eslint-disable-line no-new
  }

  // eslint-disable-next-line no-new
  new MojFilter() // nosonar
})
