import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { translateHttpError } from '../public/js/features/availability/data/availability-error.translator.js';
import { HttpAvailabilityRepository } from '../public/js/features/availability/data/http-availability.repository.js';
import { AvailabilityError } from '../public/js/features/availability/domain/availability.repository.js';

const BASE_URL = 'https://api.test/ship';
const RANGE = { start: '2026-11-10', end: '2026-11-20' };

function repositoryAnswering(answer) {
  const calls = [];
  const repository = new HttpAvailabilityRepository(BASE_URL, (options) => {
    calls.push(options);
    return answer();
  });
  return { repository, calls };
}

function departure(id, start, prices = { normal: 1, save: 1, promo: 1 }) {
  return { id, date: { start, end: start }, package: prices };
}

describe('HttpAvailabilityRepository', () => {
  it('consulta todos los barcos con el rango pedido', async () => {
    const { repository, calls } = repositoryAnswering(() => Promise.resolve({ successful: true, data: null }));

    await repository.search(RANGE);

    assert.equal(calls[0].url, `${BASE_URL}/0/2026-11-10/2026-11-20`);
  });

  it('descarta salidas anteriores al rango, ordena y convierte precios en texto', async () => {
    const response = {
      successful: true,
      data: {
        ship: [
          {
            name: 'M/Y Galaxy Skape',
            type: 5,
            itinerary: [
              departure(3, '2026-11-12'),
              departure(1, '2026-11-04'),
              departure(2, '2026-11-10', { normal: '1300.00', save: 1040, promo: null }),
            ],
          },
        ],
      },
    };
    const { repository } = repositoryAnswering(() => Promise.resolve(response));

    const [ship] = await repository.search(RANGE);

    assert.deepEqual(ship.itinerary.map((itinerary) => itinerary.id), [2, 3]);
    assert.deepEqual(ship.itinerary[0].package, { normal: 1300, save: 1040, promo: null });
  });

  it('interpreta data nula como una búsqueda sin salidas', async () => {
    const { repository } = repositoryAnswering(() => Promise.resolve({ successful: true, data: null }));

    assert.deepEqual(await repository.search(RANGE), []);
  });

  it('rechaza una respuesta marcada como no exitosa', async () => {
    const { repository } = repositoryAnswering(() => Promise.resolve({ successful: false }));

    await assert.rejects(repository.search(RANGE), AvailabilityError);
  });

  it('convierte los errores HTTP en errores de dominio', async () => {
    const { repository } = repositoryAnswering(() => Promise.reject({ status: 429 }));

    await assert.rejects(repository.search(RANGE), AvailabilityError);
  });
});

describe('translateHttpError', () => {
  it('reconoce la falta de conexión', () => {
    assert.match(translateHttpError({ status: 0 }), /conectar/);
  });

  it('reconoce el límite de consultas', () => {
    assert.match(translateHttpError({ status: 429 }), /límite/);
  });

  it('une los mensajes de validación de la API', () => {
    const xhr = { status: 401, responseJSON: { message: 'x', errors: { start: ['Uno.'], end: ['Dos.'] } } };

    assert.equal(translateHttpError(xhr), 'Uno. Dos.');
  });

  it('informa el código en cualquier otro error, aunque el cuerpo sea HTML', () => {
    assert.match(translateHttpError({ status: 500, responseText: '<html>' }), /\(500\)/);
  });
});
