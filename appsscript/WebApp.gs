function doGet() {

  const events = CalendarService.getUpcomingEvents();

  return ContentService
    .createTextOutput(
      JSON.stringify(events, null, 2)
    )
    .setMimeType(ContentService.MimeType.JSON);

}
