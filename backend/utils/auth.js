/**
 * Calculates Unix timestamp (in seconds) for 11:59:59 PM IST (UTC+05:30) of the current day.
 * Ensures session tokens expire at 11:59:59 PM IST regardless of host machine timezone.
 */
function getEndOfTodayISTSeconds() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(new Date()); // "YYYY-MM-DD"
  const endOfDayIST = new Date(`${todayStr}T23:59:59+05:30`);
  return Math.floor(endOfDayIST.getTime() / 1000);
}

module.exports = {
  getEndOfTodayISTSeconds,
};

