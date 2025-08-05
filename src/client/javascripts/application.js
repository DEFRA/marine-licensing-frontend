import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  FileUpload,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'
import clarity from '@microsoft/clarity'

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
    // eslint-disable-next-line no-new
    new AddAnotherPoint(element)
  })

  const mapElements = document.querySelectorAll(
    '[data-module="site-details-map"]'
  )
  mapElements.forEach((element) => {
    // eslint-disable-next-line no-new
    new SiteDetailsMap(element)
  })
})
if (window.CLARITY_PROJECT_ID) {
  clarity.init(window.CLARITY_PROJECT_ID)
}
