import clarity from '@microsoft/clarity'
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

document.addEventListener('DOMContentLoaded', () => {
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
if (window.CLARITY_PROJECT_ID) {
  clarity.init(window.CLARITY_PROJECT_ID)
}
