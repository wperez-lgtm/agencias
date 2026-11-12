import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AvailabilityStore } from '../public/js/features/availability/application/availability.store.js';
import { AvailabilityError } from '../public/js/features/availability/domain/availability.repository.js';

const RANGE = { start: '2026-11-10', end: '2026-11-20' };

function ship(name, free) {
  return { name, type: 1, itinerary: [{ name: 'C', price: 100, promo: null, free }] };
}

/** Repositorio cuyas búsquedas se resuelven a mano, para controlar el orden de las respuestas. */
function manualRepository() {
  const pending = [];
  const repository = {
    search: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  };
  return { repository, pending };
}

async function storeWith(ships) {
  const store = new AvailabilityStore({ search: () => Promise.resolve(ships) });
  await store.search(RANGE);
  return store;
}

describe('AvailabilityStore', () => {
  it('indica que está cargando durante la búsqueda', async () => {
    const { repository, pending } = manualRepository();
    const store = new AvailabilityStore(repository);

    const search = store.search(RANGE);
    assert.equal(store.loading, true);
    assert.equal(store.hasResults, false);

    pending[0].resolve([ship('A', 2)]);
    await search;
    assert.equal(store.loading, false);
    assert.equal(store.hasResults, true);
  });

  it('ignora la respuesta de una búsqueda anterior que llega tarde', async () => {
    const { repository, pending } = manualRepository();
    const store = new AvailabilityStore(repository);

    const first = store.search(RANGE);
    const second = store.search(RANGE);
    pending[1].resolve([ship('Nueva', 2)]);
    await second;
    pending[0].resolve([ship('Vieja', 2)]);
    await first;

    assert.deepEqual(store.visibleShips.map(({ name }) => name), ['Nueva']);
  });

  it('muestra el mensaje de un error de dominio', async () => {
    const store = new AvailabilityStore({ search: () => Promise.reject(new AvailabilityError('Falló.')) });

    await store.search(RANGE);

    assert.equal(store.error, 'Falló.');
    assert.equal(store.hasResults, false);
  });

  it('usa un mensaje genérico ante un error inesperado', async () => {
    const store = new AvailabilityStore({ search: () => Promise.reject(new TypeError('x')) });

    await store.search(RANGE);

    assert.match(store.error, /interpretar/);
  });

  it('limpia el barco elegido cuando deja de estar disponible', async () => {
    const store = await storeWith([ship('A', 5), ship('B', 1)]);
    store.selectShip('B');
    assert.deepEqual(store.visibleShips.map(({ name }) => name), ['B']);

    store.setMinFree(3);

    assert.equal(store.selectedShip, '');
    assert.deepEqual(store.availableShips.map(({ name }) => name), ['A']);
  });

  it('avisa a los suscriptores cada vez que cambia el estado', async () => {
    const store = await storeWith([ship('A', 5)]);
    let notifications = 0;
    store.subscribe(() => notifications++);

    store.setMinFree(2);
    store.selectShip('A');

    assert.equal(notifications, 2);
  });
});
