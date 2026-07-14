/**
 * FamilyBoard JSON endpoint.
 */
function doGet() {
  try {
    const events = CalendarService.getUpcomingEvents();
    const dashboard = Formatter.buildDashboard(events);

    return ContentService
      .createTextOutput(JSON.stringify(dashboard, null, 2))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: true,
        message: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
