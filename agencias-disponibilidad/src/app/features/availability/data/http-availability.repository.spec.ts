import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Ship } from '../domain/availability.models';
import { AvailabilityError } from '../domain/availability.repository';
import { HttpAvailabilityRepository } from './http-availability.repository';

const URL = `${environment.availabilityApiUrl}/0/2026-11-10/2026-11-20`;
const RANGE = { start: '2026-11-10', end: '2026-11-20' };

describe('HttpAvailabilityRepository', () => {
  let repository: HttpAvailabilityRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpAvailabilityRepository],
    });
    repository = TestBed.inject(HttpAvailabilityRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('descarta salidas anteriores al rango y convierte a número los precios en texto', () => {
    let ships: Ship[] = [];
    repository.search(RANGE).subscribe((result) => (ships = result));

    http.expectOne(URL).flush({
      successful: true,
      data: {
        ship: [
          {
            name: 'M/Y Galaxy Skape',
            type: 5,
            itinerary: [
              { id: 1, date: { start: '2026-11-04', end: '2026-11-08' }, package: { normal: 1, save: 1, promo: 1 } },
              {
                id: 2,
                date: { start: '2026-11-10', end: '2026-11-10' },
                package: { normal: '1300.00', save: 1040, promo: null },
              },
            ],
          },
        ],
      },
    });

    expect(ships[0].itinerary.map((itinerary) => itinerary.id)).toEqual([2]);
    expect(ships[0].itinerary[0].package).toEqual({ normal: 1300, save: 1040, promo: null });
  });

  it('interpreta data nula como una búsqueda sin salidas', () => {
    let ships: Ship[] | undefined;
    repository.search(RANGE).subscribe((result) => (ships = result));

    http.expectOne(URL).flush({ successful: true, data: null });

    expect(ships).toEqual([]);
  });

  it('convierte los errores HTTP en errores de dominio', () => {
    let failure: unknown;
    repository.search(RANGE).subscribe({ error: (error) => (failure = error) });

    http.expectOne(URL).flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(failure).toBeInstanceOf(AvailabilityError);
  });
});
