/**
 * Static timetable and projection for the dedicated school TRMNL screen.
 */
const SCHOOL_SCHEDULE_CONFIG = Object.freeze({
  school: "École TOEPFFER",
  className: "9e H",
  locale: "fr-CH",
  timeZone: "Europe/Zurich"
});

const SCHOOL_DISPLAY_CUTOFF_HOUR = 20;

const SCHOOL_SCHEDULE = Object.freeze([
  { weekday: "monday", start: "08:15", end: "09:05", subject: "Mathématiques", teacher: "VAUCHER L.", room: "16", info: "" },
  { weekday: "monday", start: "09:10", end: "10:00", subject: "Étude", teacher: "VAUCHER L.", room: "16", info: "Non anglophone" },
  { weekday: "monday", start: "10:15", end: "11:05", subject: "Anglais", teacher: "MICHOLLET S.", room: "12", info: "" },
  { weekday: "monday", start: "11:10", end: "12:00", subject: "Mathématiques", teacher: "VAUCHER L.", room: "15", info: "" },
  { weekday: "monday", start: "13:30", end: "15:15", subject: "EPS", teacher: "DUTRUEL S.", room: "Salle d’EPS", info: "" },
  { weekday: "monday", start: "15:30", end: "16:20", subject: "Étude", teacher: "LAURENSON O.", room: "11 Phy-Chi", info: "" },
  { weekday: "monday", start: "16:25", end: "17:15", subject: "Sciences", teacher: "SILORET E.", room: "7", info: "" },

  { weekday: "tuesday", start: "08:15", end: "09:05", subject: "Allemand", teacher: "VESCOVI F.", room: "8", info: "9e ALL" },
  { weekday: "tuesday", start: "09:10", end: "10:00", subject: "Allemand", teacher: "VESCOVI F.", room: "8", info: "9e ALL" },
  { weekday: "tuesday", start: "10:15", end: "11:05", subject: "Arts plastiques", teacher: "JORAT C.", room: "3 Arts", info: "" },
  { weekday: "tuesday", start: "11:10", end: "12:00", subject: "Théâtre", teacher: "LA ROCCA A.", room: "3 Arts", info: "" },
  { weekday: "tuesday", start: "13:30", end: "14:20", subject: "Histoire-Géographie", teacher: "JORAT C.", room: "12", info: "" },
  { weekday: "tuesday", start: "14:25", end: "15:15", subject: "Français", teacher: "BEN NJEMA S.", room: "13", info: "" },
  { weekday: "tuesday", start: "15:30", end: "16:20", subject: "Français", teacher: "BEN NJEMA S.", room: "13", info: "" },
  { weekday: "tuesday", start: "16:25", end: "17:15", subject: "Étude", teacher: "JORAT C.", room: "3 Arts", info: "" },

  { weekday: "wednesday", start: "08:15", end: "09:05", subject: "Français", teacher: "BEN NJEMA S.", room: "14", info: "" },
  { weekday: "wednesday", start: "09:10", end: "10:00", subject: "Mathématiques", teacher: "VAUCHER L.", room: "16", info: "" },
  { weekday: "wednesday", start: "10:15", end: "11:05", subject: "Histoire-Géographie", teacher: "JORAT C.", room: "15", info: "" },
  { weekday: "wednesday", start: "11:10", end: "12:00", subject: "Allemand", teacher: "VESCOVI F.", room: "8", info: "9e ALL" },
  { weekday: "wednesday", start: "12:55", end: "13:30", subject: "Étude", teacher: "", room: "", info: "Non latin" },
  { weekday: "wednesday", start: "13:30", end: "14:20", subject: "Étude", teacher: "JORAT C.", room: "3 Arts", info: "Non latin" },

  { weekday: "thursday", start: "08:15", end: "09:05", subject: "Français", teacher: "BEN NJEMA S.", room: "10", info: "" },
  { weekday: "thursday", start: "09:10", end: "10:00", subject: "Français", teacher: "BEN NJEMA S.", room: "10", info: "" },
  { weekday: "thursday", start: "10:15", end: "11:05", subject: "Anglais", teacher: "MICHOLLET S.", room: "12", info: "" },
  { weekday: "thursday", start: "11:10", end: "12:00", subject: "Anglais", teacher: "MICHOLLET S.", room: "12", info: "" },
  { weekday: "thursday", start: "13:30", end: "14:20", subject: "Allemand", teacher: "VESCOVI F.", room: "8", info: "9e ALL" },
  { weekday: "thursday", start: "14:25", end: "15:15", subject: "Histoire-Géographie", teacher: "JORAT C.", room: "12", info: "" },
  { weekday: "thursday", start: "15:30", end: "16:20", subject: "Sciences", teacher: "SILORET E.", room: "5", info: "" },
  { weekday: "thursday", start: "16:25", end: "17:15", subject: "Méthodologie", teacher: "JORAT C.", room: "3 Arts", info: "" },

  { weekday: "friday", start: "08:15", end: "09:05", subject: "Mathématiques", teacher: "VAUCHER L.", room: "7", info: "" },
  { weekday: "friday", start: "09:10", end: "10:00", subject: "Mathématiques", teacher: "VAUCHER L.", room: "7", info: "" },
  { weekday: "friday", start: "10:15", end: "11:05", subject: "Sciences", teacher: "SILORET E.", room: "5", info: "" },
  { weekday: "friday", start: "11:10", end: "12:00", subject: "Anglais", teacher: "MICHOLLET S.", room: "12", info: "" },
  { weekday: "friday", start: "13:30", end: "14:20", subject: "Étude", teacher: "JORAT C.", room: "12", info: "Non latin" },
  { weekday: "friday", start: "14:25", end: "15:15", subject: "Appuis ou étude ou libre", teacher: "", room: "", info: "" },
  { weekday: "friday", start: "15:30", end: "17:15", subject: "Appui", teacher: "", room: "", info: "" }
]);

class SchoolSchedule {

  static getWeekday(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: SCHOOL_SCHEDULE_CONFIG.timeZone
    }).toLowerCase();
  }

  static getCoursesForDate(date) {
    const weekday = this.getWeekday(date);

    return SCHOOL_SCHEDULE
      .filter((course) => course.weekday === weekday)
      .slice()
      .sort((first, second) => first.start.localeCompare(second.start));
  }

  static getNextSchoolDate(date) {
    for (let offset = 1; offset <= 7; offset++) {
      const candidate = new Date(date);
      candidate.setDate(candidate.getDate() + offset);

      if (this.getCoursesForDate(candidate).length > 0) {
        return candidate;
      }
    }

    return null;
  }

  static getNextCourse(now) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const course = this.getCoursesForDate(now).find((candidate) =>
      this.timeToMinutes(candidate.start) > currentMinutes
    );

    if (!course) {
      return null;
    }

    return {
      ...course,
      minutesUntil: this.timeToMinutes(course.start) - currentMinutes
    };
  }

  static getSchoolDisplayDays(now) {
    const isSchoolDay = this.getCoursesForDate(now).length > 0;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isAfterCutoff = currentMinutes >= SCHOOL_DISPLAY_CUTOFF_HOUR * 60;
    const shifted = !isSchoolDay || isAfterCutoff;
    const primaryDate = shifted ? this.getNextSchoolDate(now) : new Date(now);
    const secondaryDate = this.getNextSchoolDate(primaryDate);

    return {
      primaryDate: primaryDate,
      secondaryDate: secondaryDate,
      primaryLabel: shifted ? this.formatWeekday(primaryDate) : "Aujourd’hui",
      secondaryLabel: shifted ? this.formatWeekday(secondaryDate) : "Demain",
      shifted: shifted
    };
  }

  static buildDashboard(now = new Date()) {
    const displayDays = this.getSchoolDisplayDays(now);
    const primaryCourses = this.getCoursesForDate(displayDays.primaryDate);
    const secondaryCourses = this.getCoursesForDate(displayDays.secondaryDate);
    const firstPrimaryCourse = primaryCourses[0] || null;
    const nextCourse = displayDays.shifted && firstPrimaryCourse ? {
      ...firstPrimaryCourse,
      minutesUntil: null
    } : this.getNextCourse(now);

    return {
      school: SCHOOL_SCHEDULE_CONFIG.school,
      className: SCHOOL_SCHEDULE_CONFIG.className,
      today: {
        label: displayDays.primaryLabel,
        weekday: this.formatWeekday(displayDays.primaryDate),
        date: this.formatDate(displayDays.primaryDate),
        hasCourses: primaryCourses.length > 0,
        emptyMessage: primaryCourses.length > 0 ? "" : "PAS DE COURS AUJOURD’HUI",
        courses: primaryCourses
      },
      tomorrow: {
        label: displayDays.secondaryLabel,
        weekday: this.formatWeekday(displayDays.secondaryDate),
        date: this.formatDate(displayDays.secondaryDate),
        courses: secondaryCourses
      },
      nextCourse: nextCourse
    };
  }

  static buildTrmnlDto(dashboard) {
    return {
      school: dashboard.school,
      className: dashboard.className,
      today: {
        label: dashboard.today.label,
        weekday: dashboard.today.weekday,
        date: dashboard.today.date,
        hasCourses: dashboard.today.hasCourses,
        emptyMessage: dashboard.today.emptyMessage,
        courses: dashboard.today.courses.map((course) => ({
          start: course.start,
          end: course.end,
          subject: course.subject,
          teacher: course.teacher,
          room: course.room
        }))
      },
      tomorrow: {
        label: dashboard.tomorrow.label,
        weekday: dashboard.tomorrow.weekday,
        date: dashboard.tomorrow.date,
        courses: dashboard.tomorrow.courses.map((course) => ({
          start: course.start,
          subject: course.subject,
          room: course.room
        }))
      },
      nextCourse: dashboard.nextCourse ? {
        subject: dashboard.nextCourse.subject,
        room: dashboard.nextCourse.room,
        timing: dashboard.nextCourse.minutesUntil === null
          ? dashboard.nextCourse.start
          : "dans " + dashboard.nextCourse.minutesUntil + " min"
      } : null
    };
  }

  static buildTrmnlRequestBody(dashboard) {
    return JSON.stringify({
      merge_variables: this.buildTrmnlDto(dashboard)
    });
  }

  static getUtf8ByteSize(text) {
    return Utilities.newBlob(text).getBytes().length;
  }

  static timeToMinutes(value) {
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  static formatWeekday(date) {
    const value = date.toLocaleDateString(SCHOOL_SCHEDULE_CONFIG.locale, {
      weekday: "long",
      timeZone: SCHOOL_SCHEDULE_CONFIG.timeZone
    });

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  static formatDate(date) {
    return date.toLocaleDateString(SCHOOL_SCHEDULE_CONFIG.locale, {
      day: "numeric",
      month: "long",
      timeZone: SCHOOL_SCHEDULE_CONFIG.timeZone
    });
  }
}

function pushSchoolScheduleToTrmnl() {
  const webhookUrl = PropertiesService
    .getScriptProperties()
    .getProperty("TRMNL_SCHOOL_WEBHOOK_URL");

  if (!webhookUrl) {
    throw new Error("La propriété TRMNL_SCHOOL_WEBHOOK_URL est absente.");
  }

  const dashboard = SchoolSchedule.buildDashboard(new Date());
  const requestBody = SchoolSchedule.buildTrmnlRequestBody(dashboard);
  const payloadSize = assertTrmnlPayloadSize(requestBody);

  console.log("TRMNL School payload size: " + payloadSize + " bytes");

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: requestBody,
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      "Erreur TRMNL School HTTP " + statusCode + " : " + responseBody
    );
  }

  console.log("Emploi du temps envoyé à TRMNL : HTTP " + statusCode);
}
