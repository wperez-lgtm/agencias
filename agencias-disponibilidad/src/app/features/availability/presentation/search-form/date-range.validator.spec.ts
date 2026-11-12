import { FormControl, FormGroup } from '@angular/forms';

import { dateRangeValidator } from './date-range.validator';

const TODAY = '2026-11-09';

function errorsFor(start: string, end: string) {
  return dateRangeValidator(() => TODAY)(
    new FormGroup({ start: new FormControl(start), end: new FormControl(end) }),
  );
}

describe('dateRangeValidator', () => {
  it('acepta un rango válido que empieza hoy', () => {
    expect(errorsFor(TODAY, TODAY)).toBeNull();
  });

  it('rechaza una fecha de inicio pasada', () => {
    expect(errorsFor('2026-11-08', '2026-11-20')).toEqual({ startInPast: true });
  });

  it('rechaza una fecha final anterior a la de inicio', () => {
    expect(errorsFor('2026-11-20', '2026-11-10')).toEqual({ endBeforeStart: true });
  });

  it('exige las dos fechas', () => {
    expect(errorsFor('', '2026-11-10')).toEqual({ required: true });
  });
});
