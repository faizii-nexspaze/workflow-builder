# UI Enhancement Plan for Workflow Builder

## 1. UI Libraries & Assets
- **Angular Material**: Used (see @angular/material, @angular/cdk in package.json, indigo-pink theme in angular.json)
- **Bootstrap 5**: Used (see bootstrap in package.json, included in angular.json styles)
- **Custom SCSS**: Multiple global and feature stylesheets (styles.scss, _colors.scss, _material.scss, _flow.scss)
- **Icons**: Material icons (mat-icon), custom SVGs (see assets/github.svg)

## 2. Global Styles & Theme
- Color tokens in _colors.scss (gray, blue scales)
- Typography: Roboto, Helvetica Neue, sans-serif (styles.scss)
- Spacing: Utility classes (flex-space), consistent box-sizing
- Material and Bootstrap themes both present

## 3. Component Structure
- Feature modules: e.g., stepmaster.module.ts
- Shared components: icon-button, form-builder
- SCSS per component, some inline styles (e.g., workflow-sidebar)
- Data flow: Inputs/outputs, services (step.service.ts, workflow.service.ts)

## 4. Design System Consistency
- Buttons: Mix of Material, Bootstrap, and custom styles
- Forms: Material form fields, custom and Bootstrap forms
- Tables: Noted in step-list, likely Bootstrap or custom
- Modals: Custom and Bootstrap modal classes
- Feedback: No clear global toasts/snackbars yet
- States: Some hover/focus, but not fully standardized
- Accessibility: Some ARIA/roles, but not consistent

## 5. Enhancement Checklist
- [ ] Harmonize typography, spacing, and color usage
- [ ] Standardize button hierarchy and states
- [ ] Align form field spacing, labels, and validation
- [ ] Polish tables: density, headers, empty states
- [ ] Unify modal/drawer padding, close affordances
- [ ] Add/align feedback (toasts, inline errors)
- [ ] Improve accessibility: roles, ARIA, focus, keyboard nav
- [ ] Responsive: ensure layouts adapt, no unwanted scroll
- [ ] Polish: icon sizes, border radii, shadows, empty/loading states
- [ ] Lint, test, build, and manual smoke test after each change

## 6. Change Strategy
- Prefer class-based, non-breaking style changes
- DOM structure stable where events/queries depend on it
- No public API, routing, or logic changes
- Small, isolated commits per feature area
- Document trade-offs in this file or as code comments

---

This plan will be updated as enhancements are applied. Each commit will reference the relevant checklist item(s) and affected feature area.
