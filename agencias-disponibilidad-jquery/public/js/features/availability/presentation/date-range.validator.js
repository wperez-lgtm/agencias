export const DateRangeError = {
  Required: 'required',
  StartInPast: 'startInPast',
  EndBeforeStart: 'endBeforeStart',
};

/** Replica las reglas de la API para no gastar consultas del límite por minuto. */
export function validateDateRange({ start, end }, today) {
  if (!start || !end) {
    return DateRangeError.Required;
  }
  if (start < today) {
    return DateRangeError.StartInPast;
  }
  return end < start ? DateRangeError.EndBeforeStart : null;
}
