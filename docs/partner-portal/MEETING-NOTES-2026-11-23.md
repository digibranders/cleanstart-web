# Meeting notes, 2026-11-23

Decisions and changes from the review meeting. Add new items at the bottom.

## Working method

- From now on one agent at a time, not several in parallel.
- Phase B continues from where it stands: B1 (new deal fields, backend) first, then the rest in order.

## Changes to build

| Id | Change | Status |
|---|---|---|
| M1 | Partner categories become two: Distributor and Channel partner. Channel partner is the default. System integrator is removed everywhere (the change category dialog, the partner and application forms, document audience rules, filters, seed data, tests). Existing system integrator partners become channel partners. | Open, starts after B1 lands because both touch the database |
