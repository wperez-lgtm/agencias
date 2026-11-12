import { element } from '../../../shared/dom/elements.js';
import { createResults } from './results.view.js';

function createErrorNotice(message) {
  return element('div', 'notice notice--error')
    .attr('role', 'alert')
    .append(element('h2', null, 'No pudimos completar la búsqueda'), element('p', null, message));
}

function createEmptyNotice() {
  return element('div', 'notice').append(
    element('h2', null, 'Sin salidas para esta búsqueda'),
    element('p', null, 'Prueba con un rango de fechas más amplio, otro barco o menos espacios.'),
  );
}

export class AvailabilityPageView {
  #elements;
  #searchForm;
  #store;

  constructor(elements, searchForm, store) {
    this.#elements = elements;
    this.#searchForm = searchForm;
    this.#store = store;
  }

  start() {
    this.#store.subscribe(() => this.#render());
    this.#render();
    this.#searchForm.submit();
  }

  #render() {
    const store = this.#store;
    this.#searchForm.render({
      shipNames: store.availableShips.map((ship) => ship.name),
      selectedShip: store.selectedShip,
      loading: store.loading,
    });
    this.#elements.$skeletons.prop('hidden', !store.loading);
    this.#renderError();
    this.#renderResults();
  }

  #renderError() {
    const { $feedback } = this.#elements;
    $feedback.empty();
    if (this.#store.error) {
      $feedback.append(createErrorNotice(this.#store.error));
    }
  }

  #renderResults() {
    const { $results } = this.#elements;
    $results.empty();
    if (!this.#store.hasResults) {
      return;
    }
    const summary = this.#store.summary;
    $results.append(summary.departures === 0 ? createEmptyNotice() : createResults(this.#store.visibleShips, summary));
  }
}
