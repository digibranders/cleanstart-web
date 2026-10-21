# Studio build progress

One line per event, newest at the bottom. Anyone can read where the build is by reading the last lines.

## How to write to this file

- **Append only.** Never edit, reorder or delete an existing line, including your own mistakes. Correct a wrong line by appending a new one that says so.
- **One shell append per line**, so several sessions and subagents can write at the same time without overwriting each other:

  ```bash
  printf '%s\n' "2026-10-21 15:40 IST | T0.2 | done | main | 1a2b3c4 | A ok, B ok, C ok | Tailwind, fonts and root layout" >> docs/studio/PROGRESS.md
  ```

  Never open this file in an editor tool or rewrite it with Write or Edit: a full rewrite can wipe a line another agent appended a moment earlier.
- **Format:** `date time IST | task | status | who | commit | gates | note`
  - `date time IST`: `date '+%Y-%m-%d %H:%M IST'` (set `TZ=Asia/Kolkata`).
  - `task`: the task id from the plan (`T0.2`, `T1.15`, `T2.3`), or `PHASE-1` for a phase event, or `SPEC` for a doc change.
  - `status`: exactly one of `started`, `done`, `blocked`, `review-fix`, `skipped`, `signed-off`.
  - `who`: `main` for the orchestrating session, `sub-<task>` for a subagent (for example `sub-T2.3`).
  - `commit`: the short sha of the commit that finished the task, or `-`.
  - `gates`: for `done`, the Gate A, B and C results (`A ok, B ok, C ok`, or `C n/a` when nothing renders); otherwise `-`.
  - `note`: one short sentence. For `blocked`, say what blocks it and what question was asked. No pipes, no line breaks, no em-dashes or en-dashes.
- Append `started` when you begin a task, and `done` (or `blocked`, `skipped`) when you stop. A `done` line is written only after the task's commit exists.
- Subagents append their own lines. Only the orchestrating session commits; it stages this file by path with the task's commit.

## Log

2026-10-16 18:00 IST | T0.1 | done | main | 5af6b991 | C n/a | Decisions D-1 to D-9 recorded in the master plan
2026-10-19 13:00 IST | SPEC | done | main | 4144d8ca | - | Direction B adopted: Geist, Phosphor Light, ink buttons, ultramarine, floating sheet
2026-10-19 16:00 IST | SPEC | done | main | 97af1819 | - | Kinetic headline sign-in approved
2026-10-21 12:30 IST | SPEC | done | main | d3ed9980 | - | Spec hardened: docs 06 to 09, plan code verified in a scratch copy
