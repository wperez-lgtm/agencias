import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { DateRange, Itinerary, Ship } from '../domain/availability.models';
import { AvailabilityError, AvailabilityRepository } from '../domain/availability.repository';
import { AvailabilityStore } from './availability.store';

const RANGE: DateRange = { start: '2026-11-10', end: '2026-11-20' };

function ship(name: string, free: number): Ship {
  return { name, type: 1, itinerary: [{ price: 100, promo: null, free } as Itinerary] };
}

class FakeAvailabilityRepository extends AvailabilityRepository {
  result: Observable<Ship[]> = of([ship('A', 2), ship('B', 8)]);

  override search(): Observable<Ship[]> {
    return this.result;
  }
}

describe('AvailabilityStore', () => {
  let store: AvailabilityStore;
  let repository: FakeAvailabilityRepository;

  beforeEach(() => {
    repository = new FakeAvailabilityRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: AvailabilityRepository, useValue: repository }],
    });
    store = TestBed.inject(AvailabilityStore);
  });

  it('ofrece solo los barcos con salidas disponibles', () => {
    store.search(RANGE);
    store.setMinFree(5);

    expect(store.availableShips().map(({ name }) => name)).toEqual(['B']);
  });

  it('elegir un barco no cambia las opciones, solo lo visible', () => {
    store.search(RANGE);
    store.selectShip('A');

    expect(store.availableShips()).toHaveLength(2);
    expect(store.visibleShips().map(({ name }) => name)).toEqual(['A']);
  });

  it('vuelve a todos los barcos si el elegido se queda sin salidas', () => {
    store.search(RANGE);
    store.selectShip('A');
    store.setMinFree(5);
    TestBed.tick();

    expect(store.selectedShip()).toBe('');
    expect(store.visibleShips().map(({ name }) => name)).toEqual(['B']);
  });

  it('expone el mensaje de los errores de dominio', () => {
    repository.result = throwError(() => new AvailabilityError('Sin conexión'));
    store.search(RANGE);

    expect(store.error()).toBe('Sin conexión');
    expect(store.hasResults()).toBe(false);
  });
});
