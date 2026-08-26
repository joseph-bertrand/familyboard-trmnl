const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

function createHarness({
  schoolWebhook = "https://school.example.test/secret-token",
  familyWebhook = "https://family.example.test/other-token",
  responseStatus = 200,
  responseBody = "ok"
} = {}) {
  const propertyReads = [];
  const fetchCalls = [];
  const logs = [];

  const context = loadAppsScript(
    ["WebApp.gs", "SchoolSchedule.gs"],
    ["SchoolSchedule", "assertTrmnlPayloadSize"],
    {
      CalendarService: { getUpcomingEvents: () => [] },
      Formatter: { buildDashboard: () => ({}) },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (name) => {
            propertyReads.push(name);
            if (name === "TRMNL_SCHOOL_WEBHOOK_URL") return schoolWebhook;
            if (name === "TRMNL_WEBHOOK_URL") return familyWebhook;
            return null;
          }
        })
      },
      UrlFetchApp: {
        fetch: (...args) => {
          fetchCalls.push(args);
          return {
            getResponseCode: () => responseStatus,
            getContentText: () => responseBody
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

  const dashboard = context.SchoolSchedule.buildDashboard(
    new Date("2026-08-25T07:30:00+02:00")
  );
  context.SchoolSchedule.buildDashboard = () => dashboard;

  return { context, dashboard, propertyReads, fetchCalls, logs };
}

test("uses only the school webhook property and URL", () => {
  const harness = createHarness();

  harness.context.pushSchoolScheduleToTrmnl();

  assert.deepEqual(harness.propertyReads, ["TRMNL_SCHOOL_WEBHOOK_URL"]);
  assert.equal(harness.fetchCalls[0][0], "https://school.example.test/secret-token");
  assert.notEqual(harness.fetchCalls[0][0], "https://family.example.test/other-token");
});

test("fails explicitly when the school webhook property is missing", () => {
  const harness = createHarness({ schoolWebhook: null });

  assert.throws(
    () => harness.context.pushSchoolScheduleToTrmnl(),
    /TRMNL_SCHOOL_WEBHOOK_URL.*absente/
  );
  assert.equal(harness.fetchCalls.length, 0);
});

test("sends the exact school DTO wrapped in merge_variables", () => {
  const harness = createHarness();
  const expected = harness.context.SchoolSchedule.buildTrmnlRequestBody(
    harness.dashboard
  );

  harness.context.pushSchoolScheduleToTrmnl();

  assert.equal(harness.fetchCalls[0][1].payload, expected);
  assert.deepEqual(Object.keys(JSON.parse(expected)), ["merge_variables"]);
});

test("measures and sends the exact same body", () => {
  const harness = createHarness();
  const measuredBodies = [];
  harness.context.assertTrmnlPayloadSize = (body) => {
    measuredBodies.push(body);
    return Buffer.byteLength(body, "utf8");
  };

  harness.context.pushSchoolScheduleToTrmnl();

  assert.equal(measuredBodies.length, 1);
  assert.equal(measuredBodies[0], harness.fetchCalls[0][1].payload);
});

test("posts valid JSON with muted HTTP exceptions", () => {
  const harness = createHarness();

  assert.doesNotThrow(() => harness.context.pushSchoolScheduleToTrmnl());
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.fetchCalls[0][1].method, "post");
  assert.equal(harness.fetchCalls[0][1].contentType, "application/json");
  assert.equal(harness.fetchCalls[0][1].muteHttpExceptions, true);
});

test("does not call HTTP when the school payload reaches 2048 bytes", () => {
  const harness = createHarness();
  harness.context.SchoolSchedule.buildTrmnlRequestBody = () => "a".repeat(2048);

  assert.throws(
    () => harness.context.pushSchoolScheduleToTrmnl(),
    /2048.*2048/
  );
  assert.equal(harness.fetchCalls.length, 0);
});

test("accepts an HTTP 200 response", () => {
  const harness = createHarness({ responseStatus: 200 });

  assert.doesNotThrow(() => harness.context.pushSchoolScheduleToTrmnl());
});

test("propagates an HTTP 422 status and response body", () => {
  const harness = createHarness({
    responseStatus: 422,
    responseBody: "Large payload received"
  });

  assert.throws(
    () => harness.context.pushSchoolScheduleToTrmnl(),
    /Erreur TRMNL School HTTP 422 : Large payload received/
  );
});

test("never includes the school webhook in an HTTP error", () => {
  const secretWebhook = "https://school.example.test/private-secret";
  const harness = createHarness({
    schoolWebhook: secretWebhook,
    responseStatus: 500,
    responseBody: "server error"
  });

  assert.throws(
    () => harness.context.pushSchoolScheduleToTrmnl(),
    (error) =>
      error.message === "Erreur TRMNL School HTTP 500 : server error" &&
      !error.message.includes(secretWebhook)
  );
  assert.ok(harness.logs.every((message) => !message.includes(secretWebhook)));
});

test("never invokes the FamilyBoard push", () => {
  const harness = createHarness();
  let familyPushCalls = 0;
  harness.context.pushDashboardToTrmnl = () => {
    familyPushCalls += 1;
  };

  harness.context.pushSchoolScheduleToTrmnl();

  assert.equal(familyPushCalls, 0);
  assert.equal(harness.fetchCalls.length, 1);
});
