# FamilyBoard for TRMNL
A smart family dashboard for TRMNL powered by Google Calendar and Google Apps Script.

## Features
- 📅 Next 5 days
- 🏕️ Ongoing multi-day events
- 📆 Next Week summary
- 👨‍👩‍👦‍👦 Family-oriented layout
- ⚡ Optimized for e-ink displays

## Preview

(à venir)

## Installation

Prerequisite: Node.js 20 or later.

```bash
npm install
```

## Tests

Run the automated tests with:

```bash
npm test
```

The current suite contains 60 tests covering `EventClassifier`,
`PersonResolver`, deterministic date helpers in `DateUtils`, the TRMNL payload
size guard, and `SchoolSchedule` (timetable selection, next course, dashboard
DTO, payload, after-20:00 rollover, and school webhook push).

## Local development and Apps Script

Git is the source of truth and manages the code history. Clasp only synchronizes
the contents of `appsscript/` with the existing Google Apps Script project.

1. Log in with `npx clasp login` if needed.
2. Copy `.clasp.example.json` to `.clasp.json` and replace the placeholder with
   the existing project's Script ID. Never run `clasp create` for this project.
3. Check the files clasp considers synchronizable with `npm run gas:status`.
4. Run `npm test`, review `git status` and `git diff`, then explicitly deploy
   with `npm run gas:push`.

Configure these two Apps Script Script Properties without adding their values to
the repository:

- `TRMNL_WEBHOOK_URL`: used by `pushDashboardToTrmnl()` to feed FamilyBoard.
- `TRMNL_SCHOOL_WEBHOOK_URL`: used by `pushSchoolScheduleToTrmnl()` to feed the
  school schedule screen.

The school screen is intended to be refreshed by a daily Apps Script trigger
after 20:00, so it displays the next relevant school day. To inspect the remote
code safely before a deployment, pull it into a temporary directory and compare
that directory with `appsscript/`. Use `npm run gas:pull` in the repository only
when intentionally replacing local Apps Script files after reviewing the remote
version.

The repository can be opened in VS Code with `code .`; no extension is required.

## Roadmap

(à venir)
