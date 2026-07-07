/**
 * Timezone utilities for datetime operations
 * Provides functions for working with timezones and timezone data
 */

/**
 * Retrieves a list of supported time zones with their labels and values
 * This function fetches the available time zones from the environment,
 * formats their offsets (e.g., "GMT+2"), and returns them in a sorted array.
 * Useful for timezone selection dropdowns and user preferences.
 *
 * @returns An array of time zone objects with label and value properties, sorted by offset
 *
 * @example
 * ```ts
 * import { getTimeZones } from '@/utils/functions';
 *
 * // Get all available timezones
 * const timezones = getTimeZones();
 * // Returns: [
 * //   { label: "(GMT-12) Etc/GMT+12", value: "Etc/GMT+12" },
 * //   { label: "(GMT-11) Pacific/Midway", value: "Pacific/Midway" },
 * //   { label: "(GMT+0) Europe/London", value: "Europe/London" },
 * //   { label: "(GMT+1) Europe/Paris", value: "Europe/Paris" },
 * //   ...
 * // ]
 *
 * // Use in a select dropdown
 * const TimezoneSelect = () => (
 *   <select>
 *     {getTimeZones().map(tz => (
 *       <option key={tz.value} value={tz.value}>
 *         {tz.label}
 *       </option>
 *     ))}
 *   </select>
 * );
 *
 * // Find specific timezone
 * const userTimezone = getTimeZones().find(tz =>
 *   tz.value === 'America/New_York'
 * );
 * ```
 */
export const getTimeZones = (): { label: string; value: string; numericOffset: number }[] => {
  // `Intl.supportedValuesOf` is unavailable on older engines (e.g. Node <18.14,
  // older Safari). Fall back to a small common list so the helper never throws.
  const safeSupported = (): string[] => {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      try {
        return Intl.supportedValuesOf("timeZone");
      } catch {
        // ignore — fall through
      }
    }
    return [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
    ];
  };

  const timezones = safeSupported();

  // Parse a "GMT[+|-]h(:mm)?" offset into a numeric value (minutes-from-UTC)
  // so half/quarter-hour zones (e.g. +5:30, +5:45, -3:30) sort correctly.
  // Previously `parseInt("5:30")` returned `5`, tying India with Uzbekistan.
  const parseOffsetMinutes = (offset: string): number => {
    const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number.parseInt(match[2] ?? "0", 10);
    const minutes = Number.parseInt(match[3] ?? "0", 10);
    return sign * (hours * 60 + minutes);
  };

  return timezones
    .map((timezone) => {
      const formatter = new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        timeZoneName: "shortOffset",
      });
      const parts = formatter.formatToParts(new Date());
      const offset = parts.find((part) => part.type === "timeZoneName")?.value || "";
      const formattedOffset = offset === "GMT" ? "GMT+0" : offset;

      return {
        value: timezone,
        label: `(${formattedOffset}) ${timezone.replace(/_/g, " ")}`,
        numericOffset: parseOffsetMinutes(formattedOffset),
      };
    })
    .sort((a, b) => a.numericOffset - b.numericOffset);
};
