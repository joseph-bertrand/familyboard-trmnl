const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

const { EventClassifier, EVENT_TYPE } = loadAppsScript(
  ["Constants.gs", "EventClassifier.gs"],
  ["EventClassifier", "EVENT_TYPE"]
);

test("classifies a football event as sport", () => {
  assert.equal(
    EventClassifier.resolve("Football du mercredi"),
    EVENT_TYPE.SPORT
  );
});

test("classifies a school event", () => {
  assert.equal(EventClassifier.resolve("Rentrée à l'école"), EVENT_TYPE.SCHOOL);
});

test("classifies a birthday", () => {
  assert.equal(
    EventClassifier.resolve("Anniversaire de Mamie"),
    EVENT_TYPE.BIRTHDAY
  );
});

test("falls back to generic when no rule matches", () => {
  assert.equal(EventClassifier.resolve("Déjeuner chez Mamie"), EVENT_TYPE.GENERIC);
});
