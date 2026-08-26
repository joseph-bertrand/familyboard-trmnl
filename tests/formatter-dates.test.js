const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

const { Formatter } = loadAppsScript(
  [
    "Config.gs",
    "Constants.gs",
    "DateUtils.gs",
    "EventClassifier.gs",
    "PersonResolver.gs",
    "Formatter.gs"
  ],
  ["Formatter"]
);

function event(title, start, options = {}) {
  const startDate = new Date(start);

  return {
    id: title,
    title,
    start: startDate,
    end: new Date(startDate.getTime() + 60 * 60 * 1000),
    allDay: false,
    location: "",
    description: "",
    ...options
  };
}

test("builds compact labels and dates from a fixed Tuesday", () => {
  const now = new Date("2026-08-18T06:00:00Z");
  const events = [
    event("Événement 1", "2026-08-18T08:00:00Z"),
    event("Événement 2", "2026-08-19T08:00:00Z"),
    event("Événement 3", "2026-08-20T08:00:00Z"),
    event("Événement 4", "2026-08-21T08:00:00Z"),
    event("Événement 5", "2026-08-22T08:00:00Z")
  ];

  const dashboard = Formatter.buildDashboard(events, now);

  const displayedDays = JSON.parse(JSON.stringify(
    dashboard.days.map((day) => ({ label: day.label, date: day.date }))
  ));

  assert.deepEqual(
    displayedDays,
    [
      { label: "Aujourd’hui", date: "18 août" },
      { label: "Demain", date: "19 août" },
      { label: "Jeu.", date: "20 août" },
      { label: "Ven.", date: "21 août" },
      { label: "Sam.", date: "22 août" }
    ]
  );
});

test("uses compact weekday labels for next-week highlights", () => {
  const now = new Date("2026-08-18T06:00:00Z");
  const events = [
    event("Anniversaire lundi", "2026-08-24T08:00:00Z", { allDay: true }),
    event("Anniversaire mardi", "2026-08-25T08:00:00Z", { allDay: true }),
    event("Anniversaire mercredi", "2026-08-26T08:00:00Z", { allDay: true }),
    event("Anniversaire jeudi", "2026-08-27T08:00:00Z", { allDay: true }),
    event("Anniversaire vendredi", "2026-08-28T08:00:00Z", { allDay: true })
  ];

  const dashboard = Formatter.buildDashboard(events, now);

  assert.deepEqual(
    dashboard.nextWeek.highlights.map((highlight) => highlight.day),
    ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."]
  );
});
