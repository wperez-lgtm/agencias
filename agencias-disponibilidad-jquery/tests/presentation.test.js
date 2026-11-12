import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DateRangeError,
  validateDateRange,
} from '../public/js/features/availability/presentation/date-range.validator.js';
import { dayMonthYearOf, dayOf, weekdayOf } from '../public/js/shared/format/date-format.js';
import { formatPrice } from '../public/js/shared/format/price.js';

const TODAY = '2026-11-10';

describe('validateDateRange', () => {
  it('exige las dos fechas', () => {
    assert.equal(validateDateRange({ start: '', end: TODAY }, TODAY), DateRangeError.Required);
  });

  it('rechaza un inicio anterior a hoy', () => {
    assert.equal(validateDateRange({ start: '2026-11-09', end: TODAY }, TODAY), DateRangeError.StartInPast);
  });

  it('rechaza un final anterior al inicio', () => {
    assert.equal(validateDateRange({ start: '2026-11-12', end: '2026-11-11' }, TODAY), DateRangeError.EndBeforeStart);
  });

  it('acepta un rango de un solo día que empieza hoy', () => {
    assert.equal(validateDateRange({ start: TODAY, end: TODAY }, TODAY), null);
  });
});

describe('formatPrice', () => {
  it('usa punto de miles también con cuatro cifras', () => {
    assert.equal(formatPrice(1300), '$1.300');
  });

  it('muestra centavos solo cuando existen', () => {
    assert.equal(formatPrice(3697.5), '$3.697,50');
  });

  it('muestra un guion cuando no hay precio', () => {
    assert.equal(formatPrice(null), '—');
  });
});

describe('formato de fechas', () => {
  it('no se corre al día anterior por la zona horaria', () => {
    assert.equal(dayOf('2026-11-14'), '14');
    assert.equal(weekdayOf('2026-11-14'), 'sáb');
  });

  it('escribe día, mes y año', () => {
    assert.equal(dayMonthYearOf('2026-11-14'), '14 nov 2026');
  });
});
