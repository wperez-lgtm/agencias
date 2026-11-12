import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { DateRange } from '../../domain/availability.models';

/** Replica las reglas de la API para no gastar consultas del límite por minuto. */
export function dateRangeValidator(today: () => string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const { start, end } = group.value as DateRange;
    if (!start || !end) {
      return { required: true };
    }
    if (start < today()) {
      return { startInPast: true };
    }
    return end < start ? { endBeforeStart: true } : null;
  };
}
