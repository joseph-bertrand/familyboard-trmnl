/**
 * Builds the data structure consumed by the FamilyBoard TRMNL plugin.
 */
class Formatter {

  /**
   * Builds the complete FamilyBoard dashboard.
   *
   * @param {Array<Object>} events Events returned by CalendarService.
   * @returns {Object}
   */
  static buildDashboard(events) {
    const normalizedEvents = events
      .map((event) => this.normalizeEvent(event))
      .sort((first, second) => first.start - second.start);

    return {
      generatedAt: new Date().toISOString(),
      ongoing: this.buildOngoing(normalizedEvents),
      days: this.buildDays(normalizedEvents),
      nextWeek: this.buildNextWeek(normalizedEvents)
    };
  }

  /**
   * Enriches a raw calendar event.
   *
   * @param {Object} event
   * @returns {Object}
   */
  static normalizeEvent(event) {
    const person = PersonResolver.resolve(event.title);
    const type = EventClassifier.resolve(event.title);

    return {
      id: event.id,
      title: PersonResolver.cleanTitle(event.title, person),
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay,
      multiDay: DateUtils.isMultiDay(event.start, event.end),
      person: person,
      personIcon: PersonResolver.getIcon(person),
      type: type,
      typeIcon: CONFIG.eventTypes[type] || "",
      location: event.location || "",
      description: event.description || ""
    };
  }

  /**
   * Builds the list of multi-day events currently in progress.
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
        const totalDays = this.countDays(event.start, event.end);
        const currentDay = Math.min(
          totalDays,
          this.countDays(event.start, now)
        );

        return {
          title: event.title,
          person: event.person,
          personIcon: event.personIcon,
          type: event.type,
          typeIcon: event.typeIcon,
          progress: `J${currentDay}/${totalDays}`,
          ends: DateUtils.formatWeekday(event.end)
        };
      });
  }

  /**
   * Builds the next configured calendar days.
   *
   * @param {Array<Object>} events
   * @returns {Array<Object>}
   */
  static buildDays(events) {
    const days = [];
    const today = DateUtils.startOfDay(new Date());

    for (let offset = 0; offset < CONFIG.daysToDisplay; offset++) {
      const date = DateUtils.addDays(today, offset);
      const nextDate = DateUtils.addDays(date, 1);

      const matchingEvents = events
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
            : DateUtils.formatTime(event.start)
        }));

      if (CONFIG.showEmptyDays || matchingEvents.length > 0) {
        days.push({
          label: this.getDayLabel(date, offset),
          date: DateUtils.formatDate(date),
          events: matchingEvents
        });
      }
    }

    return days;
  }

  /**
   * Builds a concise summary of the following calendar week.
   *
   * @param {Array<Object>} events
   * @returns {Object}
   */
  static buildNextWeek(events) {
    const nextMonday = this.getNextMonday(new Date());
    const followingMonday = DateUtils.addDays(nextMonday, 7);

    const nextWeekEvents = events.filter((event) =>
      event.start >= nextMonday &&
      event.start < followingMonday
    );

    const highlightedTypes = [
      EVENT_TYPE.BIRTHDAY,
      EVENT_TYPE.CAMP,
      EVENT_TYPE.HOLIDAY,
      EVENT_TYPE.TRAVEL,
      EVENT_TYPE.SCHOOL
    ];

    const highlights = nextWeekEvents
      .filter((event) =>
        event.allDay ||
        event.multiDay ||
        highlightedTypes.includes(event.type)
      )
      .slice(0, 5)
      .map((event) => ({
        title: event.title,
        day: DateUtils.formatWeekday(event.start),
        personIcon: event.personIcon,
        icon: event.typeIcon || CONFIG.eventTypes.allDay
      }));

    return {
      count: nextWeekEvents.length,
      highlights: highlights
    };
  }

  /**
   * Returns the heading used for a displayed day.
   *
   * @param {Date} date
   * @param {number} offset
   * @returns {string}
   */
  static getDayLabel(date, offset) {
    if (offset === 0) {
      return "Aujourd’hui";
    }

    if (offset === 1) {
      return "Demain";
    }

    return DateUtils.formatWeekday(date);
  }

  /**
   * Returns the first Monday after the current week.
   *
   * @param {Date} date
   * @returns {Date}
   */
  static getNextMonday(date) {
    const currentDay = DateUtils.startOfDay(date);
    const weekday = currentDay.getDay();
    const daysUntilMonday = weekday === 0 ? 1 : 8 - weekday;

    return DateUtils.addDays(currentDay, daysUntilMonday);
  }

  /**
   * Counts calendar days between two dates.
   *
   * Google Calendar uses an exclusive end date for all-day events.
   *
   * @param {Date} start
   * @param {Date} end
   * @returns {number}
   */
  static countDays(start, end) {
    const startDay = DateUtils.startOfDay(start);
    const endDay = DateUtils.startOfDay(end);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.max(
      1,
      Math.ceil((endDay - startDay) / millisecondsPerDay)
    );
  }
}
