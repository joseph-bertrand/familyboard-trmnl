/**
 * FamilyBoard JSON endpoint.
 */
// TRMNL requires the complete request body to be strictly smaller than 2 KB.
const TRMNL_MAX_PAYLOAD_BYTES = 2048;

function buildTrmnlRequestBody(dashboard) {
  return JSON.stringify({
    merge_variables: {
      ongoing: dashboard.ongoing.map((event) => ({
        title: event.title,
        progress: event.progress,
        ends: event.ends
      })),
      days: dashboard.days.map((day) => ({
        label: day.label,
        date: day.date,
        events: day.events.map((event) => ({
          title: event.title,
          allDay: event.allDay,
          displayTime: event.displayTime
        }))
      })),
      nextWeek: {
        highlights: dashboard.nextWeek.highlights.map((event) => ({
          day: event.day,
          title: event.title
        }))
      }
    }
  });
}

function getUtf8ByteSize(text) {
  return Utilities.newBlob(text).getBytes().length;
}

function assertTrmnlPayloadSize(body) {
  const size = getUtf8ByteSize(body);

  if (size >= TRMNL_MAX_PAYLOAD_BYTES) {
    throw new Error(
      'Payload TRMNL trop volumineux : ' + size +
      ' bytes (limite : ' + TRMNL_MAX_PAYLOAD_BYTES + ' bytes).'
    );
  }

  return size;
}

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
  const requestBody = buildTrmnlRequestBody(dashboard);
  const payloadSize = assertTrmnlPayloadSize(requestBody);

  console.log('TRMNL payload size: ' + payloadSize + ' bytes');

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: requestBody,
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
