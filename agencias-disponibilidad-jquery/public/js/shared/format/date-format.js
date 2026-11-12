const LOCALE = 'es';

const WEEKDAY = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const MONTH = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

/** Lee la fecha como local: `new Date('2026-11-14')` la tomaría en UTC y en Ecuador mostraría el día anterior. */
function parseIsoDate(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shortMonth(date) {
  return MONTH.format(date).replace('.', '');
}

export function weekdayOf(iso) {
  return WEEKDAY.format(parseIsoDate(iso)).replace('.', '');
}

export function dayOf(iso) {
  return String(parseIsoDate(iso).getDate());
}

export function monthYearOf(iso) {
  const date = parseIsoDate(iso);
  return `${shortMonth(date)} ${date.getFullYear()}`;
}

export function dayMonthOf(iso) {
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${shortMonth(date)}`;
}

export function dayMonthYearOf(iso) {
  const date = parseIsoDate(iso);
  return `${date.getDate()} ${shortMonth(date)} ${date.getFullYear()}`;
}
