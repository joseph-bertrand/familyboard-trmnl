const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function formatDate(date, timeZone, format) {
  if (format !== "HH:mm") {
    throw new Error(`Unsupported Utilities.formatDate pattern: ${format}`);
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  }).format(date);
}

function newBlob(text) {
  return {
    getBytes: () => Array.from(Buffer.from(text, "utf8"))
  };
}

function loadAppsScript(files, exports, globals = {}) {
  const context = vm.createContext({
    Intl,
    Utilities: { formatDate, newBlob },
    ...globals
  });

  for (const file of files) {
    const filename = path.join(projectRoot, "appsscript", file);
    const source = fs.readFileSync(filename, "utf8");
    vm.runInContext(source, context, { filename });
  }

  for (const name of exports) {
    vm.runInContext(`globalThis.${name} = ${name};`, context);
  }

  return context;
}

module.exports = { loadAppsScript };
