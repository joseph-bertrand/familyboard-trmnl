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


function pushDashboardToTrmnl() {
  const webhookUrl = PropertiesService
    .getScriptProperties()
    .getProperty('TRMNL_WEBHOOK_URL');

  if (!webhookUrl) {
    throw new Error('La propriété TRMNL_WEBHOOK_URL est absente.');
  }

  const events = CalendarService.getUpcomingEvents();
  const dashboard = Formatter.buildDashboard(events);

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      merge_variables: dashboard
    }),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      'Erreur TRMNL HTTP ' + statusCode + ' : ' + responseBody
    );
  }

  console.log('Dashboard envoyé à TRMNL : HTTP ' + statusCode);
  console.log(responseBody);
}
