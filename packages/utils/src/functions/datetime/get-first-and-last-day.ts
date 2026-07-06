/**
 * Utility function for calculating billing or subscription periods
 * Provides date range calculations based on a specific day of the month
 */

/**
 * Calculates the first and last day of a period based on a specific day of the month
 * Useful for determining billing cycles, subscription periods, etc.
 *
 * @param day - The day of the month that marks the boundary of the period (1-31)
 * @param referenceDate - Optional reference date (defaults to current date)
 * @returns An object containing the first and last day of the period
 *
 * @example
 * ```ts
 * // If today is May 20, 2023 and the billing day is the 15th
 * getFirstAndLastDay(15)
 * // Returns:
 * // {
 * //   firstDay: new Date("2023-05-15T00:00:00"), // May 15, 2023
 * //   lastDay: new Date("2023-06-14T00:00:00")   // June 14, 2023
 * // }
 *
 * // If today is May 10, 2023 and the billing day is the 15th
 * getFirstAndLastDay(15)
 * // Returns:
 * // {
 * //   firstDay: new Date("2023-04-15T00:00:00"), // April 15, 2023
 * //   lastDay: new Date("2023-05-14T00:00:00")   // May 14, 2023
 * // }
 *
 * // With a specific reference date
 * getFirstAndLastDay(15, new Date('2023-05-20'))
 * // Returns the same result as the first example
 * ```
 */
export const getFirstAndLastDay = (
  day: number,
  referenceDate: Date = new Date(),
): { firstDay: Date; lastDay: Date } => {
  const today = referenceDate;
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Cap the requested day to the last day of a given (year, month) so that
  // boundary values like 31 don't roll over into the next month
  // (e.g. Feb 31 → Mar 3 in naive `new Date(year, month, day)`).
  const lastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const clamp = (year: number, month: number, requested: number) =>
    Math.min(requested, lastDayOfMonth(year, month));

  if (currentDay >= day) {
    // we just passed `day` earlier this period — current period starts on `day`
    const firstDayClamped = clamp(currentYear, currentMonth, day);
    const lastMonth = currentMonth + 1;
    const lastYear = currentYear + (currentMonth === 11 ? 1 : 0);
    // lastDay = day - 1 of next month, but clamp in case next month is shorter
    const lastDayClamped = clamp(
      lastMonth === 12 ? lastYear : currentYear,
      lastMonth % 12,
      Math.max(1, day - 1),
    );
    return {
      firstDay: new Date(currentYear, currentMonth, firstDayClamped),
      lastDay: new Date(lastMonth === 12 ? lastYear : currentYear, lastMonth % 12, lastDayClamped),
    };
  }
  // we haven't reached `day` yet — current period started in the previous month
  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const firstDayClamped = clamp(lastYear, lastMonth, day);
  const lastDayClamped = clamp(currentYear, currentMonth, Math.max(1, day - 1));
  return {
    firstDay: new Date(lastYear, lastMonth, firstDayClamped),
    lastDay: new Date(currentYear, currentMonth, lastDayClamped),
  };
};
