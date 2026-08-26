const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

const { DateUtils } = loadAppsScript(
  ["Config.gs", "DateUtils.gs"],
  ["DateUtils"]
);

test("formats time in the configured Europe/Zurich time zone", () => {
  const date = new Date("2026-08-20T12:34:00Z");

  assert.equal(DateUtils.formatTime(date), "14:34");
});

test("formats a date using the configured locale and time zone", () => {
  const date = new Date("2026-08-20T12:34:00Z");

  assert.equal(DateUtils.formatDate(date), "20 août");
});

test("formats every French weekday with the expected abbreviation", () => {
  const dates = [
    "2026-08-24T10:00:00Z",
    "2026-08-25T10:00:00Z",
    "2026-08-26T10:00:00Z",
    "2026-08-27T10:00:00Z",
    "2026-08-28T10:00:00Z",
    "2026-08-29T10:00:00Z",
    "2026-08-30T10:00:00Z"
  ].map((value) => new Date(value));

  assert.deepEqual(
    dates.map((date) => DateUtils.formatWeekdayShort(date)),
    ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."]
  );
});

test("returns the start of the local day without mutating the input", () => {
  const date = new Date(2026, 7, 20, 14, 34, 56, 789);
  const result = DateUtils.startOfDay(date);

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 7);
  assert.equal(result.getDate(), 20);
  assert.equal(result.getHours(), 0);
  assert.equal(result.getMinutes(), 0);
  assert.equal(result.getSeconds(), 0);
  assert.equal(result.getMilliseconds(), 0);
  assert.equal(date.getHours(), 14);
});

test("adds calendar days without mutating the input", () => {
  const date = new Date(2026, 7, 20, 10, 0, 0);
  const result = DateUtils.addDays(date, 3);

  assert.equal(result.getDate(), 23);
  assert.equal(result.getHours(), 10);
  assert.equal(date.getDate(), 20);
});
