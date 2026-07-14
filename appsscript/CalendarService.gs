/**
 * CalendarService
 * Reads events from Google Calendar.
 */
class CalendarService {

  /**
   * Returns upcoming events.
   *
   * @returns {Array<Object>}
   */
  static getUpcomingEvents() {
    const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);

    if (!calendar) {
      throw new Error(`Calendar not found: ${CONFIG.calendarId}`);
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 14);

    const events = calendar.getEvents(now, end);

    return events.map((event) => ({
      id: event.getId(),
      title: event.getTitle().trim(),
      start: event.getStartTime(),
      end: event.getEndTime(),
      allDay: event.isAllDayEvent(),
      location: event.getLocation() || "",
      description: event.getDescription() || ""
    }));
  }
}
