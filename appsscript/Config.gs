/**
 * FamilyBoard configuration
 * Version: 0.1
 */

const CONFIG = {

  // ------------------------------------------------------------------
  // Google Calendar
  // ------------------------------------------------------------------

  calendarId: "primary",

  // ------------------------------------------------------------------
  // Display
  // ------------------------------------------------------------------

  daysToDisplay: 5,

  maxEventsPerDay: 5,

  showEmptyDays: false,

  locale: "fr-CH",

  timeZone: "Europe/Zurich",

  // ------------------------------------------------------------------
  // Family members
  // ------------------------------------------------------------------

  people: {

    ruben: {
      label: "Ruben",
      icon: "🤓",
      aliases: ["ruben"]
    },

    vasco: {
      label: "Vasco",
      icon: "👦",
      aliases: ["vasco"]
    },

    family: {
      label: "Famille",
      icon: "👨‍👩‍👦‍👦",
      aliases: [
        "famille",
        "family"
      ]
    }

  },

  // ------------------------------------------------------------------
  // Event icons
  // ------------------------------------------------------------------

  eventTypes: {

    birthday: "🎂",

    camp: "🏕️",

    holiday: "🌴",

    travel: "✈️",

    school: "🏫",

    sport: "⚽",

    medical: "🩺",

    allDay: "📅",

    generic: ""

  }

};
