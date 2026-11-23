# Meeting notes, 2026-11-23

Decisions and changes from the review meeting. Add new items at the bottom.

## Working method

- From now on one agent at a time, not several in parallel.
- Phase B continues from where it stands: B1 (new deal fields, backend) first, then the rest in order.

## Changes to build

| Id | Change | Status |
|---|---|---|
| M1 | Partner categories become two: Distributor and Channel partner. Channel partner is the default. System integrator is removed everywhere (the change category dialog, the partner and application forms, document audience rules, filters, seed data, tests). Existing system integrator partners become channel partners. | Open, starts after B1 lands because both touch the database |
| M2 | CRM is not final: it may be HubSpot or Zoho CRM. Keep the integration flexible and decide later. Nothing is changed for now. New work keeps CRM specifics inside the integration layer (`src/server/hubspot/*`, the provisioning script) and keeps schema, DTOs and screens CRM-neutral, so a Zoho adapter could be added behind the same interface. Product owner to decide later. | Open, waiting for the product owner |
| M3 | Regions will grow, and staff admins must be able to add regions in the portal. Today regions are fixed in code: partner regions India, Middle East and Elsewhere; deal regions India and Middle East; staff regions India, Middle East and All. The website partners page groups partners into Asia Pacific (India, Singapore, Indonesia), Middle East and Africa (UAE, Qatar, Kenya), Europe (Nordics, UK) and North America (USA). Proposal: a regions table (key, label, active, sort order, countries) managed on a staff screen, replacing the fixed lists in `lib/domain.ts`; partner, deal, application and staff region fields point at it; countries map to a region so a new application routes to the right manager. Needs a decision on the region list and on how a region is tied to partner managers. | Open, design to confirm with the product owner |
| M4 | A full Overview dashboard in both logins (partner and staff) with KPIs, pie or donut charts, bar and line charts, top deals and top partners tables. Proposal written up in the chat on 2026-11-23: data layer first, then chart primitives, then the partner overview, then the staff overview, then filters. Needs three decisions: chart approach, default period, and whether it replaces the current Overview or adds tabs. | Open, proposal to confirm |
| M4a | Decided 2026-11-23: dashboard charts are custom SVG components built on `d3-scale` and `d3-shape` (no charting library, no Tailwind). Palette validated with the dataviz validator, colour follows the entity (product colours), table view for accessibility, hover tooltips. Default period 90 days, 12 month trends. Replaces the current Overview, keeping its tiles and lists as the top section. Build order: O1 data layer and demo history, O2 chart components, O3 partner Overview, O4 staff Overview, O5 filters and polish. | Decided, in progress |
