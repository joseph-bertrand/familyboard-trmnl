/**
 * Formatter
 * Transforms raw Google Calendar events into data ready for TRMNL.
 */
class Formatter {

  /**
   * Builds the complete FamilyBoard payload.
   *
   * @param {Array<Object>} events Raw events from CalendarService.
   * @returns {Object}
   */
  static buildDashboard(events) {
    const normalizedEvents = events
      .map((event) => this.normalizeEvent(event))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    return {
      generatedAt: new Date().toISOString(),
      ongoing: this.buildOngoing(normalizedEvents),
      days: this.buildDays(normalizedEvents),
      nextWeek: this.buildNextWeek(normalizedEvents)
    };
  }

  /**
   * Enriches one calendar event.
   *
   * @param {Object} event
   * @returns {Object}
   */
  static normalizeEvent(event) {
    const person = this.resolvePerson(event.title);
    const type = this.resolveEventType(event.title);

    return {
      id: event.id,
      title: this.cleanTitle(event.title, person),
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
      multiDay: this.isMultiDay(event),
      person: person,
      personIcon: CONFIG.people[person].icon,
      type: type,
      typeIcon: CONFIG.eventTypes[type] || CONFIG.eventTypes.generic || "",
      location: event.location || "",
      description: event.description || ""
    };
  }

  /**
   * Returns multi-day events currently in progress.
   *
   * @param {Array<Object>} events
   * @returns {Array<Object>}
   */
  static buildOngoing(events) {
    const now = new Date();

    return events
      .filter((event) =>
        event.multiDay &&
        event.start <= now &&
        event.end > now
      )
      .map((event) => {
        const totalDays = this.countCalendarDays(event.start, event.end);
        const currentDay = Math.min(
          totalDays,
          this.countCalendarDays(event.start, now)
        );

        return {
          title: event.title,
          person: event.person,
          personIcon: event.personIcon,
          type: event.type,
          typeIcon: event.typeIcon || CONFIG.eventTypes.camp,
          progress: `J${currentDay}/${totalDays}`,
          ends: this.formatWeekday(event.end)
        };
      });
  }

  /**
   * Builds the next days displayed in the main column.
   *
   * @param {Array<Object>} events
   * @returns {Array<Object>}
   */
  static buildDays(events) {
    const days = [];
    const today = this.startOfDay(new Date());

    for (let offset = 0; offset < CONFIG.daysToDisplay; offset++) {
      const date = this.addDays(today, offset);
      const nextDate = this.addDays(date, 1);

      const dayEvents = events
        .filter((event) =>
          !event.multiDay &&
          event.start >= date &&
          event.start < nextDate
        )
        .slice(0, CONFIG.maxEventsPerDay)
        .map((event) => ({
          title: event.title,
          person: event.person,
          personIcon: event.personIcon,
          type: event.type,
          icon: event.allDay
            ? event.typeIcon || CONFIG.eventTypes.allDay
            : event.typeIcon,
          allDay: event.allDay,
          displayTime: event.allDay
            ? ""
            : this.formatTime(event.start)
        }));

      if (CONFIG.showEmptyDays || dayEvents.length > 0) {
        days.push({
          dateKey: this.formatDateKey(date),
          label: this.getRelativeDayLabel(date, offset),
          date: this.formatDayAndDate(date),
          events: dayEvents
        });
      }
    }

    return days;
  }

  /**
   * Builds a concise summary for the following calendar week.
   *
   * @param {Array<Object>} events
   * @returns {Object}
   */
  static buildNextWeek(events) {
    const nextMonday = this.startOfNextWeek(new Date());
    const followingMonday = this.addDays(nextMonday, 7);

    const nextWeekEvents = events.filter((event) =>
      event.start >= nextMonday &&
      event.start < followingMonday
    );

    const highlights = nextWeekEvents
      .filter((event) =>
        event.allDay ||
        event.multiDay ||
        ["birthday", "camp", "holiday", "travel", "school"].includes(event.type)
      )
      .slice(0, 5)
      .map((event) => ({
        title: event.title,
        personIcon: event.personIcon,
        icon: event.typeIcon || CONFIG.eventTypes.allDay,
        day: this.formatWeekday(event.start)
      }));

    return {
      count: nextWeekEvents.length,
      highlights: highlights
    };
  }

  /**
   * Finds the family member mentioned in an event title.
   *
   * @param {string} title
   * @returns {string}
   */
  static resolvePerson(title) {
    const normalizedTitle = this.normalizeText(title);

    for (const personKey in CONFIG.people) {
      const aliases = CONFIG.people[personKey].aliases || [];

      if (aliases.some((alias) =>
        normalizedTitle.includes(this.normalizeText(alias))
      )) {
        return personKey;
      }
    }

    return "family";
  }

  /**
   * Detects the event category from its title.
   *
   * @param {string} title
   * @returns {string}
   */
  static resolveEventType(title) {
    const value = this.normalizeText(title);

    const rules = [
      { type: "birthday", words: ["anniversaire", "birthday"] },
      { type: "camp", words: ["camp", "colonie"] },
      { type: "holiday", words: ["vacances", "conge", "ferie"] },
      { type: "travel", words: ["voyage", "vol", "train", "depart"] },
      { type: "school", words: ["ecole", "rentree", "classe"] },
      {
        type: "sport",
        words: ["football", "foot", "tennis", "natation", "sport"]
      },
      {
        type: "medical",
        words: ["medecin", "dentiste", "orthodontiste", "hopital"]
      }
    ];

    const match = rules.find((rule) =>
      rule.words.some((word) => value.includes(word))
    );

    return match ? match.type : "generic";
  }

  /**
   * Removes the person's alias from the displayed title.
   *
   * @param {string} title
   * @param {string} personKey
   * @returns {string}
   */
  static cleanTitle(title, personKey) {
    let cleaned = title.trim();
    const aliases = CONFIG.people[personKey].aliases || [];

    aliases.forEach((alias) => {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      cleaned = cleaned.replace(
        new RegExp(
          `^\\s*(\\[${escapedAlias}\\]|${escapedAlias})\\s*[-:–—]?\\s*`,
          "i"
        ),
        ""
      );
    });

    return cleaned || title.trim();
  }

  static isMultiDay(event) {
    const start = this.startOfDay(new Date(event.start));
    const end = this.startOfDay(new Date(event.end));

    return end.getTime() - start.getTime() > 24 * 60 * 60 * 1000;
  }

  static countCalendarDays(start, end) {
    const startDay = this.startOfDay(new Date(start));
    const endDay = this.startOfDay(new Date(end));
    const difference = endDay.getTime() - startDay.getTime();

    return Math.max(
      1,
      Math.ceil(difference / (24 * 60 * 60 * 1000))
    );
  }

  static startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static addDays(date, numberOfDays) {
    const result = new Date(date);
    result.setDate(result.getDate() + numberOfDays);
    return result;
  }

  static startOfNextWeek(date) {
    const result = this.startOfDay(date);
    const day = result.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;

    return this.addDays(result, daysUntilMonday);
  }

  static formatTime(date) {
    return Utilities.formatDate(
      date,
      CONFIG.timeZone,
      "HH:mm"
    );
  }

  static formatDateKey(date) {
    return Utilities.formatDate(
      date,
      CONFIG.timeZone,
      "yyyy-MM-dd"
    );
  }

  static formatWeekday(date) {
    const value = date.toLocaleDateString(CONFIG.locale, {
      weekday: "long",
      timeZone: CONFIG.timeZone
    });

    return this.capitalize(value);
  }

  static formatDayAndDate(date) {
    const value = date.toLocaleDateString(CONFIG.locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: CONFIG.timeZone
    });

    return this.capitalize(value.replace(".", ""));
  }

  static getRelativeDayLabel(date, offset) {
    if (offset === 0) {
      return "Aujourd’hui";
    }

    if (offset === 1) {
      return "Demain";
    }

    return this.formatWeekday(date);
  }

  static normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  static capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
