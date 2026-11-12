import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  discountPercent,
  filterAvailableShips,
  filterBySelectedShip,
  occupancyOf,
  summarizeAvailability,
} from '../public/js/features/availability/domain/availability.rules.js';

const PROMO = { date: '2026-11-12', amount: 80, observation: null };

function itinerary(overrides) {
  return { name: 'C', price: 100, promo: null, free: 4, hold: 0, capacity: 16, ...overrides };
}

function ship(name, itineraries) {
  return { name, type: 1, itinerary: itineraries };
}

describe('reglas de disponibilidad', () => {
  it('descarta barcos sin espacio suficiente y calcula el precio desde', () => {
    const result = filterAvailableShips(
      [ship('A', [itinerary({ free: 1 }), itinerary({ free: 5, promo: PROMO })]), ship('B', [itinerary({ free: 1 })])],
      3,
    );

    assert.deepEqual(result.map((item) => item.name), ['A']);
    assert.equal(result[0].itinerary.length, 1);
    assert.equal(result[0].fromPrice, 80);
  });

  it('sin barco elegido devuelve todos', () => {
    const ships = filterAvailableShips([ship('A', [itinerary({})]), ship('B', [itinerary({})])], 1);

    assert.equal(filterBySelectedShip(ships, '').length, 2);
    assert.deepEqual(filterBySelectedShip(ships, 'B').map((item) => item.name), ['B']);
  });

  it('resume salidas, barcos, espacios y promociones', () => {
    const ships = filterAvailableShips([ship('A', [itinerary({ free: 2, promo: PROMO }), itinerary({ free: 3 })])], 1);

    assert.deepEqual(summarizeAvailability(ships), { departures: 2, ships: 1, freeSpaces: 5, promotions: 1 });
  });

  it('calcula el descuento y nunca divide entre cero', () => {
    assert.equal(discountPercent(itinerary({ promo: PROMO })), 20);
    assert.equal(discountPercent(itinerary({ price: 0, promo: PROMO })), 0);
  });

  it('una promoción sin monto no es descuento y conserva el precio normal', () => {
    const promo = { date: '2027-09-21', amount: null, observation: 'Free Air Ticket' };
    const [result] = filterAvailableShips([ship('A', [itinerary({ promo })])], 1);

    assert.equal(discountPercent(result.itinerary[0]), 0);
    assert.equal(result.fromPrice, 100);
  });

  it('nunca ofrece salidas agotadas, aunque el mínimo sea cero', () => {
    assert.deepEqual(filterAvailableShips([ship('A', [itinerary({ free: 0 })])], 0), []);
  });

  it('no cuenta dos veces los espacios de un itinerario combinado', () => {
    const ships = filterAvailableShips(
      [ship('A', [itinerary({ name: 'C', free: 12 }), itinerary({ name: 'A', free: 10 }), itinerary({ name: 'C+A', free: 10 })])],
      1,
    );

    assert.equal(summarizeAvailability(ships).departures, 3);
    assert.equal(summarizeAvailability(ships).freeSpaces, 22);
  });

  it('la ocupación nunca supera el 100 %', () => {
    const { freePercent, holdPercent } = occupancyOf(itinerary({ free: 12, hold: 16, capacity: 16 }));

    assert.equal(freePercent + holdPercent, 100);
  });
});
