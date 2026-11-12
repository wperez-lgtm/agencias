import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PricePipe } from './price.pipe';

describe('PricePipe', () => {
  let pipe: PricePipe;

  beforeEach(() => {
    registerLocaleData(localeEs);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es' }] });
    pipe = TestBed.runInInjectionContext(() => new PricePipe());
  });

  it('muestra los montos enteros sin decimales', () => {
    expect(pipe.transform(5680)).toBe('$5.680');
  });

  it('muestra siempre dos decimales cuando hay centavos', () => {
    expect(pipe.transform(3697.5)).toBe('$3.697,50');
  });

  it('no muestra un signo de dólar suelto si falta el precio', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});
