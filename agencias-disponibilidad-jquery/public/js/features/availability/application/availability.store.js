import { AvailabilityError } from '../domain/availability.repository.js';
import {
  DEFAULT_MIN_FREE,
  NO_SHIP_SELECTED,
  filterAvailableShips,
  filterBySelectedShip,
  summarizeAvailability,
} from '../domain/availability.rules.js';

const UNEXPECTED_ERROR_MESSAGE = 'No se pudo interpretar la respuesta de disponibilidad.';

function toErrorMessage(error) {
  return error instanceof AvailabilityError ? error.message : UNEXPECTED_ERROR_MESSAGE;
}

/** Facade y Observer: única puerta de la interfaz hacia el estado; avisa a quien se suscriba cuando cambia. */
export class AvailabilityStore {
  #repository;
  #listeners = new Set();
  #ships = null;
  #minFree = DEFAULT_MIN_FREE;
  #selectedShip = NO_SHIP_SELECTED;
  #loading = false;
  #error = null;
  #latestSearchId = 0;

  constructor(repository) {
    this.#repository = repository;
  }

  get loading() {
    return this.#loading;
  }

  get error() {
    return this.#error;
  }

  get selectedShip() {
    return this.#selectedShip;
  }

  get hasResults() {
    return this.#ships !== null && !this.#loading;
  }

  get availableShips() {
    return filterAvailableShips(this.#ships ?? [], this.#minFree);
  }

  get visibleShips() {
    return filterBySelectedShip(this.availableShips, this.#selectedShip);
  }

  get summary() {
    return summarizeAvailability(this.visibleShips);
  }

  subscribe(listener) {
    this.#listeners.add(listener);
  }

  async search(range) {
    const searchId = ++this.#latestSearchId;
    this.#loading = true;
    this.#error = null;
    this.#publish();

    const { ships, error } = await this.#runSearch(range);

    // Descarta la respuesta de una búsqueda que ya fue reemplazada por otra más reciente.
    if (searchId !== this.#latestSearchId) {
      return;
    }
    this.#loading = false;
    this.#ships = ships;
    this.#error = error;
    this.#publish();
  }

  setMinFree(minFree) {
    this.#minFree = minFree;
    this.#publish();
  }

  selectShip(name) {
    this.#selectedShip = name;
    this.#publish();
  }

  async #runSearch(range) {
    try {
      return { ships: await this.#repository.search(range), error: null };
    } catch (error) {
      return { ships: null, error: toErrorMessage(error) };
    }
  }

  #publish() {
    this.#clearSelectionWhenUnavailable();
    this.#listeners.forEach((listener) => listener());
  }

  #clearSelectionWhenUnavailable() {
    const isAvailable = this.availableShips.some((ship) => ship.name === this.#selectedShip);
    if (this.#selectedShip !== NO_SHIP_SELECTED && this.#ships !== null && !isAvailable) {
      this.#selectedShip = NO_SHIP_SELECTED;
    }
  }
}
