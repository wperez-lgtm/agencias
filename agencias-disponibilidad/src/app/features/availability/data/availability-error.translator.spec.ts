import { HttpErrorResponse } from '@angular/common/http';

import { translateHttpError } from './availability-error.translator';

describe('translateHttpError', () => {
  it('muestra el detalle de validación que llega con estado 401', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: { message: 'Dato(s) invalido(s)', errors: { ship_id: ['The selected ship id is invalid.'] } },
    });

    expect(translateHttpError(error)).toBe('The selected ship id is invalid.');
  });

  it('explica el límite de consultas', () => {
    expect(translateHttpError(new HttpErrorResponse({ status: 429 }))).toContain('límite');
  });

  it('explica los problemas de conexión', () => {
    expect(translateHttpError(new HttpErrorResponse({ status: 0 }))).toContain('conexión');
  });

  it('usa el mensaje genérico cuando ningún otro caso aplica', () => {
    expect(translateHttpError(new HttpErrorResponse({ status: 500 }))).toContain('(500)');
  });
});
