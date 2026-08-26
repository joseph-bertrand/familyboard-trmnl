const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAppsScript } = require("./apps-script-loader");

const { PersonResolver, PERSON } = loadAppsScript(
  ["Config.gs", "Constants.gs", "PersonResolver.gs"],
  ["PersonResolver", "PERSON"]
);

test("resolves a known person from the event title", () => {
  assert.equal(PersonResolver.resolve("Ruben - Football"), PERSON.RUBEN);
});

test("removes a known person prefix from the event title", () => {
  assert.equal(
    PersonResolver.cleanTitle("[Vasco] Dentiste", PERSON.VASCO),
    "Dentiste"
  );
});

test("uses family when no person can be identified", () => {
  assert.equal(PersonResolver.resolve("Déjeuner chez Mamie"), PERSON.FAMILY);
});
