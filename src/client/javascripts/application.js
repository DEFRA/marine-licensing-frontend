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

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)
createAll(FileUpload)

if (window.CLARITY_PROJECT_ID) {
  clarity.init(window.CLARITY_PROJECT_ID)
}
