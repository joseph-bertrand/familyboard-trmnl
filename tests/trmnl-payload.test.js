const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

function createRepresentativeDashboard() {
  return {
    generatedAt: "2026-08-18T10:00:00.000Z",
    ongoing: [
      {
        title: "Camp d'été",
        person: "ruben",
        personIcon: "🤓",
        type: "camp",
        typeIcon: "🏕️",
        progress: "J3/5",
        ends: "Samedi"
      }
    ],
    days: [
      {
        label: "Aujourd’hui",
        date: "Mardi 18 août",
        events: [
          {
            title: "Orthodontiste",
            person: "ruben",
            personIcon: "🤓",
            type: "medical",
            icon: "🩺",
            allDay: false,
            displayTime: "09:00"
          },
          {
            title: "Anniversaire Mamie",
            person: "family",
            personIcon: "👨‍👩‍👦‍👦",
            type: "birthday",
            icon: "🎂",
            allDay: true,
            displayTime: ""
          }
        ]
      }
    ],
    nextWeek: {
      count: 4,
      highlights: [
        {
          title: "Rentrée scolaire",
          day: "Lundi",
          personIcon: "👦",
          icon: "🏫"
        }
      ]
    }
  };
}

function createHarness(dashboard, response = { status: 200, body: "ok" }) {
  const fetchCalls = [];
  const logs = [];

  const context = loadAppsScript(
    ["WebApp.gs"],
    [
      "TRMNL_MAX_PAYLOAD_BYTES",
      "buildTrmnlRequestBody",
      "getUtf8ByteSize",
      "assertTrmnlPayloadSize",
      "pushDashboardToTrmnl"
    ],
    {
      CalendarService: { getUpcomingEvents: () => [] },
      Formatter: { buildDashboard: () => dashboard },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: () => "https://example.test/trmnl"
        })
      },
      UrlFetchApp: {
        fetch: (...args) => {
          fetchCalls.push(args);
          return {
            getResponseCode: () => response.status,
            getContentText: () => response.body
          };
        }
      },
      Utilities: {
        newBlob: (text) => ({
          getBytes: () => Array.from(Buffer.from(text, "utf8"))
        })
      },
      ContentService: {},
      console: { log: (message) => logs.push(message) }
    }
  );

  return { ...context, fetchCalls, logs };
}

test("measures ASCII bytes", () => {
  const { getUtf8ByteSize } = createHarness({});

  assert.equal(getUtf8ByteSize("FamilyBoard"), 11);
});

test("measures an accented character as UTF-8", () => {
  const { getUtf8ByteSize } = createHarness({});

  assert.equal(getUtf8ByteSize("é"), 2);
});

test("measures an emoji as UTF-8", () => {
  const { getUtf8ByteSize } = createHarness({});

  assert.equal(getUtf8ByteSize("😀"), 4);
});

test("accepts a payload of exactly 2047 bytes", () => {
  const { assertTrmnlPayloadSize } = createHarness({});

  assert.equal(assertTrmnlPayloadSize("a".repeat(2047)), 2047);
});

test("rejects a payload of exactly 2048 bytes", () => {
  const { assertTrmnlPayloadSize } = createHarness({});

  assert.throws(
    () => assertTrmnlPayloadSize("a".repeat(2048)),
    /2048.*2048/
  );
});

test("rejects a payload larger than 2048 bytes", () => {
  const { assertTrmnlPayloadSize } = createHarness({});

  assert.throws(
    () => assertTrmnlPayloadSize("a".repeat(2049)),
    /2049.*2048/
  );
});

test("builds and measures the complete merge_variables envelope", () => {
  const dashboard = {
    ongoing: [],
    days: [],
    nextWeek: { highlights: [] }
  };
  const { buildTrmnlRequestBody, getUtf8ByteSize } = createHarness(dashboard);
  const expected = JSON.stringify({ merge_variables: dashboard });

  assert.equal(buildTrmnlRequestBody(dashboard), expected);
  assert.equal(getUtf8ByteSize(expected), Buffer.byteLength(expected, "utf8"));
  assert.ok(getUtf8ByteSize(expected) > getUtf8ByteSize(JSON.stringify(dashboard)));
});

test("does not call HTTP when the final payload reaches the limit", () => {
  const dashboard = {
    ongoing: [],
    days: [{
      label: "Aujourd’hui",
      date: "Mardi 18 août",
      events: [{ title: "", allDay: false, displayTime: "09:00" }]
    }],
    nextWeek: { highlights: [] }
  };
  const emptyBodySize = Buffer.byteLength(
    JSON.stringify({ merge_variables: dashboard }),
    "utf8"
  );
  dashboard.days[0].events[0].title = "a".repeat(2048 - emptyBodySize);
  const harness = createHarness(dashboard);

  assert.throws(() => harness.pushDashboardToTrmnl(), /2048.*2048/);
  assert.equal(harness.fetchCalls.length, 0);
});

test("sends exactly the body that was measured and validated", () => {
  const dashboard = {
    ongoing: [],
    days: [],
    nextWeek: { highlights: [] }
  };
  const harness = createHarness(dashboard);
  const expected = JSON.stringify({ merge_variables: dashboard });

  harness.pushDashboardToTrmnl();

  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.fetchCalls[0][1].payload, expected);
  assert.ok(harness.logs.includes(`TRMNL payload size: ${Buffer.byteLength(expected)} bytes`));
});

test("keeps only the root fields read by the Liquid template", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody } = createHarness(dashboard);
  const payload = JSON.parse(buildTrmnlRequestBody(dashboard));

  assert.deepEqual(
    Object.keys(payload.merge_variables).sort(),
    ["days", "nextWeek", "ongoing"]
  );
});

test("keeps only the rendered fields for ongoing events", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody } = createHarness(dashboard);
  const ongoing = JSON.parse(buildTrmnlRequestBody(dashboard))
    .merge_variables.ongoing[0];

  assert.deepEqual(Object.keys(ongoing).sort(), ["ends", "progress", "title"]);
  assert.deepEqual(
    { title: ongoing.title, progress: ongoing.progress, ends: ongoing.ends },
    { title: "Camp d'été", progress: "J3/5", ends: "Samedi" }
  );
});

test("keeps only the rendered fields and values for daily events", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody } = createHarness(dashboard);
  const day = JSON.parse(buildTrmnlRequestBody(dashboard)).merge_variables.days[0];

  assert.equal(day.label, "Aujourd’hui");
  assert.equal(day.date, "Mardi 18 août");
  assert.deepEqual(Object.keys(day.events[0]).sort(), ["allDay", "displayTime", "title"]);
  assert.deepEqual(day.events.map((event) => ({
    title: event.title,
    allDay: event.allDay,
    displayTime: event.displayTime
  })), [
    { title: "Orthodontiste", allDay: false, displayTime: "09:00" },
    { title: "Anniversaire Mamie", allDay: true, displayTime: "" }
  ]);
});

test("keeps only highlights in nextWeek", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody } = createHarness(dashboard);
  const nextWeek = JSON.parse(buildTrmnlRequestBody(dashboard))
    .merge_variables.nextWeek;

  assert.deepEqual(Object.keys(nextWeek), ["highlights"]);
});

test("keeps only the rendered fields and values for next-week highlights", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody } = createHarness(dashboard);
  const highlight = JSON.parse(buildTrmnlRequestBody(dashboard))
    .merge_variables.nextWeek.highlights[0];

  assert.deepEqual(Object.keys(highlight).sort(), ["day", "title"]);
  assert.deepEqual(
    { day: highlight.day, title: highlight.title },
    { day: "Lundi", title: "Rentrée scolaire" }
  );
});

test("produces a smaller body than the equivalent enriched dashboard", () => {
  const dashboard = createRepresentativeDashboard();
  const { buildTrmnlRequestBody, getUtf8ByteSize } = createHarness(dashboard);
  const enrichedBody = JSON.stringify({ merge_variables: dashboard });
  const minimalBody = buildTrmnlRequestBody(dashboard);

  assert.ok(getUtf8ByteSize(minimalBody) < getUtf8ByteSize(enrichedBody));
});

test("keeps propagating an HTTP 422 status and response body", () => {
  const harness = createHarness(
    { ongoing: [], days: [], nextWeek: { highlights: [] } },
    { status: 422, body: "Large payload received" }
  );

  assert.throws(
    () => harness.pushDashboardToTrmnl(),
    /Erreur TRMNL HTTP 422 : Large payload received/
  );
  assert.equal(harness.fetchCalls.length, 1);
});
