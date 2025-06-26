import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { AddAnother } from '@ministryofjustice/frontend/moj/components/add-another/add-another.mjs'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

document.addEventListener('DOMContentLoaded', function () {
  const addAnotherElements = document.querySelectorAll(
    '[data-module="moj-add-another"]'
  )
  addAnotherElements.forEach(function (element) {
    // eslint-disable-next-line no-new
    new AddAnother(element)
  })
})
