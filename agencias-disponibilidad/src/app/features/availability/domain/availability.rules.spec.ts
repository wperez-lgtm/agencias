import { Itinerary, Ship } from './availability.models';
import {
  discountPercent,
  filterAvailableShips,
  filterBySelectedShip,
  occupancyOf,
  summarizeAvailability,
} from './availability.rules';

function itinerary(overrides: Partial<Itinerary>): Itinerary {
  return { name: 'C', price: 100, promo: null, free: 4, hold: 0, capacity: 16, ...overrides } as Itinerary;
}

function ship(name: string, itineraries: Itinerary[]): Ship {
  return { name, type: 1, itinerary: itineraries };
}

describe('availability rules', () => {
  it('descarta barcos sin salidas con espacio suficiente y calcula el precio desde', () => {
    const promo = { date: '2026-11-12', amount: 80, observation: null };
    const ships = [
      ship('A', [itinerary({ free: 1 }), itinerary({ free: 5, promo })]),
      ship('B', [itinerary({ free: 1 })]),
    ];

    const result = filterAvailableShips(ships, 3);

    expect(result.map((item) => item.name)).toEqual(['A']);
    expect(result[0].itinerary).toHaveLength(1);
    expect(result[0].fromPrice).toBe(80);
  });

  it('sin barco elegido devuelve todos', () => {
    const ships = filterAvailableShips([ship('A', [itinerary({})]), ship('B', [itinerary({})])], 1);

    expect(filterBySelectedShip(ships, '')).toHaveLength(2);
    expect(filterBySelectedShip(ships, 'B').map((item) => item.name)).toEqual(['B']);
  });

  it('resume salidas, barcos, espacios y promociones', () => {
    const promo = { date: '2026-11-12', amount: 80, observation: null };
    const ships = filterAvailableShips([ship('A', [itinerary({ free: 2, promo }), itinerary({ free: 3 })])], 1);

    expect(summarizeAvailability(ships)).toEqual({ departures: 2, ships: 1, freeSpaces: 5, promotions: 1 });
  });

  it('calcula el descuento y nunca divide entre cero', () => {
    const promo = { date: '2026-11-12', amount: 80, observation: null };

    expect(discountPercent(itinerary({ promo }))).toBe(20);
    expect(discountPercent(itinerary({ price: 0, promo }))).toBe(0);
  });

  it('una promoción sin monto no es un descuento y conserva el precio normal', () => {
    const promo = { date: '2027-09-21', amount: null, observation: 'Free Air Ticket' };
    const [result] = filterAvailableShips([ship('A', [itinerary({ promo })])], 1);

    expect(discountPercent(result.itinerary[0])).toBe(0);
    expect(result.fromPrice).toBe(100);
  });

  it('nunca ofrece salidas agotadas, aunque el mínimo sea cero', () => {
    expect(filterAvailableShips([ship('A', [itinerary({ free: 0 })])], 0)).toEqual([]);
  });

  it('no cuenta dos veces los espacios de un itinerario combinado', () => {
    const ships = filterAvailableShips(
      [
        ship('A', [
          itinerary({ name: 'C', free: 12 }),
          itinerary({ name: 'A', free: 10 }),
          itinerary({ name: 'C+A', free: 10 }),
        ]),
      ],
      1,
    );

    expect(summarizeAvailability(ships)).toMatchObject({ departures: 3, freeSpaces: 22 });
  });

  it('la ocupación nunca supera el 100 %', () => {
    const { freePercent, holdPercent } = occupancyOf(itinerary({ free: 12, hold: 16, capacity: 16 }));

    expect(freePercent + holdPercent).toBe(100);
  });
});
