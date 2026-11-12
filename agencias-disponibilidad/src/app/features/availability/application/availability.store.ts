import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';

import { DateRange, Ship } from '../domain/availability.models';
import { AvailabilityError, AvailabilityRepository } from '../domain/availability.repository';
import {
  DEFAULT_MIN_FREE,
  NO_SHIP_SELECTED,
  filterAvailableShips,
  filterBySelectedShip,
  summarizeAvailability,
} from '../domain/availability.rules';

const UNEXPECTED_ERROR_MESSAGE = 'No se pudo interpretar la respuesta de disponibilidad.';

type SearchOutcome = { ships: Ship[]; error: null } | { ships: null; error: string };

function toErrorMessage(error: unknown): string {
  return error instanceof AvailabilityError ? error.message : UNEXPECTED_ERROR_MESSAGE;
}

/** Facade: única puerta de la interfaz hacia el estado y las reglas de disponibilidad. */
@Injectable({ providedIn: 'root' })
export class AvailabilityStore {
  private readonly repository = inject(AvailabilityRepository);
  private readonly searches = new Subject<DateRange>();

  private readonly ships = signal<Ship[] | null>(null);
  private readonly minFree = signal(DEFAULT_MIN_FREE);
  private readonly selectedShipName = signal(NO_SHIP_SELECTED);
  private readonly isLoading = signal(false);
  private readonly errorMessage = signal<string | null>(null);

  readonly loading = this.isLoading.asReadonly();
  readonly error = this.errorMessage.asReadonly();
  readonly selectedShip = this.selectedShipName.asReadonly();

  readonly hasResults = computed(() => this.ships() !== null && !this.isLoading());
  readonly availableShips = computed(() => filterAvailableShips(this.ships() ?? [], this.minFree()));
  readonly visibleShips = computed(() => filterBySelectedShip(this.availableShips(), this.selectedShipName()));
  readonly summary = computed(() => summarizeAvailability(this.visibleShips()));

  constructor() {
    this.searches
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
        }),
        // switchMap descarta la respuesta de una búsqueda anterior aún en curso.
        switchMap((range) => this.runSearch(range)),
        takeUntilDestroyed(),
      )
      .subscribe(({ ships, error }) => {
        this.isLoading.set(false);
        this.ships.set(ships);
        this.errorMessage.set(error);
      });

    effect(() => this.clearSelectionWhenUnavailable());
  }

  search(range: DateRange): void {
    this.searches.next(range);
  }

  setMinFree(minFree: number): void {
    this.minFree.set(minFree);
  }

  selectShip(name: string): void {
    this.selectedShipName.set(name);
  }

  private runSearch(range: DateRange) {
    return this.repository.search(range).pipe(
      map((ships): SearchOutcome => ({ ships, error: null })),
      catchError((error: unknown) => of<SearchOutcome>({ ships: null, error: toErrorMessage(error) })),
    );
  }

  private clearSelectionWhenUnavailable(): void {
    const selected = this.selectedShipName();
    const isAvailable = this.availableShips().some((ship) => ship.name === selected);
    if (selected !== NO_SHIP_SELECTED && this.ships() !== null && !isAvailable) {
      this.selectedShipName.set(NO_SHIP_SELECTED);
    }
  }
}
