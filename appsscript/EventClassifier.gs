/**
 * Resolves the type of an event from its title.
 */
class EventClassifier {

  /**
   * Determines the event type.
   *
   * @param {string} title Event title.
   * @returns {string} An EVENT_TYPE constant.
   */
  static resolve(title) {

    const value = this.normalize(title);

    if (
      value.includes("anniversaire") ||
      value.includes("birthday")
    ) {
      return EVENT_TYPE.BIRTHDAY;
    }

    if (
      value.includes("camp") ||
      value.includes("colonie")
    ) {
      return EVENT_TYPE.CAMP;
    }

    if (
      value.includes("vacances") ||
      value.includes("ferie") ||
      value.includes("férié")
    ) {
      return EVENT_TYPE.HOLIDAY;
    }

    if (
      value.includes("voyage") ||
      value.includes("depart") ||
      value.includes("départ") ||
      value.includes("train") ||
      value.includes("avion")
    ) {
      return EVENT_TYPE.TRAVEL;
    }

    if (
      value.includes("ecole") ||
      value.includes("école") ||
      value.includes("rentree") ||
      value.includes("rentrée")
    ) {
      return EVENT_TYPE.SCHOOL;
    }

    if (
      value.includes("football") ||
      value.includes("foot") ||
      value.includes("tennis") ||
      value.includes("natation") ||
      value.includes("basket") ||
      value.includes("sport")
    ) {
      return EVENT_TYPE.SPORT;
    }

    if (
      value.includes("dentiste") ||
      value.includes("orthodontiste") ||
      value.includes("medecin") ||
      value.includes("médecin") ||
      value.includes("hopital") ||
      value.includes("hôpital")
    ) {
      return EVENT_TYPE.MEDICAL;
    }

    return EVENT_TYPE.GENERIC;
  }

  /**
   * Normalizes text for comparisons.
   *
   * @param {string} value
   * @returns {string}
   */
  static normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

}
