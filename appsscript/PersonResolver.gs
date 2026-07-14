/**
 * Resolves the family member associated with an event.
 */
class PersonResolver {

  /**
   * Finds a person from an event title.
   *
   * Supported examples:
   * - Ruben - Football
   * - [Ruben] Football
   * - Vasco: Dentiste
   *
   * @param {string} title Event title.
   * @returns {string} A PERSON constant.
   */
  static resolve(title) {
    const normalizedTitle = this.normalize(title);

    for (const personKey in CONFIG.people) {
      const person = CONFIG.people[personKey];
      const aliases = person.aliases || [];

      const matches = aliases.some((alias) => {
        return normalizedTitle.includes(this.normalize(alias));
      });

      if (matches) {
        return personKey;
      }
    }

    return PERSON.FAMILY;
  }

  /**
   * Removes the detected person's prefix from an event title.
   *
   * @param {string} title Event title.
   * @param {string} personKey Resolved person key.
   * @returns {string}
   */
  static cleanTitle(title, personKey) {
    const originalTitle = String(title || "").trim();
    const person = CONFIG.people[personKey];

    if (!person) {
      return originalTitle;
    }

    let cleanedTitle = originalTitle;
    const aliases = person.aliases || [];

    aliases.forEach((alias) => {
      const escapedAlias = this.escapeRegExp(alias);

      const prefixPattern = new RegExp(
        `^\\s*(?:\\[${escapedAlias}\\]|${escapedAlias})\\s*[-:–—]?\\s*`,
        "i"
      );

      cleanedTitle = cleanedTitle.replace(prefixPattern, "");
    });

    return cleanedTitle.trim() || originalTitle;
  }

  /**
   * Returns the configured icon for a person.
   *
   * @param {string} personKey
   * @returns {string}
   */
  static getIcon(personKey) {
    const person = CONFIG.people[personKey];

    return person ? person.icon : "";
  }

  /**
   * Normalizes text for case-insensitive and accent-insensitive matching.
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

  /**
   * Escapes special characters before inserting text into a RegExp.
   *
   * @param {string} value
   * @returns {string}
   */
  static escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
