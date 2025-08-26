---
description: GOV.UK Frontend
globs: *.njk, *.js
alwaysApply: true
---
# GOV UK Frontend

## Tech Stack
- Node.js + Hapi.js
- govuk-frontend npm library
- Nunjucks templates

## Template Structure
- Use layouts/page.njk as base template
- Follow GDS template hierarchy
- Required template blocks:
  - pageTitle: Page title
  - content: Main content area
- Use govuk-width-container for page layout
- Use govuk-main-wrapper for main content
- Use govuk-grid-row and govuk-grid-column-* for grid layouts
- Use <nav> element for back links (accessibility)

## Template Inheritance
- Always use search path style imports (e.g. {% extends "layouts/page.njk" %})
- Never use relative paths in extends/include statements
- Base template is at src/server/common/templates/layouts/page.njk
- Feature templates should be in src/server/{feature}/views/
- Common components in src/server/common/components/

## Component Usage
- Use GDS components with data-module="govuk-button" where needed
- Follow GDS class naming:
  - Headings: govuk-heading-xl, govuk-heading-l, etc.
  - Body text: govuk-body
  - Tables: govuk-table with appropriate child classes
  - Buttons: govuk-button, govuk-button--warning for variants
  - Forms: govuk-form-group, govuk-input, etc.
  - Error handling: govuk-error-message, govuk-error-summary

## Content Guidelines
- Follow GDS content patterns
- Use appropriate heading hierarchy
- Ensure accessible content structure
- Include proper ARIA roles and attributes
- Use semantic HTML elements

## Error Handling
- Use consistent error templates
- Display user-friendly error messages
- Include status codes where appropriate
- Provide clear next steps for users

## Navigation
- Use buildNavigation helper for consistent nav
- Implement breadcrumbs where appropriate
- Clear call-to-action buttons
- Logical page flow

## Nunjucks Filters
- Custom filters located in src/config/nunjucks/filters/
- Each filter should have its own file
- Common filters:
  - formatDate
  - formatCurrency
  - markdown (for content formatting)
