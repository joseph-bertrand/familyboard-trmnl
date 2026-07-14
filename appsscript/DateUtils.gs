/**
 * Date utility functions.
 */
class DateUtils {

  static startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static formatTime(date) {
    return Utilities.formatDate(
      date,
      CONFIG.timeZone,
      "HH:mm"
    );
  }

  static formatWeekday(date) {
    const value = date.toLocaleDateString(CONFIG.locale, {
      weekday: "long",
      timeZone: CONFIG.timeZone
    });

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  static formatDate(date) {
    const value = date.toLocaleDateString(CONFIG.locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: CONFIG.timeZone
    });

    return value
      .replace(".", "")
      .replace(/^./, c => c.toUpperCase());
  }

  static isMultiDay(start, end) {
    return (
      this.startOfDay(end).getTime() -
      this.startOfDay(start).getTime()
    ) > 24 * 60 * 60 * 1000;
  }

}
